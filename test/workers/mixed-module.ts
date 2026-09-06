import { expose } from "../../src/worker"

// A module with a non-function property: expose() must only announce the
// function-valued keys as callable methods.
expose({
  greet: () => "hi",
  notAFunction: 42
} as any)
