# Changelog - threadsx

All notable changes to `threadsx` are documented here. Each release is also
published on the [releases page](https://github.com/jmaleonard/threadsx/releases).

## v2.0.1

Discoverability and metadata only — no functional or API changes.

- Broaden npm `keywords` and `description` so the package is easier to find.
- Add `/llms.txt` and `/llms-full.txt` plus Open Graph / Twitter Card metadata
  (and a social preview image) to the documentation site.

## v2.0.0

First release of `threadsx` — a maintained, modernized fork of
[threads.js](https://github.com/andywer/threads.js).

### ⚠️ Breaking changes

- **Node.js 20+ required** (`engines: ">=20"`). Node 18 and below are no longer
  supported.
- **Removed the `tiny-worker` fallback.** Native `worker_threads` is always used
  in Node.js.
- Package renamed to **`threadsx`** — install with `npm install threadsx` and
  import from `threadsx`.

### ✨ Improvements

- Cleaner CJS/ESM dual-package with explicit `exports` conditions: bundlers get
  the tree-shakeable `dist-esm` build via the `module` condition, while Node.js
  gets a runtime-safe entry for both module systems.
- webpack 5 native worker support: `spawn(new Worker(new URL("./worker", import.meta.url)))`
  works out of the box, with no `threads-plugin` required. The node `Worker`
  implementation now accepts a `URL`.
- Modernized toolchain: TypeScript 5.9, rollup 4, ava 7 + tsx, ESLint 10
  (replacing the deprecated tslint), and Playwright (replacing puppet-run) for
  real-browser tests. Test coverage is enforced with a c8 gate.

### 🐛 Bug fixes

- `spawn()` now terminates a worker that fails to initialize, instead of leaking
  a live worker handle.
- The init-timeout timer is always cleared on a failed spawn, instead of keeping
  the event loop alive until it fires.

## Earlier history (threads.js)

`threadsx` continues from `threads@1.7.0`. For the history of the upstream
project:

- **threads.js v1.x** — see the [threads.js releases](https://github.com/andywer/threads.js/releases).
- **threads.js v0.x** — see the [CHANGELOG on the `v0` branch](https://github.com/andywer/threads.js/blob/v0/CHANGELOG.md).
