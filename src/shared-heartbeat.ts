/*
 * Liveness timings for shared workers. A tab that dies without sending its
 * bye (crash, mobile OOM kill) would otherwise leak its connection — and any
 * running observable subscriptions — inside the shared worker forever.
 *
 * Native path: the worker pings each port and prunes ports that stop ponging.
 * Fallback path: clients heartbeat the leader over the bus and the leader
 * prunes clients it has not heard from.
 *
 * Mutable so tests can shrink the timings; not part of the public API.
 */
export const sharedHeartbeat = {
  /** How often the worker pings ports / clients heartbeat the leader (ms). */
  interval: 15_000,
  /** Silence after which a connection is considered dead and pruned (ms). */
  timeout: 45_000
}
