// Shared-worker fixture. Works both as a native SharedWorker and as the
// dedicated worker the fallback leader spawns — exposeShared() adapts.
// Imported from dist-esm so esbuild bundles the browser implementation via
// the package.json `browser` field.
import { Observable } from "observable-fns"
import { exposeShared, isWorkerRuntime } from "../../../dist-esm/worker/index.js"

let count = 0

const context = exposeShared({
  increment() {
    count += 1
    context.broadcast({ count })
    return count
  },
  getCount() {
    return count
  },
  // Regression: isWorkerRuntime() must be true in a SharedWorkerGlobalScope
  // (which has no self.postMessage) as well as in the fallback's dedicated
  // worker scope.
  isInWorkerRuntime() {
    return isWorkerRuntime()
  },
  ticks() {
    return new Observable<number>(observer => {
      let i = 0
      const interval = setInterval(() => observer.next(i++), 20)
      return () => clearInterval(interval)
    })
  }
})
