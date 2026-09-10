// Runs once for ALL tabs — as a native SharedWorker, or as the dedicated
// worker owned by the leader tab on the BroadcastChannel fallback path.
// exposeShared() adapts to either runtime.
import { exposeShared } from "threadsx/worker"

let count = 0
const startedAt = new Date().toISOString()

const { broadcast, connectionCount } = exposeShared({
  increment() {
    count += 1
    // Push the new state to every connected tab, not just the caller.
    broadcast({ count, tabs: connectionCount() })
    return count
  },
  getState() {
    return { count, startedAt, tabs: connectionCount() }
  }
})
