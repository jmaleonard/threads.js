# Shared worker across browser tabs

One worker instance shared by every tab: a counter that all tabs increment
together, with worker-initiated broadcasts keeping every tab's UI in sync.
Uses a native `SharedWorker` where the browser has one, and threadsx's
BroadcastChannel fallback elsewhere (e.g. Chrome on Android).

```bash
npm install threadsx esbuild
node build.mjs
node serve.mjs
```

Then open http://localhost:8080 **in two or more tabs**:

- Click "Increment" in any tab — the count is shared, so tabs take turns
  raising the same number.
- Every click updates *all* tabs immediately via `broadcast()` /
  `Thread.broadcasts()`.
- Close a tab; the others keep working. On the fallback path, closing the
  leader tab hands the worker to another tab (with fresh state — see the
  [docs](https://threadsx.jmaleonard.com/usage-shared) on failover).

Tick "Force BroadcastChannel fallback" before connecting to try the fallback
transport in a browser that has native SharedWorker support.
