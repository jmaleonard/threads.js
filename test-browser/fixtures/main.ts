/*
 * Master-side browser entry. Bundled with esbuild (browser platform) and loaded
 * by the Playwright spec, which calls `window.runThreadsTests()` and asserts on
 * the returned values. Exercises the real browser code path of threads.js.
 */
// Imported from the built dist-esm output (not src) so esbuild applies the
// package.json `browser` field and bundles the browser implementations,
// exactly as a downstream consumer's bundler would.
import { spawn, BlobWorker, Thread } from "../../dist-esm/index.js"

// Makes `new Worker()` resolve to the threads.js Worker implementation.
import "../../dist-esm/master/register.js"

async function helloWorldTest() {
  const helloWorld = await spawn<() => string>(new Worker("./workers/hello-world.js"))
  const result = await helloWorld()
  await Thread.terminate(helloWorld)
  return result
}

async function incrementTest() {
  const increment = await spawn<(by?: number) => number>(new Worker("./workers/increment.js"))
  const results = [await increment(), await increment(), await increment()]
  await Thread.terminate(increment)
  return results
}

async function blobWorkerTest() {
  const baseUrl = new URL(window.location.href).origin
  const workerSource = `
    // Makes expose() available on the worker's global scope
    importScripts(${JSON.stringify(baseUrl + "/worker.js")})

    let counter = 0

    expose(function() {
      return ++counter
    })
  `
  const increment = await spawn<() => number>(BlobWorker.fromText(workerSource))
  const results = [await increment(), await increment(), await increment()]
  await Thread.terminate(increment)
  return results
}

;(window as any).runThreadsTests = async () => ({
  helloWorld: await helloWorldTest(),
  increment: await incrementTest(),
  blobWorker: await blobWorkerTest()
})
