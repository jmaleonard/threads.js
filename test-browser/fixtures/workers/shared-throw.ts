// Shared-worker fixture that fails during startup AFTER exposing its API.
// spawnShared() must reject with this error instead of timing out (native
// path regression: SharedWorkerGlobalScope has no self.postMessage, so the
// generic uncaught-error relay could never deliver it).
import { exposeShared } from "../../../dist-esm/worker/index.js"

exposeShared({
  unusedMethod() {
    return 0
  }
})

throw Error("Shared worker startup failure")
