// Browser worker fixture. Imported from dist-esm so esbuild bundles the
// browser worker implementation via the package.json `browser` field.
import { expose } from "../../../dist-esm/worker/index.js"

let counter = 0

expose(function increment(by: number = 1) {
  if ((by as unknown) === "__coverage__") {
    // Coverage runs: hand the istanbul counters back to the page before the
    // worker is terminated (they live in the worker's global scope).
    return (globalThis as any).__coverage__
  }
  counter += by
  return counter
})
