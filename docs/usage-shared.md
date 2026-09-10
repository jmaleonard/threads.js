---
layout: article
title: Shared workers
permalink: /usage-shared
excerpt: One worker instance shared by every tab — SharedWorker with a BroadcastChannel fallback.
sidebar:
  nav: sidebar
aside:
  toc: true
---

## One worker, every tab

`spawnShared()` connects all tabs of your origin to a single worker instance — a shared cache, one WebSocket, cross-tab coordination. Where the browser has [`SharedWorker`](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker), threadsx uses it directly. Where it is missing (notably Chrome on Android), one tab is elected leader via the Web Locks API, owns a regular dedicated worker, and serves the other tabs over a `BroadcastChannel`. Your code is the same either way.

```js
// master.js — run in every tab
import { spawnShared, Thread } from "threadsx"

const counter = await spawnShared(
  ({ shared }) => shared
    ? new SharedWorker(new URL("./workers/counter.js", import.meta.url), { name: "counter" })
    : new Worker(new URL("./workers/counter.js", import.meta.url)),
  { name: "counter" }
)

await counter.increment()      // all tabs hit the same instance
```

```js
// workers/counter.js
import { exposeShared } from "threadsx/worker"

let count = 0

const { broadcast } = exposeShared({
  increment() {
    count += 1
    broadcast({ count })       // push to every connected tab
    return count
  },
  getCount() {
    return count
  }
})
```

## The factory and the name

The first argument is a factory instead of a worker instance, for two reasons:

- On the fallback path only the elected leader tab may actually create the worker — the factory runs there, with `{ shared: false }`.
- Bundlers detect workers statically, so the literal `new SharedWorker(new URL(…))` and `new Worker(new URL(…))` calls must appear in your code.

`options.name` is required. It is the cross-tab identity: it names the `SharedWorker`, the fallback `BroadcastChannel`, and the leader-election lock. Two calls with the same name reach the same instance; different names get different instances.

## Broadcast events

`exposeShared()` returns a handle with `broadcast(value)`, which pushes a message to every connected tab. Subscribe with `Thread.broadcasts()`:

```js
Thread.broadcasts(counter).subscribe(({ count }) => {
  document.title = `Count: ${count}`
})
```

Broadcasts are fire-and-forget events from the worker — independent of any call. For request/response, just call the exposed functions; for streamed results per tab, return an observable from a worker function as usual.

## Lifecycle

- `Thread.terminate(thread)` disconnects **this tab only**. The worker keeps running while any other tab is connected. Browsers shut a `SharedWorker` down once its last client is gone.
- Observables returned by worker functions are per-tab jobs: unsubscribing in one tab cancels only that tab's subscription.
- Tabs that disappear without disconnecting (a crash, a mobile OOM kill) are pruned by a heartbeat after ~45 seconds: their jobs are canceled and `connectionCount()` drops. Back/forward-cache navigations do **not** disconnect — a page restored via the Back button keeps its working connection.
- `Thread.broadcasts()` completes when the thread terminates, like `Thread.events()`.
- On the fallback path, if the leader tab closes, another tab takes over and **respawns the worker with fresh state**. Calls that were in flight reject with `SharedWorkerLeaderLostError`; calls made afterwards work against the new instance. Keep shared state re-derivable, or persist it (e.g. IndexedDB) if it must survive.

```js
import { SharedWorkerLeaderLostError } from "threadsx"

try {
  await counter.increment()
} catch (error) {
  if (error instanceof SharedWorkerLeaderLostError) {
    await counter.increment()  // the respawned worker serves this one
  } else {
    throw error
  }
}
```

## Limitations

- Browser only. In Node.js there is no `SharedWorker`; `spawnShared()` throws — use `spawn()` there.
- `Transfer()` is unsupported on the fallback path: `BroadcastChannel` structured-clones values, it cannot transfer them. On the native path transfers work as usual.
- Worker state does not survive a fallback leader failover (see above). On the native path the instance lives independently of any particular tab.

## TypeScript

`spawnShared<T>()` is typed like `spawn<T>()`:

```ts
type Counter = {
  increment(): Promise<number>
  getCount(): Promise<number>
}

const counter = await spawnShared<Counter>(factory, { name: "counter" })
const next: number = await counter.increment()
```
