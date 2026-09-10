/*
 * Unit tests for exposeShared()'s native SharedWorker scope behavior, driven
 * through a fake SharedWorkerGlobalScope (own process: exposeShared() may be
 * called only once per process).
 */
import test from "ava"
import { sharedHeartbeat } from "../src/shared-heartbeat"

interface FakePort {
  posted: any[]
  closed: boolean
  messageListener: ((event: any) => void) | null
  start(): void
  postMessage(message: any): void
  addEventListener(type: string, listener: any): void
  close(): void
}

function createFakePort(): FakePort {
  return {
    posted: [],
    closed: false,
    messageListener: null,
    start() { /* noop */ },
    postMessage(message: any) { this.posted.push(message) },
    addEventListener(type: string, listener: any) {
      if (type === "message") this.messageListener = listener
    },
    close() { this.closed = true }
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

test.serial("shared scope prunes ports whose tab stopped answering pings", async t => {
  // Regression: a tab dying without a bye (crash, OOM kill) leaked its port
  // and kept its observable subscriptions running in the worker forever.
  const originalInterval = sharedHeartbeat.interval
  const originalTimeout = sharedHeartbeat.timeout
  sharedHeartbeat.interval = 50
  sharedHeartbeat.timeout = 120

  const scopeListeners: Record<string, (event: any) => void> = {}
  ;(globalThis as any).self = {
    onconnect: null, // makes "onconnect" in self true -> shared scope detected
    addEventListener: (type: string, listener: any) => { scopeListeners[type] = listener }
  }

  try {
    const { exposeShared } = await import("../src/worker/expose-shared")
    const { Observable } = await import("observable-fns")

    let torndown = false
    const context = exposeShared({
      ticks: () => new Observable(() => {
        return () => { torndown = true }
      })
    })

    // Two tabs connect. The live one answers pings; the dead one never does.
    const livePort = createFakePort()
    const deadPort = createFakePort()
    scopeListeners.connect({ ports: [livePort] })
    scopeListeners.connect({ ports: [deadPort] })
    t.is(context.connectionCount(), 2)
    t.is(livePort.posted[livePort.posted.length - 1].type, "init")

    // The dead tab starts a job before dying, so there is state to leak.
    deadPort.messageListener!({ data: { type: "run", uid: 1, method: "ticks", args: [] } })
    t.false(torndown)

    // Keep the live port answering pings; leave the dead one silent.
    const pongTimer = setInterval(() => {
      const ping = livePort.posted.find(message => message.type === "ping")
      if (ping) livePort.messageListener!({ data: { type: "pong" } })
    }, 20)

    await delay(400)
    clearInterval(pongTimer)

    t.true(deadPort.closed, "the silent port must be closed")
    t.true(torndown, "the dead tab's observable subscription must be canceled")
    t.false(livePort.closed, "the answering port must stay connected")
    t.is(context.connectionCount(), 1)
  } finally {
    sharedHeartbeat.interval = originalInterval
    sharedHeartbeat.timeout = originalTimeout
    delete (globalThis as any).self
  }
})
