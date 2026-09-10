import test from "ava"
import { Observable, Subject } from "observable-fns"
import { allSettled } from "../src/ponyfills"
import { Thread } from "../src/master/thread"
import { Transfer, isTransferDescriptor } from "../src/transferable"
import { $errors, $events, $terminate } from "../src/symbols"

// --- Thread accessors -------------------------------------------------------

function fakeThread() {
  const errors = new Subject<Error>()
  const events = new Subject<any>()
  let terminated = false
  return {
    raw: {
      [$errors]: Observable.from(errors),
      [$events]: Observable.from(events),
      [$terminate]: async () => {
        terminated = true
      }
    } as any,
    wasTerminated: () => terminated
  }
}

test("Thread.errors() returns the thread's error observable", t => {
  const { raw } = fakeThread()
  t.true(Thread.errors(raw) instanceof Observable)
})

test("Thread.events() returns the thread's event observable", t => {
  const { raw } = fakeThread()
  t.true(Thread.events(raw) instanceof Observable)
})

test("Thread.terminate() invokes the thread's terminate handler", async t => {
  const { raw, wasTerminated } = fakeThread()
  await Thread.terminate(raw)
  t.true(wasTerminated())
})

test("Thread.errors() throws for a non-thread value", t => {
  t.throws(() => Thread.errors({} as any), { message: /Error observable not found/ })
})

test("Thread.events() throws for a non-thread value", t => {
  t.throws(() => Thread.events({} as any), { message: /Events observable not found/ })
})

// --- Transferables ----------------------------------------------------------

test("Transfer() wraps a transferable payload into a descriptor", t => {
  const buffer = new ArrayBuffer(8)
  const descriptor = Transfer(buffer)
  t.true(isTransferDescriptor(descriptor))
  t.is(descriptor.send, buffer)
  t.deepEqual(descriptor.transferables, [buffer])
})

test("Transfer() accepts an explicit list of transferables", t => {
  const buffer = new ArrayBuffer(8)
  const payload = { buffer }
  const descriptor = Transfer(payload, [buffer])
  t.is(descriptor.send, payload)
  t.deepEqual(descriptor.transferables, [buffer])
})

test("Transfer() throws when the payload itself is not transferable", t => {
  t.throws(() => Transfer(123 as any))
})

test("isTransferDescriptor() rejects plain and nullish values", t => {
  t.falsy(isTransferDescriptor({}))
  t.falsy(isTransferDescriptor(null))
  t.falsy(isTransferDescriptor(42))
})

// --- register ---------------------------------------------------------------

test("register installs the threads Worker as a global", async t => {
  await import("../src/master/register")
  const { Worker } = await import("../src/index")
  t.is((globalThis as any).Worker, Worker)
})

// --- allSettled ponyfill ----------------------------------------------------

test("Thread.broadcasts() throws for a non-shared thread", async t => {
  const { Thread } = await import("../src/index")
  t.throws(() => Thread.broadcasts({} as any), { message: /only available on threads returned by spawnShared/ })
})

test("SharedWorkerLeaderLostError carries its name and default message", async t => {
  const { SharedWorkerLeaderLostError } = await import("../src/index")
  const error = new SharedWorkerLeaderLostError()
  t.true(error instanceof Error)
  t.is(error.name, "SharedWorkerLeaderLostError")
  t.regex(error.message, /shared worker/)
})

test("a worker connection cancels its jobs on dispose()", async t => {
  const { createConnection, createInitMessage } = await import("../src/worker/connection")
  const { Observable } = await import("observable-fns")

  let torndown = false
  const posted: any[] = []
  const connection = createConnection(
    () => new Observable(() => {
      return () => { torndown = true }
    }),
    message => posted.push(message)
  )

  connection.handleMessage({ type: "run", uid: 1, args: [] })
  t.is(posted[0].type, "running")
  t.false(torndown)

  connection.dispose()
  t.true(torndown)

  t.deepEqual(createInitMessage(() => 1), { type: "init", exposed: { type: "function" } })
})

test("node-require resolves modules and directories without webpack", async t => {
  const { getModuleDirname, getNodeRequire, isWebpackBundle } = await import("../src/node-require")
  t.false(isWebpackBundle())
  t.is(typeof getNodeRequire().resolve("typescript"), "string")
  t.is(typeof getModuleDirname(), "string")
})

test("node-require honours the webpack escape hatch", async t => {
  const { getNodeRequire, isWebpackBundle } = await import("../src/node-require")
  const { createRequire } = await import("module")
  const globals = globalThis as any
  const realRequire = createRequire(import.meta.url)

  globals.__non_webpack_require__ = realRequire
  try {
    t.true(isWebpackBundle())
    t.is(getNodeRequire(), realRequire)
  } finally {
    delete globals.__non_webpack_require__
  }
})

test("allSettled() reports both fulfilled and rejected results", async t => {
  const results = await allSettled([
    Promise.resolve("ok"),
    Promise.reject(new Error("nope")),
    "plain value"
  ])

  t.is(results[0].status, "fulfilled")
  t.is(results[1].status, "rejected")
  t.is(results[2].status, "fulfilled")

  if (results[0].status === "fulfilled") t.is(results[0].value, "ok")
  if (results[1].status === "rejected") t.is(results[1].reason.message, "nope")
  if (results[2].status === "fulfilled") t.is(results[2].value, "plain value")
})
