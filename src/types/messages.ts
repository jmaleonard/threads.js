export interface SerializedError {
  __error_marker: "$$error"
  message: string
  name: string
  stack?: string
}

/////////////////////////////
// Messages sent by master:

export enum MasterMessageType {
  bye = "bye",
  cancel = "cancel",
  run = "run"
}

/**
 * Sent by a shared-worker client when it disconnects (Thread.terminate() or
 * pagehide), so the worker can drop the connection from its broadcast set.
 */
export type MasterByeMessage = {
  type: MasterMessageType.bye
}

export type MasterJobCancelMessage = {
  type: MasterMessageType.cancel,
  uid: number
}

export type MasterJobRunMessage = {
  type: MasterMessageType.run,
  uid: number,
  method?: string,
  args: any[]
}

export type MasterSentMessage = MasterByeMessage | MasterJobCancelMessage | MasterJobRunMessage

////////////////////////////
// Messages sent by worker:

export enum WorkerMessageType {
  broadcast = "broadcast",
  error = "error",
  init = "init",
  result = "result",
  running = "running",
  uncaughtError = "uncaughtError"
}

/**
 * A worker-initiated event pushed to every connected client of a shared
 * worker. Not tied to any job.
 */
export type WorkerBroadcastMessage = {
  type: WorkerMessageType.broadcast,
  payload: any
}

export type WorkerUncaughtErrorMessage = {
  type: WorkerMessageType.uncaughtError,
  error: {
    message: string,
    name: string,
    stack?: string
  }
}

export type WorkerInitMessage = {
  type: WorkerMessageType.init,
  exposed: { type: "function" } | { type: "module", methods: string[] }
}

export type WorkerJobErrorMessage = {
  type: WorkerMessageType.error,
  uid: number,
  error: SerializedError
}

export type WorkerJobResultMessage = {
  type: WorkerMessageType.result,
  uid: number,
  complete?: true,
  payload?: any
}

export type WorkerJobStartMessage = {
  type: WorkerMessageType.running,
  uid: number,
  resultType: "observable" | "promise"
}

export type WorkerSentMessage =
  | WorkerBroadcastMessage
  | WorkerInitMessage
  | WorkerJobErrorMessage
  | WorkerJobResultMessage
  | WorkerJobStartMessage
  | WorkerUncaughtErrorMessage
