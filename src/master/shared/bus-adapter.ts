/*
 * Client side of the fallback transport: presents the `Worker` interface over
 * the shared BroadcastChannel bus, so spawn() and the invocation proxy work
 * against it exactly as against a real worker.
 *
 * The adapter hellos the (current or future) leader until the worker's init
 * message arrives — this covers joining while an election is still running.
 * When a NEW leader announces itself after the old one died, every pending
 * call is rejected with SharedWorkerLeaderLostError via a synthetic "error"
 * event (the invocation proxy's existing crash handling), and later calls are
 * served by the fresh worker without any re-handshake. Every c2s envelope
 * carries the leader epoch this client believes in, so a new leader can drop
 * jobs that are about to be rejected client-side anyway.
 */
import { SharedWorkerLeaderLostError } from "../../errors"
import { sharedHeartbeat } from "../../shared-heartbeat"
import { Worker as WorkerType } from "../../types/master"
import { MasterMessageType, WorkerMessageType } from "../../types/messages"
import { BusEnvelope, SharedBus } from "./bus"

const HELLO_RETRY_INTERVAL = 400

export class BusClientAdapter implements WorkerType {
  private readonly clientId = Math.random().toString(36).slice(2)
  private readonly bus: SharedBus
  private readonly onTerminate: () => void
  private readonly listeners = new Map<string, Set<(event: any) => void>>()
  private readonly unsubscribeBus: () => void
  private readonly detachPagehide: () => void
  private helloTimer: any
  private heartbeatTimer: any
  private servingLeaderId: string | null = null
  private closed = false

  constructor(bus: SharedBus, onTerminate: () => void = () => undefined) {
    this.bus = bus
    this.onTerminate = onTerminate
    this.unsubscribeBus = bus.subscribe(envelope => this.handleEnvelope(envelope))

    this.hello()
    this.helloTimer = setInterval(() => this.hello(), HELLO_RETRY_INTERVAL)

    const onPagehide = (event: any) => {
      // A bfcache navigation (event.persisted) may come back via the Back
      // button with this page's JS state intact — saying goodbye would leave
      // a restored page holding a dead thread proxy.
      if (event && event.persisted) return
      this.sayBye()
    }
    if (typeof self !== "undefined" && typeof (self as any).addEventListener === "function") {
      ;(self as any).addEventListener("pagehide", onPagehide)
      this.detachPagehide = () => (self as any).removeEventListener("pagehide", onPagehide)
    } else {
      this.detachPagehide = () => undefined
    }
  }

  private hello() {
    this.bus.post({ kind: "hello", clientId: this.clientId })
  }

  private sayBye() {
    if (this.closed) return
    this.bus.post({ kind: "c2s", clientId: this.clientId, msg: { type: MasterMessageType.bye }, leaderId: this.servingLeaderId })
  }

  private emit(type: string, event: any) {
    const set = this.listeners.get(type)
    if (!set) return
    for (const listener of [...set]) {
      listener(event)
    }
  }

  private handleEnvelope(envelope: BusEnvelope) {
    if (this.closed) return

    if (envelope.kind === "s2c" && envelope.clientId === this.clientId) {
      if (envelope.msg && envelope.msg.type === WorkerMessageType.init) {
        clearInterval(this.helloTimer)
        this.servingLeaderId = envelope.leaderId
        if (!this.heartbeatTimer) {
          // Liveness signal so the leader can prune clients that die without
          // a bye. Sent from init on for the adapter's whole lifetime.
          this.heartbeatTimer = setInterval(
            () => this.bus.post({ kind: "hb", clientId: this.clientId }),
            sharedHeartbeat.interval
          )
          if (this.heartbeatTimer && typeof this.heartbeatTimer.unref === "function") {
            this.heartbeatTimer.unref()
          }
        }
      }
      this.emit("message", { data: envelope.msg })
      return
    }

    if (envelope.kind === "s2c-all") {
      this.emit("message", { data: envelope.msg })
      return
    }

    if (envelope.kind === "worker-error") {
      this.emit("error", { data: Error(envelope.message) })
      return
    }

    if (envelope.kind === "leader-online") {
      if (this.servingLeaderId !== null && envelope.leaderId !== this.servingLeaderId) {
        // The leader we were talking to died and a new one took over with a
        // fresh worker. Fail everything in flight; new calls just work.
        this.servingLeaderId = envelope.leaderId
        this.emit("error", { data: new SharedWorkerLeaderLostError() })
      }
      return
    }
  }

  public postMessage(value: any, transferList?: any[]): void {
    if (transferList && transferList.length > 0) {
      throw Error(
        "Transfer() is not supported on the BroadcastChannel fallback path. " +
        "Values sent to a shared worker without native SharedWorker support are structured-cloned, not transferred."
      )
    }
    if (this.closed) {
      // Same semantics as posting to a terminated worker: a silent no-op.
      // This happens legitimately, e.g. an observable unsubscribed after
      // Thread.terminate() posts its cancel message — the underlying
      // BroadcastChannel may already be closed and would throw.
      return
    }
    this.bus.post({ kind: "c2s", clientId: this.clientId, msg: value, leaderId: this.servingLeaderId })
  }

  public addEventListener(type: string, listener: any): void {
    let set = this.listeners.get(type)
    if (!set) {
      set = new Set()
      this.listeners.set(type, set)
    }
    set.add(listener)
  }

  public removeEventListener(type: string, listener: any): void {
    this.listeners.get(type)?.delete(listener)
  }

  public dispatchEvent(): boolean {
    return false
  }

  public terminate(): void {
    this.sayBye()
    this.closed = true
    clearInterval(this.helloTimer)
    clearInterval(this.heartbeatTimer)
    this.detachPagehide()
    this.unsubscribeBus()
    this.listeners.clear()
    this.bus.release()
    this.onTerminate()
  }
}
