# Changelog - threadsx

All notable changes to `threadsx` are documented here. Each release is also
published on the [releases page](https://github.com/jmaleonard/threadsx/releases).

## v2.1.0

Bug-fix and hardening release addressing a batch of long-standing upstream
issues, plus a modernization pass. No breaking API changes.

### ✨ Improvements

- **Opt out of the `process.exit` signal handlers** via the
  `THREADS_SKIP_SIGNAL_HANDLERS` environment variable, for apps that manage
  their own shutdown (upstream #388, #484).
- **Self-contained type declarations** — consuming projects no longer need the
  `"dom"` lib enabled to type-check against threadsx (upstream #429).
- **True ESM on the `import` condition.** The package now ships genuine,
  Node-loadable ESM (`esm/`) instead of re-exporting the CommonJS build, while
  bundlers keep using the tree-shakeable `dist-esm/` via the `module` condition.
  Added the missing `types` condition to the `./register` subpath (upstream #462).
- **Nameable `Pool()` return type** — the value returned by `Pool()` no longer
  leaks a private class, so consumers can name and re-export the pool type
  without declaration-emit errors (upstream #417).
- **`ThreadCloneError`** — passing a non-cloneable value (e.g. a function) to a
  thread now rejects with an actionable, catchable error that preserves the
  original `DataCloneError` as `.cause`, instead of a cryptic `DOMException`.
- Upgraded the toolchain to **TypeScript 6.0**.

### 🐛 Bug fixes

- Falsey observable values (`0`, `false`, `""`) emitted from a worker are no
  longer dropped (upstream #471).
- Robust **pool termination**: `completed()` resolves after `terminate()`, and a
  pool whose workers fail to initialize no longer hangs (upstream #316, #396, #461).
- A **crashed or exited worker** now rejects its pending calls instead of leaving
  the promises hanging forever (upstream #386).

### 📚 Documentation

- Document spawning **TypeScript workers under ESM** (`"type": "module"`): threadsx
  transpiles `*.ts` workers through `tsx`/`ts-node` in a CommonJS wrapper, so they
  load without the `ERR_REQUIRE_ESM` error a bare loader hits (upstream #434).
- Explain incremental streaming from a **synchronous worker** (yield to flush) —
  inherent worker behaviour, not a bug (upstream #473).

### 🧰 Internal

- Serialization property/fuzz tests and unit tests for the new error types;
  tightened the c8 coverage gates.
- Removed the `execa` / `@types/execa` dev dependencies (tests now use Node's
  `child_process`); resolved the moderate `js-yaml` advisory; added a Dependabot
  config; documented the deliberate `callsites@^3` pin.

## v2.0.2

### 🐛 Bug fixes

- Fix `new Worker(new URL("./worker", import.meta.url))` in plain Node.js. The
  worker path resolver rebased the already-absolute URL path onto the caller's
  directory, producing a doubled path and `MODULE_NOT_FOUND`. Bundled (webpack
  etc.) builds were unaffected. Added a regression test for the plain-Node case.

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
