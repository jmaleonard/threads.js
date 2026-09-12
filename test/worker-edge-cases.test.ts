import test from "ava"
import { spawn, spawnShared, Thread, Worker } from "../src/index"
import { expose, exposeShared } from "../src/worker"
import WorkerThreadsImplementation from "../src/worker/implementation.worker_threads"

test("spawn() rejects when the worker throws asynchronously before init", async t => {
  t.timeout(8000)
  await t.throwsAsync(
    spawn(new Worker("./workers/async-throw"), { timeout: 4000 }),
    { message: /Async uncaught error before init/ }
  )
})

test("spawn() rejects when the worker has an unhandled rejection before init", async t => {
  t.timeout(8000)
  await t.throwsAsync(
    spawn(new Worker("./workers/async-reject"), { timeout: 4000 }),
    { message: /Unhandled rejection in worker/ }
  )
})

test("spawn() rejects when expose() gets an invalid argument", async t => {
  t.timeout(8000)
  await t.throwsAsync(
    spawn(new Worker("./workers/expose-invalid"), { timeout: 4000 }),
    { message: /Invalid argument passed to expose\(\)/ }
  )
})

test("expose() only announces function-valued keys of a module", async t => {
  const mixed = await spawn<{ greet(): string }>(new Worker("./workers/mixed-module"))
  t.is(await mixed.greet(), "hi")
  t.false("notAFunction" in mixed)
  await Thread.terminate(mixed)
})

test("an observable error in the worker propagates to the master", async t => {
  const failing = await spawn<() => any>(new Worker("./workers/failing-observable"))

  const received: number[] = []
  const error: any = await new Promise(resolve => {
    failing().subscribe({
      next: (value: number) => received.push(value),
      error: resolve
    })
  })

  t.deepEqual(received, [1])
  t.true(error instanceof Error)
  t.regex(error.message, /Observable failed/)
  await Thread.terminate(failing)
})

test("unsubscribing early cancels the job in the worker", async t => {
  const ticks = await spawn<() => any>(new Worker("./workers/interval-observable"))

  const firstValue = await new Promise<number>(resolve => {
    const subscription = ticks().subscribe((value: number) => {
      subscription.unsubscribe()
      resolve(value)
    })
  })

  t.is(firstValue, 0)
  // The cancel message clears the worker-side interval; termination succeeding
  // right away shows nothing kept the worker busy.
  await Thread.terminate(ticks)
})

test("expose() throws when called in the master thread", t => {
  t.throws(() => expose(() => 1), { message: /master thread/ })
})

test("spawnShared() requires a name", async t => {
  await t.throwsAsync(
    spawnShared(() => null as any, undefined as any),
    { message: /requires options\.name/ }
  )
})

test("spawnShared() throws a clear error outside the browser", async t => {
  // Regression: Node ships BroadcastChannel and (since 22.5, so also 24.x)
  // navigator.locks, so feature-sniffing the fallback prerequisites is not
  // enough — the guard must require a real browser window context. This test
  // must pass on Node 24.5+ too, where both globals exist.
  await t.throwsAsync(
    spawnShared(() => null as any, { name: "node-test" }),
    { message: /only available in a browser window context/ }
  )
})

test("the bus adapter ignores messages posted after terminate()", async t => {
  // Regression: an observable unsubscribed after Thread.terminate() posts its
  // cancel message through the adapter; the underlying BroadcastChannel is
  // already closed then and postMessage on it would throw.
  const { acquireSharedBus } = await import("../src/master/shared/bus")
  const { BusClientAdapter } = await import("../src/master/shared/bus-adapter")

  const bus = acquireSharedBus("closed-post-test")
  const adapter = new BusClientAdapter(bus)
  adapter.terminate()

  t.notThrows(() => adapter.postMessage({ type: "cancel", uid: 1 }))
})

test("exposeShared() throws outside a worker", t => {
  t.throws(
    () => exposeShared(() => 1),
    { message: /must be called inside a SharedWorker or Worker/ }
  )
})

test("worker_threads implementation guards against a missing parent port", t => {
  // In the master thread there is no parent MessagePort, so the worker-side
  // API must fail loudly instead of silently dropping messages.
  t.throws(
    () => WorkerThreadsImplementation.postMessageToMaster({}, undefined as any),
    { message: /MessagePort/ }
  )
  t.throws(
    () => WorkerThreadsImplementation.subscribeToMasterMessages(() => undefined),
    { message: /MessagePort/ }
  )
})
