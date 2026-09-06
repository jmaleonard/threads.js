import { expose } from "../../src/worker"

// Passing something that is neither a function nor an object must make
// expose() throw, which surfaces as a top-level worker error in the master.
expose(42 as any)
