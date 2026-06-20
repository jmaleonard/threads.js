// Browser worker fixture. Imported from dist-esm so esbuild bundles the
// browser worker implementation via the package.json `browser` field.
import { expose } from "../../../dist-esm/worker/index.js"

let counter = 0

expose(function increment(by: number = 1) {
  counter += by
  return counter
})
