import { expose } from "../../src/worker"

// Crashes the worker (exits the process) when called, without ever returning a
// result — used to verify the master rejects the pending call.
expose(function crash() {
  process.exit(1)
})
