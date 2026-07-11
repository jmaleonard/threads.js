import test from "ava"
import { spawn, Thread, ThreadCloneError, Worker } from "../src/index"

test("passing a non-cloneable argument rejects with a ThreadCloneError", async t => {
  const increment = await spawn<(by: number) => Promise<number>>(new Worker("./workers/increment.ts"))

  try {
    // A function is not structured-cloneable, so postMessage() to the worker throws.
    const error: ThreadCloneError = await t.throwsAsync(
      () => increment((() => 1) as any),
      { instanceOf: ThreadCloneError }
    )
    t.is(error.name, "ThreadCloneError")
    t.regex(error.message, /structured-cloneable/)
    t.truthy(error.cause)
  } finally {
    await Thread.terminate(increment)
  }
})
