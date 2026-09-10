/*
 * Adapts a native SharedWorker's MessagePort to the `Worker` interface the
 * spawn()/invocation-proxy machinery expects, so the entire existing thread
 * pipeline (init handshake, job proxies, observables) works unchanged.
 *
 * terminate() only disconnects THIS tab: it says goodbye (so the worker can
 * cancel this tab's jobs and stop broadcasting to it) and closes the port.
 * The shared worker itself lives on while other tabs are connected.
 */
import { Worker as WorkerType } from "../../types/master"
import { MasterMessageType, WorkerMessageType } from "../../types/messages"

interface MessagePortLike {
  start(): void
  close(): void
  postMessage(message: any, transferList?: any[]): void
  addEventListener(type: string, listener: (event: any) => void): void
  removeEventListener(type: string, listener: (event: any) => void): void
}

export interface SharedWorkerLike {
  port: MessagePortLike
}

export class SharedWorkerPortAdapter implements WorkerType {
  private readonly port: MessagePortLike
  private readonly detachPagehide: () => void
  private closed = false

  constructor(sharedWorker: SharedWorkerLike) {
    this.port = sharedWorker.port

    // Liveness: answer the worker's pings so it can prune ports whose tabs
    // died without a bye.
    this.port.addEventListener("message", (event: any) => {
      if (event && event.data && event.data.type === WorkerMessageType.ping) {
        this.postMessage({ type: MasterMessageType.pong })
      }
    })
    this.port.start()

    // If the tab goes away without Thread.terminate(), still tell the worker,
    // so it can prune this connection from its broadcast set. A bfcache
    // navigation (event.persisted) may be restored with this page's JS state
    // intact — saying goodbye then would leave the restored page holding a
    // dead thread proxy.
    const onPagehide = (event: any) => {
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

  private sayBye() {
    if (this.closed) return
    try {
      this.port.postMessage({ type: MasterMessageType.bye })
    } catch {
      // The port is already dead; nothing to say goodbye to.
    }
  }

  public postMessage(value: any, transferList?: any[]): void {
    this.port.postMessage(value, transferList)
  }

  public addEventListener(type: string, listener: any): void {
    this.port.addEventListener(type, listener)
  }

  public removeEventListener(type: string, listener: any): void {
    this.port.removeEventListener(type, listener)
  }

  public dispatchEvent(): boolean {
    return false
  }

  public terminate(): void {
    this.sayBye()
    this.closed = true
    this.detachPagehide()
    this.port.close()
  }
}
