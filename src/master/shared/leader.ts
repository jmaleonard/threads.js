/*
 * Fallback-path leader: the tab that wins the Web Lock owns the real
 * dedicated worker and serves every tab's calls over the bus.
 *
 * Job uids are client-local, so the leader remaps them: each incoming run gets
 * a leader-allocated uid before it reaches the worker, and replies are mapped
 * back and addressed to the originating client. The lock is held until the
 * leader tab dies; the next queued tab's callback then fires, respawns the
 * worker and announces itself, at which point clients fail their in-flight
 * calls with SharedWorkerLeaderLostError and carry on against the fresh
 * instance.
 */
import { MasterMessageType, WorkerMessageType } from "../../types/messages"
import { Worker as WorkerType } from "../../types/master"
import { BusEnvelope, lockName, SharedBus } from "./bus"

export type SharedWorkerFactory = (context: { shared: boolean }) => any

interface JobRoute {
  clientId: string
  clientUid: number
}

const electionsStarted = new Set<string>()

/**
 * Join the leader election for `name`. Idempotent per (tab, name). Whichever
 * tab's lock callback runs becomes the leader for the rest of its lifetime.
 */
export function startLeaderElection(name: string, bus: SharedBus, factory: SharedWorkerFactory): void {
  if (electionsStarted.has(name)) return
  electionsStarted.add(name)

  navigator.locks.request(lockName(name), { mode: "exclusive" }, () => {
    runAsLeader(bus, factory)
    // Hold the lock until the tab goes away.
    return new Promise<void>(() => undefined)
  }).catch(() => {
    // The lock request itself failed (e.g. the tab is shutting down) —
    // another tab will win the election instead.
    electionsStarted.delete(name)
  })
}

function runAsLeader(bus: SharedBus, factory: SharedWorkerFactory): void {
  const worker: WorkerType = factory({ shared: false })
  const leaderId = Math.random().toString(36).slice(2)

  let nextLeaderUid = 1
  const routesByLeaderUid = new Map<number, JobRoute>()
  const leaderUidByClientJob = new Map<string, number>()
  const clientJobKey = (clientId: string, clientUid: number) => `${clientId}:${clientUid}`

  let initMessage: any = null
  const pendingHellos = new Set<string>()

  const replyToClient = (clientId: string, msg: any) => bus.post({ kind: "s2c", clientId, msg, leaderId })

  worker.addEventListener("message", ((event: any) => {
    const msg = event.data
    if (!msg) return

    if (msg.type === WorkerMessageType.init) {
      initMessage = msg
      for (const clientId of pendingHellos) {
        replyToClient(clientId, initMessage)
      }
      pendingHellos.clear()
      // Now that init can be replayed, tell the world a leader is serving.
      bus.post({ kind: "leader-online", leaderId })
      return
    }

    if (msg.type === WorkerMessageType.broadcast || msg.type === WorkerMessageType.uncaughtError) {
      bus.post({ kind: "s2c-all", msg })
      return
    }

    if (typeof msg.uid === "number") {
      const route = routesByLeaderUid.get(msg.uid)
      if (!route) return
      // A promise result, a final observable result, or an error ends the job.
      const jobEnded = msg.type === WorkerMessageType.error ||
        (msg.type === WorkerMessageType.result && msg.complete)
      if (jobEnded) {
        routesByLeaderUid.delete(msg.uid)
        leaderUidByClientJob.delete(clientJobKey(route.clientId, route.clientUid))
      }
      replyToClient(route.clientId, { ...msg, uid: route.clientUid })
    }
  }) as EventListener)

  worker.addEventListener("error", ((event: any) => {
    const message = event && event.data && event.data.message
      ? String(event.data.message)
      : "The shared worker errored."
    bus.post({ kind: "worker-error", message })
  }) as EventListener)

  const dropClientJobs = (clientId: string) => {
    for (const [leaderUid, route] of routesByLeaderUid) {
      if (route.clientId !== clientId) continue
      worker.postMessage({ type: MasterMessageType.cancel, uid: leaderUid })
      routesByLeaderUid.delete(leaderUid)
      leaderUidByClientJob.delete(clientJobKey(route.clientId, route.clientUid))
    }
  }

  bus.subscribe((envelope: BusEnvelope) => {
    if (envelope.kind === "hello") {
      if (initMessage) {
        replyToClient(envelope.clientId, initMessage)
      } else {
        pendingHellos.add(envelope.clientId)
      }
      return
    }

    if (envelope.kind !== "c2s") return
    // Jobs sent before this leader announced itself belong to a dead
    // predecessor. The client will reject them on our leader-online and
    // retry, so serving them here would execute them twice.
    if (!initMessage) return
    const { clientId, msg } = envelope

    if (msg.type === MasterMessageType.run) {
      const leaderUid = nextLeaderUid++
      routesByLeaderUid.set(leaderUid, { clientId, clientUid: msg.uid })
      leaderUidByClientJob.set(clientJobKey(clientId, msg.uid), leaderUid)
      worker.postMessage({ ...msg, uid: leaderUid })
    } else if (msg.type === MasterMessageType.cancel) {
      const leaderUid = leaderUidByClientJob.get(clientJobKey(clientId, msg.uid))
      if (typeof leaderUid === "number") {
        routesByLeaderUid.delete(leaderUid)
        leaderUidByClientJob.delete(clientJobKey(clientId, msg.uid))
        worker.postMessage({ type: MasterMessageType.cancel, uid: leaderUid })
      }
    } else if (msg.type === MasterMessageType.bye) {
      dropClientJobs(clientId)
    }
  })
}
