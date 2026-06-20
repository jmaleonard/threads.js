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
