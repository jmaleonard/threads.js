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
 * pushes a worker-initiated event to every connected client.
 */
import { serialize } from "../common"
import { MasterMessageType, WorkerMessageType } from "../types/messages"
import { WorkerFunction, WorkerModule } from "../types/worker"
import { createConnection, createInitMessage } from "./connection"

export interface SharedWorkerContext {
  /** Push a worker-initiated event to every connected client (all tabs). */
  broadcast(value: any): void
  /** Number of currently known client connections (native shared scope only; 1 in the fallback). */
  connectionCount(): number
}

interface SharedScopePort {
  start(): void
  postMessage(message: any): void
  addEventListener(eventName: string, listener: (event: any) => void): void
  close(): void
}

const isByeMessage = (data: any) => data && data.type === MasterMessageType.bye

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

function exposeInSharedScope(exposed: WorkerFunction | WorkerModule<any>): SharedWorkerContext {
  const ports = new Set<SharedScopePort>()
  const initMessage = createInitMessage(exposed)

  ;(self as any).addEventListener("connect", (event: any) => {
    const port: SharedScopePort = event.ports[0]
    const connection = createConnection(exposed, message => port.postMessage(message))

    port.addEventListener("message", (messageEvent: any) => {
      if (isByeMessage(messageEvent.data)) {
        // The client disconnected deliberately (Thread.terminate() or
        // pagehide). Cancel its jobs and stop broadcasting to it.
        connection.dispose()
        ports.delete(port)
        port.close()
        return
      }
      connection.handleMessage(messageEvent.data)
    })
    port.start()
    ports.add(port)
    port.postMessage(initMessage)
  })

  return {
    broadcast(value: any) {
      const message = { type: WorkerMessageType.broadcast, payload: serialize(value) }
      for (const port of ports) {
        // Posting to a port whose tab died without a bye is a harmless no-op.
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

  scope.addEventListener("message", (messageEvent: any) => {
    connection.handleMessage(messageEvent.data)
  })
  scope.postMessage(createInitMessage(exposed))

  return {
    broadcast(value: any) {
      // The leader tab relays this to every client on the BroadcastChannel.
      scope.postMessage({ type: WorkerMessageType.broadcast, payload: serialize(value) })
    },
    connectionCount() {
      return 1
    }
  }
}
