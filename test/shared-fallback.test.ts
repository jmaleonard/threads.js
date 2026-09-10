/*
 * Node-level tests for the BroadcastChannel fallback stack (bus, leader
 * election, client adapter). Node ships BroadcastChannel, and Web Locks is
 * polyfilled here with a minimal in-process lock manager, so the whole
 * fallback protocol can be exercised without a browser — using a scripted
 * fake worker in place of a real one.
 */
import test from "ava"
import { sharedHeartbeat } from "../src/shared-heartbeat"
import { acquireSharedBus, BusEnvelope, SharedBus } from "../src/master/shared/bus"
import { BusClientAdapter } from "../src/master/shared/bus-adapter"
import { registerSharedClient } from "../src/master/shared/leader"

// --- minimal in-process Web Locks polyfill ----------------------------------

type LockGrant = { callback: () => Promise<unknown>, resolve: (v: unknown) => void, reject: (e: unknown) => void, signal?: any }
const lockQueues = new Map<string, { held: boolean, queue: LockGrant[] }>()

function grantNext(name: string) {
  const entry = lockQueues.get(name)
  if (!entry || entry.held) return
  const next = entry.queue.shift()
  if (!next) return
  if (next.signal && next.signal.aborted) {
    next.reject(Object.assign(Error("Aborted"), { name: "AbortError" }))
    grantNext(name)
    return
  }
  entry.held = true
  // The callback's promise never resolves in threadsx (held until tab death),
  // so `held` effectively stays true for the rest of the test process.
  Promise.resolve().then(() => next.callback()).then(next.resolve, next.reject)
}

function installLocksPolyfill() {
  const navigatorObject: any = (globalThis as any).navigator || {}
  if (navigatorObject.locks && navigatorObject.locks.__threadsxTestPolyfill) return
  const locks = {
    __threadsxTestPolyfill: true,
    request(name: string, options: any, callback: () => Promise<unknown>) {
      return new Promise((resolve, reject) => {
        let entry = lockQueues.get(name)
        if (!entry) {
          entry = { held: false, queue: [] }
          lockQueues.set(name, entry)
        }
        const grant: LockGrant = { callback, resolve, reject, signal: options && options.signal }
        if (grant.signal) {
          grant.signal.addEventListener("abort", () => {
            const index = entry!.queue.indexOf(grant)
            if (index !== -1) {
              entry!.queue.splice(index, 1)
              reject(Object.assign(Error("Aborted"), { name: "AbortError" }))
            }
          })
        }
        entry.queue.push(grant)
        grantNext(name)
      })
    }
  }
  try {
    Object.defineProperty(navigatorObject, "locks", { value: locks, configurable: true })
    if (!(globalThis as any).navigator) {
      Object.defineProperty(globalThis, "navigator", { value: navigatorObject, configurable: true })
    }
  } catch {
    ;(globalThis as any).navigator = { ...navigatorObject, locks }
  }
}

installLocksPolyfill()

// --- scripted fake worker ----------------------------------------------------

/** Behaves like a spawned threadsx worker: replies to runs, supports cancel. */
class FakeWorker {
  public received: any[] = []
  private listeners = new Map<string, Set<(event: any) => void>>()
  public respond = true

  constructor() {
    // Send the init message once listeners had a chance to attach.
    setTimeout(() => this.emit("message", { data: { type: "init", exposed: { type: "function" } } }), 0)
  }

  emit(type: string, event: any) {
    for (const listener of [...(this.listeners.get(type) || [])]) listener(event)
  }

  postMessage(message: any) {
    this.received.push(message)
    if (message && message.type === "run" && this.respond) {
      setTimeout(() => {
        this.emit("message", { data: { type: "running", uid: message.uid, resultType: "promise" } })
        this.emit("message", { data: { type: "result", uid: message.uid, complete: true, payload: (message.args[0] ?? 0) * 2 } })
      }, 0)
    }
  }

  addEventListener(type: string, listener: any) {
    let set = this.listeners.get(type)
    if (!set) this.listeners.set(type, set = new Set())
    set.add(listener)
  }

  removeEventListener(type: string, listener: any) {
    this.listeners.get(type)?.delete(listener)
  }

  terminate() { /* not used by the leader */ }
}

// --- helpers -----------------------------------------------------------------

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

let nameCounter = 0
const uniqueName = () => `fallback-test-${process.pid}-${nameCounter++}`

/** spawn()-less client: waits for init, then can run jobs via the adapter. */
function initAdapter(adapter: BusClientAdapter, timeoutMs = 4000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error("Timed out waiting for init")), timeoutMs)
    const handler = (event: any) => {
      if (event.data && event.data.type === "init") {
        clearTimeout(timer)
        adapter.removeEventListener("message", handler)
        resolve()
      }
    }
    adapter.addEventListener("message", handler)
  })
}

function runJob(adapter: BusClientAdapter, uid: number, value: number, timeoutMs = 4000): Promise<number> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error("Timed out waiting for job result")), timeoutMs)
    const handler = (event: any) => {
      const msg = event.data
      if (msg && msg.type === "result" && msg.uid === uid) {
        clearTimeout(timer)
        adapter.removeEventListener("message", handler)
        resolve(msg.payload)
      }
    }
    adapter.addEventListener("message", handler)
    adapter.postMessage({ type: "run", uid, args: [value] })
  })
}

// --- tests -------------------------------------------------------------------

test.serial("the leader keeps serving other clients after its own client terminates", async t => {
  // Regression: the leader used to borrow its first client's refcounted bus;
  // Thread.terminate() in the leader tab closed the BroadcastChannel while
  // the lock was still held, permanently hanging every other tab.
  const name = uniqueName()
  const worker = new FakeWorker()

  const releaseA = registerSharedClient(name, () => worker)
  const adapterA = new BusClientAdapter(acquireSharedBus(name), releaseA)
  await initAdapter(adapterA)

  const releaseB = registerSharedClient(name, () => worker)
  const adapterB = new BusClientAdapter(acquireSharedBus(name), releaseB)
  await initAdapter(adapterB)

  adapterA.terminate()

  t.is(await runJob(adapterB, 1, 21), 42)
  adapterB.terminate()
})

test.serial("a new client in the same tab connects after the previous one terminated", async t => {
  // Regression: the election registry never reset, and the leader kept
  // listening on the closed first bus — a respawn in the same tab timed out.
  const name = uniqueName()
  const worker = new FakeWorker()

  const release1 = registerSharedClient(name, () => worker)
  const adapter1 = new BusClientAdapter(acquireSharedBus(name), release1)
  await initAdapter(adapter1)
  adapter1.terminate()

  const release2 = registerSharedClient(name, () => worker)
  const adapter2 = new BusClientAdapter(acquireSharedBus(name), release2)
  await initAdapter(adapter2)
  t.is(await runJob(adapter2, 1, 5), 10)
  adapter2.terminate()
})

test.serial("the leader drops job messages from a stale leader epoch", async t => {
  // Regression: a run racing a failover was executed by the new leader AND
  // rejected client-side — retrying then ran the side effect twice.
  const name = uniqueName()
  const worker = new FakeWorker()

  const release = registerSharedClient(name, () => worker)
  const bus: SharedBus = acquireSharedBus(name)

  const leaderId = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => reject(Error("No leader-online")), 4000)
    bus.subscribe(envelope => {
      if (envelope.kind === "leader-online") {
        clearTimeout(timer)
        resolve(envelope.leaderId)
      }
    })
  })

  const replies: BusEnvelope[] = []
  bus.subscribe(envelope => {
    if (envelope.kind === "s2c" && envelope.clientId === "epoch-client") replies.push(envelope)
  })

  bus.post({ kind: "c2s", clientId: "epoch-client", msg: { type: "run", uid: 1, args: [1] }, leaderId: "stale-epoch" })
  await delay(150)
  t.is(replies.length, 0, "a stale-epoch run must not be executed")

  bus.post({ kind: "c2s", clientId: "epoch-client", msg: { type: "run", uid: 2, args: [2] }, leaderId })
  await delay(150)
  t.true(replies.some(reply => reply.kind === "s2c" && reply.msg.type === "result" && reply.msg.uid === 2))

  release()
  bus.release()
})

test.serial("a client cancel reaches the worker with the leader-remapped uid", async t => {
  const name = uniqueName()
  const worker = new FakeWorker()
  worker.respond = false // keep the job pending so the cancel matters

  const release = registerSharedClient(name, () => worker)
  const bus = acquireSharedBus(name)
  const leaderId = await new Promise<string>(resolve =>
    bus.subscribe(envelope => { if (envelope.kind === "leader-online") resolve(envelope.leaderId) })
  )

  bus.post({ kind: "c2s", clientId: "cancel-client", msg: { type: "run", uid: 9, args: [] }, leaderId })
  await delay(50)
  const run = worker.received.find(m => m.type === "run")
  t.truthy(run)

  bus.post({ kind: "c2s", clientId: "cancel-client", msg: { type: "cancel", uid: 9 }, leaderId })
  await delay(50)
  const cancel = worker.received.find(m => m.type === "cancel")
  t.truthy(cancel)
  t.is(cancel.uid, run.uid, "the cancel must target the leader-allocated uid, not the client's")

  release()
  bus.release()
})

test.serial("the leader relays a worker ErrorEvent's message to the clients", async t => {
  // Regression: the handler only read event.data.message, but browser
  // Workers put the text on event.message — script-load failures always
  // surfaced as the generic "The shared worker errored.".
  const name = uniqueName()
  const worker = new FakeWorker()

  const release = registerSharedClient(name, () => worker)
  const bus = acquireSharedBus(name)
  await new Promise<void>(resolve => bus.subscribe(envelope => { if (envelope.kind === "leader-online") resolve() }))

  const errors: string[] = []
  bus.subscribe(envelope => { if (envelope.kind === "worker-error") errors.push(envelope.message) })

  worker.emit("error", { message: "boom: script 404" })
  await delay(100)
  t.deepEqual(errors, ["boom: script 404"])

  release()
  bus.release()
})

test.serial("the leader tells the worker how many clients are connected", async t => {
  // Regression: connectionCount() hardcoded 1 on the fallback path.
  const name = uniqueName()
  const worker = new FakeWorker()

  const releaseA = registerSharedClient(name, () => worker)
  const adapterA = new BusClientAdapter(acquireSharedBus(name), releaseA)
  await initAdapter(adapterA)

  const releaseB = registerSharedClient(name, () => worker)
  const adapterB = new BusClientAdapter(acquireSharedBus(name), releaseB)
  await initAdapter(adapterB)
  await delay(50)

  const counts = () => worker.received.filter(m => m.type === "clients").map(m => m.count)
  t.is(counts().pop(), 2)

  adapterB.terminate()
  await delay(50)
  t.is(counts().pop(), 1)

  adapterA.terminate()
})

test.serial("the leader prunes silent clients and cancels their jobs", async t => {
  // Regression: a tab dying without a bye (crash, OOM kill) leaked its jobs —
  // e.g. observable intervals — in the worker forever.
  const originalInterval = sharedHeartbeat.interval
  const originalTimeout = sharedHeartbeat.timeout
  sharedHeartbeat.interval = 50
  sharedHeartbeat.timeout = 120

  try {
    const name = uniqueName()
    const worker = new FakeWorker()
    worker.respond = false // keep the job pending, like a running observable

    const release = registerSharedClient(name, () => worker)
    const bus = acquireSharedBus(name)
    const leaderId = await new Promise<string>(resolve =>
      bus.subscribe(envelope => { if (envelope.kind === "leader-online") resolve(envelope.leaderId) })
    )

    // A client that runs a job and then goes silent (no hb, no bye).
    bus.post({ kind: "c2s", clientId: "silent-client", msg: { type: "run", uid: 7, args: [] }, leaderId })
    await delay(60)
    t.true(worker.received.some(m => m.type === "run"), "the job reached the worker")

    await delay(400)
    t.true(
      worker.received.some(m => m.type === "cancel"),
      "the silent client's job must be canceled after the heartbeat timeout"
    )

    release()
    bus.release()
  } finally {
    sharedHeartbeat.interval = originalInterval
    sharedHeartbeat.timeout = originalTimeout
  }
})

test.serial("pagehide with persisted=true (bfcache) does not disconnect the client", async t => {
  // Regression: bfcache navigations sent a bye; a page restored via the Back
  // button kept a thread proxy whose far side was gone.
  const captured: Record<string, (event: any) => void> = {}
  ;(globalThis as any).self = {
    addEventListener: (type: string, listener: any) => { captured[type] = listener },
    removeEventListener: () => undefined
  }

  try {
    const name = uniqueName()
    const bus = acquireSharedBus(name)
    const byes: BusEnvelope[] = []
    bus.subscribe(envelope => {
      if (envelope.kind === "c2s" && envelope.msg && envelope.msg.type === "bye") byes.push(envelope)
    })

    const adapter = new BusClientAdapter(acquireSharedBus(name))
    t.truthy(captured.pagehide, "the adapter registers a pagehide handler")

    captured.pagehide({ persisted: true })
    await delay(30)
    t.is(byes.length, 0, "a bfcache pagehide must not say goodbye")

    captured.pagehide({ persisted: false })
    await delay(30)
    t.is(byes.length, 1, "a real pagehide says goodbye")

    adapter.terminate()
    bus.release()
  } finally {
    delete (globalThis as any).self
  }
})
