/*
 * Worker-side entry point for shared workers. Works in two runtimes:
 *
 * - SharedWorkerGlobalScope (native path): every connecting tab arrives as a
 *   `connect` event carrying a MessagePort. Each port gets its own connection
 *   (init message, job state, replies), so job uids never collide across tabs.
 * - DedicatedWorkerGlobalScope (fallback path): the worker was spawned by the
 *   leader tab and speaks to it over `self`, exactly like expose() — the
 *   leader multiplexes the other tabs over a BroadcastChannel.
 *
 * In both runtimes exposeShared() returns a `broadcast(value)` function that
 * pushes a worker-initiated event to every connected client, and
 * `connectionCount()` reporting the number of connected tabs (fed by the
 * leader on the fallback path).
 *
 * Liveness: a tab that dies without its bye (crash, OOM kill) would leak its
 * connection and keep its observable subscriptions running forever. The
 * shared scope pings each port and prunes ports that stop answering; the
 * fallback leader does the equivalent for its clients over the bus.
 */
import { serialize } from "../common"
import { sharedHeartbeat } from "../shared-heartbeat"
import { MasterMessageType, WorkerMessageType } from "../types/messages"
import { WorkerFunction, WorkerModule } from "../types/worker"
import { createConnection, createInitMessage } from "./connection"

export interface SharedWorkerContext {
  /** Push a worker-initiated event to every connected client (all tabs). */
  broadcast(value: any): void
  /** Number of currently connected client tabs. */
  connectionCount(): number
}

interface SharedScopePort {
  start(): void
  postMessage(message: any): void
  addEventListener(eventName: string, listener: (event: any) => void): void
  close(): void
}

const isByeMessage = (data: any) => data && data.type === MasterMessageType.bye
const isPongMessage = (data: any) => data && data.type === MasterMessageType.pong
const isClientsMessage = (data: any) => data && data.type === MasterMessageType.clients

function isSharedWorkerScope(): boolean {
  return typeof self !== "undefined" && "onconnect" in (self as any)
}

function isDedicatedWorkerScope(): boolean {
  const isWindowContext = typeof self !== "undefined" && typeof Window !== "undefined" && self instanceof Window
  return typeof self !== "undefined" && typeof (self as any).postMessage === "function" && !isWindowContext
}

let exposeSharedCalled = false

/**
 * Expose a function or module from a shared worker. The same worker script
 * works both as a native `SharedWorker` and as the dedicated worker spawned by
 * the leader tab on the BroadcastChannel fallback path.
 *
 * Must be called exactly once per worker.
 */
export function exposeShared(exposed: WorkerFunction | WorkerModule<any>): SharedWorkerContext {
  if (exposeSharedCalled) {
    throw Error("exposeShared() called more than once. Pass an object to exposeShared() if you want to expose multiple functions.")
  }
  if (typeof exposed !== "function" && (typeof exposed !== "object" || !exposed)) {
    throw Error(`Invalid argument passed to exposeShared(). Expected a function or an object, got: ${exposed}`)
  }

  if (isSharedWorkerScope()) {
    exposeSharedCalled = true
    return exposeInSharedScope(exposed)
  }
  if (isDedicatedWorkerScope()) {
    exposeSharedCalled = true
    return exposeInDedicatedScope(exposed)
  }
  throw Error(
    "exposeShared() must be called inside a SharedWorker or Worker. " +
    "It was called in the master thread or in a non-worker environment (Node has no SharedWorker support)."
  )
}

function serializeUncaught(error: any) {
  return {
    type: WorkerMessageType.uncaughtError,
    error: serialize(error instanceof Error ? error : Error(String(error))) as any
  }
}

function exposeInSharedScope(exposed: WorkerFunction | WorkerModule<any>): SharedWorkerContext {
  interface PortState {
    connection: { handleMessage(data: any): void, dispose(): void }
    lastSeen: number
  }
  const ports = new Map<SharedScopePort, PortState>()
  const initMessage = createInitMessage(exposed)

  const dropPort = (port: SharedScopePort) => {
    const state = ports.get(port)
    if (!state) return
    state.connection.dispose()
    ports.delete(port)
    port.close()
  }

  // SharedWorkerGlobalScope has no postMessage: uncaught errors must be
  // relayed through the connected ports. Errors thrown before any tab
  // connected (e.g. a bad import) are buffered and delivered right after
  // init, so spawnShared() rejects with the real error instead of timing out.
  const bufferedUncaught: any[] = []
  const relayUncaught = (error: any) => {
    const message = serializeUncaught(error)
    if (ports.size === 0) {
      bufferedUncaught.push(message)
      return
    }
    for (const port of ports.keys()) {
      port.postMessage(message)
    }
  }
  ;(self as any).addEventListener("error", (event: any) => {
    relayUncaught(event && (event.error || event.message) || event)
  })
  ;(self as any).addEventListener("unhandledrejection", (event: any) => {
    const reason = event && (event as any).reason
    if (reason && typeof reason.message === "string") {
      relayUncaught(reason)
    }
  })

  // Prune ports whose tab died without a bye: ping every interval, drop
  // ports that have not answered (or spoken) within the timeout — otherwise
  // their subscriptions (e.g. observable intervals) run forever.
  const pingTimer: any = setInterval(() => {
    const deadline = Date.now() - sharedHeartbeat.timeout
    for (const [port, state] of ports) {
      if (state.lastSeen < deadline) {
        dropPort(port)
      } else {
        port.postMessage({ type: WorkerMessageType.ping })
      }
    }
  }, sharedHeartbeat.interval)
  if (pingTimer && typeof pingTimer.unref === "function") pingTimer.unref()

  ;(self as any).addEventListener("connect", (event: any) => {
    const port: SharedScopePort = event.ports[0]
    const connection = createConnection(exposed, message => port.postMessage(message))
    const state: PortState = { connection, lastSeen: Date.now() }

    port.addEventListener("message", (messageEvent: any) => {
      state.lastSeen = Date.now()
      const data = messageEvent.data
      if (isPongMessage(data)) return
      if (isByeMessage(data)) {
        // The client disconnected deliberately (Thread.terminate() or
        // pagehide). Cancel its jobs and stop broadcasting to it.
        dropPort(port)
        return
      }
      connection.handleMessage(data)
    })
    port.start()
    ports.set(port, state)
    // Errors thrown before any tab connected go out FIRST, so a spawnShared()
    // against a worker that failed during startup rejects with the real error
    // instead of resolving against a broken instance.
    for (const buffered of bufferedUncaught) {
      port.postMessage(buffered)
    }
    port.postMessage(initMessage)
  })

  return {
    broadcast(value: any) {
      const message = { type: WorkerMessageType.broadcast, payload: serialize(value) }
      for (const port of ports.keys()) {
        // Posting to a port whose tab died moments ago is a harmless no-op.
        port.postMessage(message)
      }
    },
    connectionCount() {
      return ports.size
    }
  }
}

function exposeInDedicatedScope(exposed: WorkerFunction | WorkerModule<any>): SharedWorkerContext {
  const scope = self as any
  const connection = createConnection(exposed, (message, transferList) => scope.postMessage(message, transferList))
  // The leader keeps this up to date so connectionCount() means the same
  // thing on both transports.
  let clientCount = 1

  scope.addEventListener("message", (messageEvent: any) => {
    const data = messageEvent.data
    if (isClientsMessage(data)) {
      clientCount = data.count
      return
    }
    connection.handleMessage(data)
  })
  scope.postMessage(createInitMessage(exposed))

  return {
    broadcast(value: any) {
      // The leader tab relays this to every client on the BroadcastChannel.
      scope.postMessage({ type: WorkerMessageType.broadcast, payload: serialize(value) })
    },
    connectionCount() {
      return clientCount
    }
  }
}
