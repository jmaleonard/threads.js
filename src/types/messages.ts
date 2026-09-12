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
  clients = "clients",
  pong = "pong",
  run = "run"
}

/**
 * Client-count update, sent to the fallback path's dedicated worker by the
 * leader so `connectionCount()` reflects the actual number of connected tabs
 * on both transports.
 */
export type MasterClientsMessage = {
  type: MasterMessageType.clients,
  count: number
}

/** Liveness reply to a shared worker's ping. */
export type MasterPongMessage = {
  type: MasterMessageType.pong
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

export type MasterSentMessage =
  | MasterByeMessage
  | MasterClientsMessage
  | MasterJobCancelMessage
  | MasterJobRunMessage
  | MasterPongMessage

////////////////////////////
// Messages sent by worker:

export enum WorkerMessageType {
  broadcast = "broadcast",
  error = "error",
  init = "init",
  ping = "ping",
  result = "result",
  running = "running",
  uncaughtError = "uncaughtError"
}

/** Liveness probe from a shared worker to a connected client. */
export type WorkerPingMessage = {
  type: WorkerMessageType.ping
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
  | WorkerPingMessage
  | WorkerJobErrorMessage
  | WorkerJobResultMessage
  | WorkerJobStartMessage
  | WorkerUncaughtErrorMessage
