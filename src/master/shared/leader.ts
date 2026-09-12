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
 *
 * Lifecycle rules that earlier versions got wrong:
 * - Leadership acquires its OWN bus user the moment the lock is won. It must
 *   never borrow a client's refcounted bus: a Thread.terminate() in the
 *   leader tab would close the channel while the lock is still held,
 *   permanently hanging every other tab.
 * - A tab whose clients have all terminated withdraws its queued lock request
 *   (AbortController) and clears its election state, so a later spawnShared()
 *   in the same tab elects cleanly and no zombie leader can win a lock for
 *   nobody.
 */
import { sharedHeartbeat } from "../../shared-heartbeat"
import { Worker as WorkerType } from "../../types/master"
import { MasterMessageType, WorkerMessageType } from "../../types/messages"
import { acquireSharedBus, BusEnvelope, lockName } from "./bus"

export type SharedWorkerFactory = (context: { shared: boolean }) => any

interface JobRoute {
  clientId: string
  clientUid: number
}

interface Election {
  clients: number
  controller: { aborted: boolean, abort(): void, signal?: any }
  isLeader: boolean
}

const elections = new Map<string, Election>()

function createAbortController(): Election["controller"] {
  if (typeof AbortController === "function") {
    const controller = new AbortController()
    return { get aborted() { return controller.signal.aborted }, abort: () => controller.abort(), signal: controller.signal }
  }
  // Environments without AbortController: the request simply stays queued.
  let aborted = false
  return { get aborted() { return aborted }, abort: () => { aborted = true } }
}

/**
 * Register one spawnShared() client for `name` and join the leader election
 * if this tab has not joined yet. Returns a release function to call on
 * Thread.terminate(): when the tab's last client releases and the tab has not
 * (yet) become leader, its queued lock request is withdrawn and the election
 * state cleared so a future spawnShared() starts fresh. An active leader
 * keeps serving other tabs even with no local clients.
 */
export function registerSharedClient(name: string, factory: SharedWorkerFactory): () => void {
  let election = elections.get(name)
  if (!election) {
    election = { clients: 0, controller: createAbortController(), isLeader: false }
    elections.set(name, election)

    const request: Promise<void> = (navigator as any).locks.request(
      lockName(name),
      { mode: "exclusive", signal: election.controller.signal },
      () => {
        election!.isLeader = true
        runAsLeader(name, factory)
        // Hold the lock until the tab goes away.
        return new Promise<void>(() => undefined)
      }
    )
    request.catch(() => {
      // Aborted (last local client left before we were elected) or the tab is
      // shutting down. If this election record is still current, clear it so
      // a later spawnShared() in this tab can re-join.
      if (elections.get(name) === election) {
        elections.delete(name)
      }
    })
  }

  election.clients++
  let released = false
  return () => {
    if (released) return
    released = true
    election!.clients--
    if (election!.clients <= 0 && !election!.isLeader) {
      election!.controller.abort()
      if (elections.get(name) === election) {
        elections.delete(name)
      }
    }
  }
}

function runAsLeader(name: string, factory: SharedWorkerFactory): void {
  // The leader's own bus user: independent of any client's lifecycle, held
  // until the tab dies.
  const bus = acquireSharedBus(name)
  const worker: WorkerType = factory({ shared: false })
  const leaderId = Math.random().toString(36).slice(2)

  let nextLeaderUid = 1
  const routesByLeaderUid = new Map<number, JobRoute>()
  const leaderUidByClientJob = new Map<string, number>()
  const clientJobKey = (clientId: string, clientUid: number) => `${clientId}:${clientUid}`

  let initMessage: any = null
  const pendingHellos = new Set<string>()
  const lastSeenByClient = new Map<string, number>()

  const replyToClient = (clientId: string, msg: any) => bus.post({ kind: "s2c", clientId, msg, leaderId })

  const postClientCount = () => {
    worker.postMessage({ type: MasterMessageType.clients, count: lastSeenByClient.size })
  }

  const trackClient = (clientId: string) => {
    const known = lastSeenByClient.has(clientId)
    lastSeenByClient.set(clientId, Date.now())
    if (!known) postClientCount()
  }

  const dropClientJobs = (clientId: string) => {
    for (const [leaderUid, route] of routesByLeaderUid) {
      if (route.clientId !== clientId) continue
      worker.postMessage({ type: MasterMessageType.cancel, uid: leaderUid })
      routesByLeaderUid.delete(leaderUid)
      leaderUidByClientJob.delete(clientJobKey(route.clientId, route.clientUid))
    }
  }

  const dropClient = (clientId: string) => {
    dropClientJobs(clientId)
    if (lastSeenByClient.delete(clientId)) postClientCount()
  }

  // Prune clients that died without a bye (crash, OOM kill): cancel their
  // jobs so e.g. observable intervals in the worker do not run forever.
  const pruneTimer: any = setInterval(() => {
    const deadline = Date.now() - sharedHeartbeat.timeout
    for (const [clientId, lastSeen] of lastSeenByClient) {
      if (lastSeen < deadline) dropClient(clientId)
    }
  }, sharedHeartbeat.interval)
  if (pruneTimer && typeof pruneTimer.unref === "function") pruneTimer.unref()

  worker.addEventListener("message", ((event: any) => {
    const msg = event.data
    if (!msg) return

    if (msg.type === WorkerMessageType.init) {
      initMessage = msg
      for (const clientId of pendingHellos) {
        trackClient(clientId)
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
    // Browser Workers fire an ErrorEvent whose text lives on event.message;
    // threadsx's node Worker wrapper delivers { data: Error }.
    const message = (event && typeof event.message === "string" && event.message) ||
      (event && event.data && event.data.message ? String(event.data.message) : "The shared worker errored.")
    bus.post({ kind: "worker-error", message })
  }) as EventListener)

  bus.subscribe((envelope: BusEnvelope) => {
    if (envelope.kind === "hello") {
      if (initMessage) {
        trackClient(envelope.clientId)
        replyToClient(envelope.clientId, initMessage)
      } else {
        pendingHellos.add(envelope.clientId)
      }
      return
    }

    if (envelope.kind === "hb") {
      if (lastSeenByClient.has(envelope.clientId)) {
        lastSeenByClient.set(envelope.clientId, Date.now())
      }
      return
    }

    if (envelope.kind !== "c2s") return
    // Drop jobs from a dead predecessor's epoch (or from before any leader
    // existed): the client rejects them on leader-online and retries, so
    // serving them here would execute their side effects twice.
    if (!initMessage || envelope.leaderId !== leaderId) return
    const { clientId, msg } = envelope
    trackClient(clientId)

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
      dropClient(clientId)
    }
  })
}
