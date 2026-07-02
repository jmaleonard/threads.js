import { expose } from "../../src/worker"

// Delays calling expose() so that spawning with a short timeout fails with an
// init timeout — used to test pool termination when a worker never initializes.
setTimeout(() => {
  expose(() => "ready")
}, 2000)
