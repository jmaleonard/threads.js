import { serialize } from "../common"
import { SerializedError, WorkerMessageType, WorkerUncaughtErrorMessage } from "../types/messages"
import { WorkerFunction, WorkerModule } from "../types/worker"
import { createConnection, createInitMessage } from "./connection"
import Implementation from "./implementation"

export { registerSerializer } from "../common"
export { Transfer } from "../transferable"
export { exposeShared, SharedWorkerContext } from "./expose-shared"

/** Returns `true` if this code is currently running in a worker. */
export const isWorkerRuntime = Implementation.isWorkerRuntime

let exposeCalled = false

function postUncaughtErrorMessage(error: Error) {
  try {
    const errorMessage: WorkerUncaughtErrorMessage = {
      type: WorkerMessageType.uncaughtError,
      error: serialize(error) as any as SerializedError
    }
    Implementation.postMessageToMaster(errorMessage)
  } catch (subError) {
    console.error(
      "Not reporting uncaught error back to master thread as it " +
      "occured while reporting an uncaught error already." +
      "\nLatest error:", subError,
      "\nOriginal error:", error
    )
  }
}

/**
 * Expose a function or a module (an object whose values are functions)
 * to the main thread. Must be called exactly once in every worker thread
 * to signal its API to the main thread.
 *
 * @param exposed Function or object whose values are functions
 */
export function expose(exposed: WorkerFunction | WorkerModule<any>) {
  if (!Implementation.isWorkerRuntime()) {
    throw Error("expose() called in the master thread.")
  }
  if (exposeCalled) {
    throw Error("expose() called more than once. This is not possible. Pass an object to expose() if you want to expose multiple functions.")
  }
  if (typeof exposed !== "function" && (typeof exposed !== "object" || !exposed)) {
    throw Error(`Invalid argument passed to expose(). Expected a function or an object, got: ${exposed}`)
  }
  exposeCalled = true

  const connection = createConnection(exposed, (message, transferList) =>
    Implementation.postMessageToMaster(message, transferList)
  )
  Implementation.subscribeToMasterMessages(messageData => {
    connection.handleMessage(messageData)
  })
  Implementation.postMessageToMaster(createInitMessage(exposed))
}

if (typeof self !== "undefined" && typeof self.addEventListener === "function" && Implementation.isWorkerRuntime()) {
  self.addEventListener("error", event => {
    // Post with some delay, so the master had some time to subscribe to messages
    setTimeout(() => postUncaughtErrorMessage(event.error || event), 250)
  })
  self.addEventListener("unhandledrejection", event => {
    const error = (event as any).reason
    if (error && typeof (error as any).message === "string") {
      // Post with some delay, so the master had some time to subscribe to messages
      setTimeout(() => postUncaughtErrorMessage(error), 250)
    }
  })
}

if (typeof process !== "undefined" && typeof process.on === "function" && Implementation.isWorkerRuntime()) {
  process.on("uncaughtException", (error) => {
    // Post with some delay, so the master had some time to subscribe to messages
    setTimeout(() => postUncaughtErrorMessage(error), 250)
  })
  process.on("unhandledRejection", (error) => {
    if (error && typeof (error as any).message === "string") {
      // Post with some delay, so the master had some time to subscribe to messages
      setTimeout(() => postUncaughtErrorMessage(error as any), 250)
    }
  })
}
