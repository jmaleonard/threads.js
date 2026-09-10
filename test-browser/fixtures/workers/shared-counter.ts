// Shared-worker fixture. Works both as a native SharedWorker and as the
// dedicated worker the fallback leader spawns — exposeShared() adapts.
// Imported from dist-esm so esbuild bundles the browser implementation via
// the package.json `browser` field.
import { Observable } from "observable-fns"
import { exposeShared } from "../../../dist-esm/worker/index.js"

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
  ticks() {
    return new Observable<number>(observer => {
      let i = 0
      const interval = setInterval(() => observer.next(i++), 20)
      return () => clearInterval(interval)
    })
  }
})
