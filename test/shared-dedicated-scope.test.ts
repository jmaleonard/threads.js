/*
 * Unit tests for exposeShared()'s dedicated-worker (fallback) scope, driven
 * through a fake DedicatedWorkerGlobalScope (own process: exposeShared() may
 * be called only once per process).
 */
import test from "ava"

test.serial("exposeShared() serves the leader over self and tracks the relayed client count", async t => {
  const posted: any[] = []
  let messageListener: ((event: any) => void) | null = null
  ;(globalThis as any).self = {
    postMessage: (message: any) => posted.push(message),
    addEventListener: (type: string, listener: any) => {
      if (type === "message") messageListener = listener
    }
  }

  try {
    const { exposeShared } = await import("../src/worker/expose-shared")

    const context = exposeShared({
      double: (x: number) => x * 2
    })

    // Init goes out immediately, like expose().
    t.is(posted[0].type, "init")
    t.deepEqual(posted[0].exposed, { type: "module", methods: ["double"] })

    // Jobs run through the normal connection machinery.
    messageListener!({ data: { type: "run", uid: 3, method: "double", args: [21] } })
    await new Promise(resolve => setTimeout(resolve, 20))
    t.true(posted.some(message => message.type === "result" && message.uid === 3 && message.payload === 42))

    // Regression: connectionCount() used to hardcode 1 on the fallback path;
    // the leader now relays the real client count.
    t.is(context.connectionCount(), 1)
    messageListener!({ data: { type: "clients", count: 3 } })
    t.is(context.connectionCount(), 3)

    // broadcast() posts to the leader, which relays it to every tab.
    context.broadcast({ hello: "tabs" })
    const broadcast = posted.find(message => message.type === "broadcast")
    t.truthy(broadcast)
    t.deepEqual(broadcast.payload, { hello: "tabs" })
  } finally {
    delete (globalThis as any).self
  }
})
