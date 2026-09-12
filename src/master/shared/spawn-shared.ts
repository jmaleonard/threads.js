/*
 * spawnShared(): connect to a worker instance shared by every tab of the
 * origin. Uses a native SharedWorker where the browser has one; otherwise a
 * leader-elected tab owns a dedicated worker and serves the other tabs over a
 * BroadcastChannel. Either way the returned thread behaves like a spawn()-ed
 * one — plus Thread.broadcasts() for worker-initiated events.
 */
import { multicast, Observable } from "observable-fns"
import { deserialize } from "../../common"
import { $broadcasts, $events } from "../../symbols"
import { Worker as WorkerType, WorkerEventType } from "../../types/master"
import { WorkerMessageType } from "../../types/messages"
import { WorkerFunction, WorkerModule } from "../../types/worker"
import { ArbitraryWorkerInterface, ExposedToThreadType, spawn } from "../spawn"
import { acquireSharedBus } from "./bus"
import { BusClientAdapter } from "./bus-adapter"
import { registerSharedClient, SharedWorkerFactory } from "./leader"
import { SharedWorkerLike, SharedWorkerPortAdapter } from "./port-adapter"

export interface SpawnSharedOptions {
  /**
   * Identity of the shared worker across tabs. Names the SharedWorker, the
   * fallback BroadcastChannel and the leader-election lock. Required.
   */
  name: string
  /** Init message timeout in ms, like spawn()'s. */
  timeout?: number
  /** Use the BroadcastChannel fallback even where SharedWorker exists (mainly for tests). */
  forceFallback?: boolean
}

export { SharedWorkerFactory }

const globalObject: any = typeof globalThis !== "undefined" ? globalThis : undefined

function hasNativeSharedWorker(): boolean {
  return typeof globalObject?.SharedWorker === "function"
}

function hasFallbackPrerequisites(): boolean {
  return typeof globalObject?.BroadcastChannel === "function" &&
    typeof globalObject?.navigator?.locks?.request === "function"
}

// Feature checks alone cannot distinguish Node from a browser anymore:
// Node ships BroadcastChannel and, since 22.5 (so also 24.x), navigator.locks.
// A browser window context is what actually makes cross-TAB sharing meaningful.
function isBrowserWindow(): boolean {
  return typeof globalObject?.window !== "undefined" &&
    typeof globalObject?.window?.document !== "undefined"
}

/**
 * Spawn (or connect to) a shared worker. All tabs of the origin passing the
 * same `name` talk to a single worker instance.
 *
 * The factory must contain the literal worker constructor calls so bundlers
 * can emit the worker chunk:
 *
 * ```js
 * const api = await spawnShared(({ shared }) => shared
 *   ? new SharedWorker(new URL("./workers/api", import.meta.url), { name: "api" })
 *   : new Worker(new URL("./workers/api", import.meta.url)),
 *   { name: "api" })
 * ```
 *
 * `Thread.terminate()` on the returned thread disconnects this tab only; the
 * worker keeps running while other tabs are connected.
 */
export async function spawnShared<Exposed extends WorkerFunction | WorkerModule<any> = ArbitraryWorkerInterface>(
  factory: SharedWorkerFactory,
  options: SpawnSharedOptions
): Promise<ExposedToThreadType<Exposed>> {
  if (!options || !options.name) {
    throw Error("spawnShared() requires options.name — it identifies the shared worker across tabs.")
  }
  if (!isBrowserWindow()) {
    throw Error(
      "spawnShared() is only available in a browser window context — sharing a " +
      "worker across tabs has no equivalent elsewhere. In Node.js, use spawn() " +
      "with a regular worker instead."
    )
  }
  if (!hasNativeSharedWorker() && !hasFallbackPrerequisites()) {
    throw Error(
      "spawnShared() needs SharedWorker, or BroadcastChannel plus the Web Locks " +
      "API for the fallback. This browser provides neither."
    )
  }

  let worker: WorkerType
  if (hasNativeSharedWorker() && !options.forceFallback) {
    const sharedWorker = factory({ shared: true }) as SharedWorkerLike
    if (!sharedWorker || !sharedWorker.port) {
      throw Error("The factory passed to spawnShared() must return a SharedWorker when called with { shared: true }.")
    }
    worker = new SharedWorkerPortAdapter(sharedWorker)
  } else {
    if (!hasFallbackPrerequisites()) {
      throw Error("spawnShared() fallback requires BroadcastChannel and the Web Locks API.")
    }
    // Join the election before opening the client, and undo it when this
    // client terminates — an unelected tab whose clients are all gone must
    // withdraw its queued lock request.
    const release = registerSharedClient(options.name, factory)
    worker = new BusClientAdapter(acquireSharedBus(options.name), release)
  }

  const thread = await spawn<Exposed>(worker as any, { timeout: options.timeout })

  // Broadcasts are derived from the same events pipeline spawn() built, so
  // they inherit its lifecycle: listener removal and completion on
  // termination, instead of a parallel raw listener that would never end.
  const events: Observable<any> = (thread as any)[$events]
  ;(thread as any)[$broadcasts] = multicast(
    events
      .filter((event: any) => event.type === WorkerEventType.message &&
        event.data && event.data.type === WorkerMessageType.broadcast)
      .map((event: any) => deserialize(event.data.payload))
  )
  return thread
}
