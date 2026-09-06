import test from "ava"
import { BlobWorker, spawn, Thread } from "../src/index"

// A minimal worker implementing the threads message protocol by hand, so the
// source string does not depend on resolving the library from inside an
// eval()-ed worker.
const workerSource = `
const { parentPort } = require("worker_threads")
parentPort.postMessage({ type: "init", exposed: { type: "function" } })
parentPort.on("message", message => {
  if (message.type === "run") {
    parentPort.postMessage({ type: "running", uid: message.uid, resultType: "promise" })
    parentPort.postMessage({ type: "result", uid: message.uid, complete: true, payload: message.args[0] * 2 })
  }
})
`

test("BlobWorker.fromText() spawns a node worker from source code", async t => {
  const double = await spawn<(x: number) => number>(BlobWorker.fromText(workerSource))
  t.is(await double(21), 42)
  await Thread.terminate(double)
})

test("BlobWorker spawns a node worker from a binary blob", async t => {
  const double = await spawn<(x: number) => number>(
    new BlobWorker(new TextEncoder().encode(workerSource))
  )
  t.is(await double(21), 42)
  await Thread.terminate(double)
})
