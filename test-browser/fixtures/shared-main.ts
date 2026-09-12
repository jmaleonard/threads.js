/*
 * Master-side browser entry for the shared-worker tests. Loaded by
 * shared.html; the Playwright spec drives it through the window.shared*
 * helpers, one page per simulated tab.
 */
import { spawnShared, Thread } from "../../dist-esm/index.js"

declare const SharedWorker: any

const state: { api: any, broadcasts: any[], broadcastsCompleted: boolean } = { api: null, broadcasts: [], broadcastsCompleted: false }

;(window as any).initShared = async (options: { name: string, forceFallback?: boolean }) => {
  const api = await spawnShared(
    ({ shared }) => shared
      ? new SharedWorker("./workers/shared-counter.js", { name: options.name })
      : new Worker("./workers/shared-counter.js"),
    { name: options.name, forceFallback: options.forceFallback, timeout: 8000 }
  )
  state.api = api
  Thread.broadcasts(api).subscribe({
    next: (value: any) => state.broadcasts.push(value),
    complete: () => { state.broadcastsCompleted = true }
  })
  return true
}

// Spawns against a worker that throws during startup; returns the rejection
// message (spawnShared must reject with the real error, not time out).
;(window as any).initSharedStartupFailure = async (name: string) => {
  try {
    await spawnShared(
      ({ shared }) => shared
        ? new SharedWorker("./workers/shared-throw.js", { name })
        : new Worker("./workers/shared-throw.js"),
      { name, timeout: 4000 }
    )
    return "resolved"
  } catch (error: any) {
    return String(error && error.message)
  }
}

;(window as any).sharedIncrement = () => state.api.increment()
;(window as any).sharedGetCount = () => state.api.getCount()
;(window as any).sharedIsInWorkerRuntime = () => state.api.isInWorkerRuntime()
;(window as any).sharedBroadcastCount = () => state.broadcasts.length
;(window as any).sharedLastBroadcast = () => state.broadcasts[state.broadcasts.length - 1]

// Collects the first three observable values, then unsubscribes — proves
// per-tab jobs and that cancelation doesn't affect the other tab.
;(window as any).sharedTicks = () => new Promise(resolve => {
  const received: number[] = []
  const subscription = state.api.ticks().subscribe((value: number) => {
    received.push(value)
    if (received.length === 3) {
      subscription.unsubscribe()
      resolve(received)
    }
  })
})

;(window as any).sharedTerminate = () => Thread.terminate(state.api)
;(window as any).sharedBroadcastsCompleted = () => state.broadcastsCompleted
