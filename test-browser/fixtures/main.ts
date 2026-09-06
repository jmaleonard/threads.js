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

// Coverage runs (COVERAGE=1): the bundles are istanbul-instrumented and each
// worker's exposed function returns its counters when called with this magic
// argument. Uninstrumented workers return their normal result, which is
// simply skipped.
const workerCoverages: any[] = []

async function collectWorkerCoverage(fn: (arg?: any) => Promise<any>) {
  try {
    const coverage = await fn("__coverage__")
    if (coverage && typeof coverage === "object") {
      workerCoverages.push(coverage)
    }
  } catch {
    // Not instrumented or the worker refused the call — nothing to collect.
  }
}

async function helloWorldTest() {
  const helloWorld = await spawn<(magic?: string) => string>(new Worker("./workers/hello-world.js"))
  const result = await helloWorld()
  await collectWorkerCoverage(helloWorld)
  await Thread.terminate(helloWorld)
  return result
}

async function incrementTest() {
  const increment = await spawn<(by?: number) => number>(new Worker("./workers/increment.js"))
  const results = [await increment(), await increment(), await increment()]
  await collectWorkerCoverage(increment)
  await Thread.terminate(increment)
  return results
}

async function blobWorkerTest() {
  const baseUrl = new URL(window.location.href).origin
  const workerSource = `
    // Makes expose() available on the worker's global scope
    importScripts(${JSON.stringify(baseUrl + "/worker.js")})

    let counter = 0

    expose(function(magic) {
      if (magic === "__coverage__") {
        return globalThis.__coverage__
      }
      return ++counter
    })
  `
  const increment = await spawn<(magic?: string) => number>(BlobWorker.fromText(workerSource))
  const results = [await increment(), await increment(), await increment()]
  await collectWorkerCoverage(increment)
  await Thread.terminate(increment)
  return results
}

;(window as any).runThreadsTests = async () => ({
  helloWorld: await helloWorldTest(),
  increment: await incrementTest(),
  blobWorker: await blobWorkerTest()
})

;(window as any).collectCoverage = () => ({
  page: (globalThis as any).__coverage__ || null,
  workers: workerCoverages
})
