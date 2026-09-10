/*
 * The fallback transport bus: one BroadcastChannel per shared-worker name,
 * carrying envelopes between the leader tab (which owns the real dedicated
 * worker) and client tabs. Core protocol messages ride inside `msg` untouched.
 *
 * BroadcastChannel does not deliver a message back to the context that posted
 * it, but the leader tab is also a client of its own worker — so post() echoes
 * every envelope to local subscribers as well (on a microtask, to keep
 * delivery consistently asynchronous).
 */

export type BusEnvelope =
  | { kind: "hello", clientId: string }
  | { kind: "c2s", clientId: string, msg: any }
  | { kind: "s2c", clientId: string, msg: any, leaderId: string }
  | { kind: "s2c-all", msg: any }
  | { kind: "worker-error", message: string }
  // leaderId lets clients distinguish "my leader announced itself" (no-op)
  // from "a NEW leader took over" (fail pending calls, carry on fresh).
  | { kind: "leader-online", leaderId: string }

export interface SharedBus {
  post(envelope: BusEnvelope): void
  subscribe(listener: (envelope: BusEnvelope) => void): () => void
  /** Release one user of the bus; the channel closes when the last one leaves. */
  release(): void
}

export const channelName = (name: string) => `threadsx:shared:${name}`
export const lockName = (name: string) => `threadsx:shared-leader:${name}`

const busRegistry = new Map<string, { bus: SharedBus, users: number }>()

/**
 * One bus instance per (tab, name): the leader server and any number of
 * spawnShared() clients in the same tab all share it, which is also what
 * makes local (same-tab) leader↔client delivery work.
 */
export function acquireSharedBus(name: string): SharedBus {
  const existing = busRegistry.get(name)
  if (existing) {
    existing.users++
    return existing.bus
  }

  const channel = new BroadcastChannel(channelName(name))
  const listeners = new Set<(envelope: BusEnvelope) => void>()

  const deliver = (envelope: BusEnvelope) => {
    for (const listener of [...listeners]) {
      listener(envelope)
    }
  }

  channel.addEventListener("message", event => deliver(event.data))

  const bus: SharedBus = {
    post(envelope) {
      channel.postMessage(envelope)
      // Local echo: BroadcastChannel skips the posting context.
      queueMicrotask(() => deliver(envelope))
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    release() {
      const entry = busRegistry.get(name)
      if (!entry) return
      entry.users--
      if (entry.users <= 0) {
        busRegistry.delete(name)
        channel.close()
        listeners.clear()
      }
    }
  }

  busRegistry.set(name, { bus, users: 1 })
  return bus
}
