import { test, expect, Page } from "@playwright/test"

declare global {
  interface Window {
    initShared(options: { name: string, forceFallback?: boolean }): Promise<boolean>
    sharedIncrement(): Promise<number>
    sharedGetCount(): Promise<number>
    sharedIsInWorkerRuntime(): Promise<boolean>
    sharedBroadcastCount(): number
    sharedLastBroadcast(): any
    sharedTicks(): Promise<number[]>
    sharedTerminate(): Promise<void>
    sharedBroadcastsCompleted(): boolean
    initSharedStartupFailure(name: string): Promise<string>
  }
}

async function openTab(pageFactory: () => Promise<Page>, name: string, forceFallback?: boolean): Promise<Page> {
  const page = await pageFactory()
  page.on("pageerror", error => { throw new Error(`Page error: ${error}`) })
  await page.goto("/shared.html")
  await page.evaluate(options => window.initShared(options), { name, forceFallback })
  return page
}

test("a native SharedWorker instance is shared across tabs", async ({ context }) => {
  test.setTimeout(30000)
  const tabA = await openTab(() => context.newPage(), "native-counter")
  const tabB = await openTab(() => context.newPage(), "native-counter")

  // Both tabs hit the same instance: the count interleaves.
  expect(await tabA.evaluate(() => window.sharedIncrement())).toBe(1)
  expect(await tabB.evaluate(() => window.sharedIncrement())).toBe(2)
  expect(await tabA.evaluate(() => window.sharedGetCount())).toBe(2)

  // Regression: isWorkerRuntime() must be true inside SharedWorkerGlobalScope.
  expect(await tabA.evaluate(() => window.sharedIsInWorkerRuntime())).toBe(true)

  // Broadcasts reach every connected tab.
  await tabA.waitForFunction(() => window.sharedBroadcastCount() >= 2)
  await tabB.waitForFunction(() => window.sharedBroadcastCount() >= 2)
  expect(await tabA.evaluate(() => window.sharedLastBroadcast())).toEqual({ count: 2 })

  // Observables are per-tab jobs: tab A subscribes and cancels without
  // affecting tab B, which still gets fresh values afterwards.
  expect(await tabA.evaluate(() => window.sharedTicks())).toEqual([0, 1, 2])
  expect(await tabB.evaluate(() => window.sharedTicks())).toEqual([0, 1, 2])

  // Closing one tab leaves the worker alive for the other.
  await tabA.close()
  expect(await tabB.evaluate(() => window.sharedIncrement())).toBe(3)
  await tabB.close()
})

test("the BroadcastChannel fallback shares one worker via a leader tab", async ({ context }) => {
  test.setTimeout(30000)
  const tabA = await openTab(() => context.newPage(), "fallback-counter", true)
  const tabB = await openTab(() => context.newPage(), "fallback-counter", true)

  expect(await tabA.evaluate(() => window.sharedIncrement())).toBe(1)
  expect(await tabB.evaluate(() => window.sharedIncrement())).toBe(2)
  expect(await tabB.evaluate(() => window.sharedGetCount())).toBe(2)

  // Regression: isWorkerRuntime() must be true in the fallback's dedicated worker too.
  expect(await tabB.evaluate(() => window.sharedIsInWorkerRuntime())).toBe(true)

  await tabA.waitForFunction(() => window.sharedBroadcastCount() >= 2)
  await tabB.waitForFunction(() => window.sharedBroadcastCount() >= 2)

  expect(await tabB.evaluate(() => window.sharedTicks())).toEqual([0, 1, 2])

  // Regression: Thread.broadcasts() must complete on termination (it shares
  // the events pipeline's lifecycle instead of leaking a raw listener).
  await tabB.evaluate(() => window.sharedTerminate())
  await tabB.waitForFunction(() => window.sharedBroadcastsCompleted())

  await tabA.close()
  await tabB.close()
})

test("a shared worker that throws during startup rejects spawnShared with the real error", async ({ context }) => {
  test.setTimeout(30000)
  // Regression: SharedWorkerGlobalScope has no self.postMessage, so uncaught
  // startup errors were swallowed and spawnShared() hit the generic init
  // timeout instead of surfacing the actual failure.
  const page = await context.newPage()
  await page.goto("/shared.html")
  const message = await page.evaluate(name => window.initSharedStartupFailure(name), "startup-failure")
  expect(message).toContain("Shared worker startup failure")
  await page.close()
})

test("fallback failover: a new leader takes over when the leader tab closes", async ({ context }) => {
  test.setTimeout(30000)
  // Tab A inits first and wins the leader lock; tab B is a plain client.
  const tabA = await openTab(() => context.newPage(), "failover-counter", true)
  const tabB = await openTab(() => context.newPage(), "failover-counter", true)

  expect(await tabA.evaluate(() => window.sharedIncrement())).toBe(1)
  expect(await tabB.evaluate(() => window.sharedIncrement())).toBe(2)

  // Kill the leader. Tab B's queued lock request fires, it respawns the
  // worker (fresh state) and announces itself. A call racing the election
  // may reject with SharedWorkerLeaderLostError; retries must succeed.
  await tabA.close()

  const result = await tabB.evaluate(async () => {
    const deadline = Date.now() + 15000
    let lastError = ""
    while (Date.now() < deadline) {
      try {
        return { count: await window.sharedIncrement(), lastError }
      } catch (error: any) {
        lastError = error && error.name
        await new Promise(resolve => setTimeout(resolve, 250))
      }
    }
    throw new Error(`No successful call after failover. Last error: ${lastError}`)
  })

  // The respawned worker starts from scratch: the failed-over increment is 1.
  expect(result.count).toBe(1)
  await tabB.close()
})
