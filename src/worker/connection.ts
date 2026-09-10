/*
 * Per-connection job machinery, shared by expose() (one implicit master) and
 * exposeShared() (one connection per connected tab/port). A connection owns
 * its own subscription state and posts every reply through the `post` function
 * it was created with, so replies always go back to the originating peer.
 */
import { Observable, Subscription } from "observable-fns"
import { deserialize, serialize } from "../common"
import { isTransferDescriptor, TransferDescriptor } from "../transferable"
import {
  MasterJobCancelMessage,
  MasterJobRunMessage,
  MasterMessageType,
  SerializedError,
  WorkerInitMessage,
  WorkerJobErrorMessage,
  WorkerJobResultMessage,
  WorkerJobStartMessage,
  WorkerMessageType
} from "../types/messages"
import { WorkerFunction, WorkerModule } from "../types/worker"

export type PostMessageFn = (message: any, transferList?: any[]) => void

export interface WorkerConnection {
  /** Route one message received from this connection's master. */
  handleMessage(messageData: any): void
  /** Cancel every job subscription still active on this connection. */
  dispose(): void
}

const isMasterJobCancelMessage = (thing: any): thing is MasterJobCancelMessage => thing && thing.type === MasterMessageType.cancel
const isMasterJobRunMessage = (thing: any): thing is MasterJobRunMessage => thing && thing.type === MasterMessageType.run

/**
 * Detects observables via the `Symbol.observable` / `@@observable` interop protocol.
 * Inlined from the `is-observable` package (which is now ESM-only) to keep the
 * CommonJS build working without an extra dependency.
 */
function isInteropObservable(thing: any): boolean {
  if (!thing) {
    return false
  }
  const observableSymbol = (Symbol as any).observable
  if (typeof observableSymbol === "symbol" && typeof thing[observableSymbol] === "function") {
    return thing === thing[observableSymbol]()
  }
  if (typeof thing["@@observable"] === "function") {
    return thing === thing["@@observable"]()
  }
  return false
}

/**
 * There are issues with interop observable detection not recognizing zen-observable's instances.
 * We are using `observable-fns`, but it's based on zen-observable, too.
 */
const isObservable = (thing: any): thing is Observable<any> => isInteropObservable(thing) || isZenObservable(thing)

function isZenObservable(thing: any): thing is Observable<any> {
  return thing && typeof thing === "object" && typeof thing.subscribe === "function"
}

function deconstructTransfer(thing: any) {
  return isTransferDescriptor(thing)
    ? { payload: thing.send, transferables: thing.transferables }
    : { payload: thing, transferables: undefined }
}

export function createInitMessage(exposed: WorkerFunction | WorkerModule<any>): WorkerInitMessage {
  if (typeof exposed === "function") {
    return {
      type: WorkerMessageType.init,
      exposed: {
        type: "function"
      }
    }
  }
  const methodNames = Object.keys(exposed).filter(key => typeof exposed[key] === "function")
  return {
    type: WorkerMessageType.init,
    exposed: {
      type: "module",
      methods: methodNames
    }
  }
}

export function createConnection(
  exposed: WorkerFunction | WorkerModule<any>,
  post: PostMessageFn
): WorkerConnection {
  const activeSubscriptions = new Map<number, Subscription<any>>()

  function postJobErrorMessage(uid: number, rawError: Error | TransferDescriptor<Error>) {
    const { payload: error, transferables } = deconstructTransfer(rawError)
    const errorMessage: WorkerJobErrorMessage = {
      type: WorkerMessageType.error,
      uid,
      error: serialize(error) as any as SerializedError
    }
    post(errorMessage, transferables)
  }

  function postJobResultMessage(uid: number, completed: boolean, resultValue?: any) {
    const { payload, transferables } = deconstructTransfer(resultValue)
    const resultMessage: WorkerJobResultMessage = {
      type: WorkerMessageType.result,
      uid,
      complete: completed ? true : undefined,
      payload
    }
    post(resultMessage, transferables)
  }

  function postJobStartMessage(uid: number, resultType: WorkerJobStartMessage["resultType"]) {
    const startMessage: WorkerJobStartMessage = {
      type: WorkerMessageType.running,
      uid,
      resultType
    }
    post(startMessage)
  }

  async function runFunction(jobUID: number, fn: WorkerFunction, args: any[]) {
    let syncResult: any

    try {
      syncResult = fn(...args)
    } catch (error) {
      return postJobErrorMessage(jobUID, error as Error)
    }

    const resultType = isObservable(syncResult) ? "observable" : "promise"
    postJobStartMessage(jobUID, resultType)

    if (isObservable(syncResult)) {
      const subscription = syncResult.subscribe(
        value => postJobResultMessage(jobUID, false, serialize(value)),
        error => {
          postJobErrorMessage(jobUID, serialize(error) as any)
          activeSubscriptions.delete(jobUID)
        },
        () => {
          postJobResultMessage(jobUID, true)
          activeSubscriptions.delete(jobUID)
        }
      )
      activeSubscriptions.set(jobUID, subscription)
    } else {
      try {
        const result = await syncResult
        postJobResultMessage(jobUID, true, serialize(result))
      } catch (error) {
        postJobErrorMessage(jobUID, serialize(error) as any)
      }
    }
  }

  function handleMessage(messageData: any) {
    if (isMasterJobRunMessage(messageData)) {
      if (typeof exposed === "function") {
        if (!messageData.method) {
          runFunction(messageData.uid, exposed, messageData.args.map(deserialize))
        }
      } else if (messageData.method) {
        runFunction(messageData.uid, exposed[messageData.method], messageData.args.map(deserialize))
      }
    } else if (isMasterJobCancelMessage(messageData)) {
      const subscription = activeSubscriptions.get(messageData.uid)
      if (subscription) {
        subscription.unsubscribe()
        activeSubscriptions.delete(messageData.uid)
      }
    }
  }

  function dispose() {
    for (const subscription of activeSubscriptions.values()) {
      subscription.unsubscribe()
    }
    activeSubscriptions.clear()
  }

  return { handleMessage, dispose }
}
