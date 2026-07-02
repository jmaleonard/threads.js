import test from "ava"
import { Observable } from "observable-fns"
import { spawn, Thread, Worker } from "../src/index"
import { Counter } from "./workers/counter"

test("can spawn and terminate a thread", async t => {
  // We also test here that running spawn() without type parameters works
  const helloWorld = await spawn(new Worker("./workers/hello-world"))
  t.is(await helloWorld(), "Hello World")
  await Thread.terminate(helloWorld)
  t.pass()
})

test("can spawn a worker from a new URL() in plain node", async t => {
  // The modern bundler-friendly form. In plain node this normalizes to an
  // absolute path, which must not be rebased onto the caller directory.
  const helloWorld = await spawn<() => string>(
    new Worker(new URL("./workers/hello-world.ts", import.meta.url))
  )
  t.is(await helloWorld(), "Hello World")
  await Thread.terminate(helloWorld)
})

test("can call a function thread more than once", async t => {
  const increment = await spawn<() => number>(new Worker("./workers/increment"))
  t.is(await increment(), 1)
  t.is(await increment(), 2)
  t.is(await increment(), 3)
  await Thread.terminate(increment)
})

test("can subscribe to an observable returned by a thread call", async t => {
  const countToFive = await spawn<() => Observable<number>>(new Worker("./workers/count-to-five"))
  const encounteredValues: any[] = []

  const observable = countToFive()
  observable.subscribe(value => encounteredValues.push(value))
  await observable

  t.deepEqual(encounteredValues, [1, 2, 3, 4, 5])
  await Thread.terminate(countToFive)
})

test("can spawn a module thread", async t => {
  const counter = await spawn<Counter>(new Worker("./workers/counter"))
  t.is(await counter.getCount(), 0)
  await Promise.all([
    counter.increment(),
    counter.increment()
  ])
  t.is(await counter.getCount(), 2)
  await counter.decrement()
  t.is(await counter.getCount(), 1)
  await Thread.terminate(counter)
})

test("thread job errors are handled", async t => {
  const fail = await spawn<() => Promise<never>>(new Worker("./workers/faulty-function"))
  await t.throwsAsync(fail(), undefined, "I am supposed to fail.")
  await Thread.terminate(fail)
})

test("thread transfer errors are handled", async t => {
  const builtin = require('module').builtinModules;
  if (builtin.indexOf('worker_threads') > -1) {
    // test is actual for native worker_threads only
    const helloWorld = await spawn(new Worker("./workers/hello-world"))
    const badTransferObj = { fn: () => {} };
    // The rejection is a DOMException (DataCloneError), which ava's throwsAsync
    // does not recognise as a native error, so we capture and assert manually.
    const error: any = await helloWorld(badTransferObj).then(() => undefined, e => e)
    t.is(error && error.name, 'DataCloneError')
    await Thread.terminate(helloWorld)
  } else {
    t.pass();
  }
})

test("catches top-level thread errors", async t => {
  await t.throwsAsync(spawn(new Worker("./workers/top-level-throw")), undefined, "Top-level worker error")
})

test("can subscribe to thread events", async t => {
  const events: any[] = []
  const helloWorld = await spawn<() => string>(new Worker("./workers/hello-world"))

  const subscription = Thread.events(helloWorld).subscribe(event => events.push(event))

  await helloWorld()
  await Thread.terminate(helloWorld)

  // Give the termination event a tick to propagate through the observable
  await new Promise(resolve => setTimeout(resolve, 50))

  // Release the events subscription so it does not keep the worker's message
  // port alive and prevent the test process from exiting.
  subscription.unsubscribe()

  const eventTypes = events.map(event => event.type)
  t.true(eventTypes.includes("message"), `Expected a "message" event, got: ${eventTypes.join(", ")}`)
  t.true(eventTypes.includes("termination"), `Expected a "termination" event, got: ${eventTypes.join(", ")}`)
})

test("rejects a pending call when the worker crashes", async t => {
  t.timeout(8000)
  const crash = await spawn<() => Promise<void>>(new Worker("./workers/crash-on-call"))

  // The worker exits (process.exit) without returning a result. Before the fix
  // the call promise would hang forever; now it rejects.
  const error: any = await crash().then(() => undefined, e => e)
  t.truthy(error)
  t.true(error instanceof Error)
})
