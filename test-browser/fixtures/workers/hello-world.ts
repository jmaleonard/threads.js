// Browser worker fixture. Imported from dist-esm so esbuild bundles the
// browser worker implementation via the package.json `browser` field.
import { expose } from "../../../dist-esm/worker/index.js"

expose(function helloWorld(magic?: string) {
  if (magic === "__coverage__") {
    // Coverage runs: hand the istanbul counters back to the page before the
    // worker is terminated (they live in the worker's global scope).
    return (globalThis as any).__coverage__
  }
  return "Hello World"
})
