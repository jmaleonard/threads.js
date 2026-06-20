// Browser worker fixture. Imported from dist-esm so esbuild bundles the
// browser worker implementation via the package.json `browser` field.
import { expose } from "../../../dist-esm/worker/index.js"

expose(function helloWorld() {
  return "Hello World"
})
