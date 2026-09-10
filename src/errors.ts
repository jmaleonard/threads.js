/**
 * Thrown when a value passed to a thread cannot be cloned by the structured
 * clone algorithm (e.g. functions, class instances with methods, or other
 * non-serializable values). Wraps the underlying `DataCloneError` / `DOMException`
 * with an actionable message. Access the original error via `.cause`.
 */
export class ThreadCloneError extends Error {
  public readonly cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = "ThreadCloneError"
    this.cause = cause
    // Restore the prototype chain — extending built-ins breaks `instanceof`
    // when compiled down to ES2015 without this.
    Object.setPrototypeOf(this, ThreadCloneError.prototype)
  }
}

/**
 * Thrown to reject pending shared-worker calls when the tab that owned the
 * fallback (BroadcastChannel) worker went away and a new leader took over.
 * The shared worker was respawned, so its in-memory state is fresh; calls
 * made after this error work against the new instance.
 */
export class SharedWorkerLeaderLostError extends Error {
  constructor(message: string = "The tab hosting the shared worker closed. The worker was restarted; retry the call.") {
    super(message)
    this.name = "SharedWorkerLeaderLostError"
    Object.setPrototypeOf(this, SharedWorkerLeaderLostError.prototype)
  }
}

/**
 * Whether an error is a structured-clone failure. Both browsers and Node's
 * `worker_threads` throw a `DOMException`/error named `"DataCloneError"` when a
 * value cannot be cloned across the thread boundary.
 */
export function isDataCloneError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === "object" &&
    (error as { name?: unknown }).name === "DataCloneError"
  )
}
