# threadsx — project guide for Claude

threadsx is a maintained, modernized fork of [threads.js](https://github.com/andywer/threads.js):
web workers & worker threads as simple as a function call. Published on npm as
**`threadsx`**. Docs site: https://threadsx.jmaleonard.com

## Critical conventions

- **Do NOT add a `Co-Authored-By: Claude` trailer (or any Claude attribution) to
  commit messages.** This is an explicit, standing user preference.
- Push to the remote pointing at **`github.com/jmaleonard/threadsx`**. On a fresh
  clone of the fork that is `origin`; on the previous machine it was named `fork`.
  Run `git remote -v` to check. **Never push to `andywer/threads.js`** (upstream).
- Default branch is **`main`**. Use a feature branch for all work.
- **Node.js 20+.** No `tiny-worker`; native `worker_threads` only.
- The modern worker form is `new Worker(new URL("./worker", import.meta.url))`
  (works in plain Node and all modern bundlers — no plugin).

## Layout

- `src/` — the library. `master/` (spawn, Pool, Thread, Worker, invocation proxy),
  `worker/` (expose), plus shared serialization/observables. Builds to `dist/`
  (CJS) and `dist-esm/` (ESM, bundler-only).
- `test/` — ava library tests, run through tsx. `test/workers/` are worker fixtures.
- `test-tooling/` — ava integration tests (rollup, webpack 5, minimal tsconfig).
- `test-browser/` — Playwright browser test (esbuild-bundled fixtures).
- `docs/` — Jekyll (remote TeXt theme) site → GitHub Pages from `main`/`docs`.
- `examples/` — runnable, dependency-free Node examples.

## Commands

- `npm run build` — clean + tsc (CJS) + tsc (ESM) + rollup worker bundle
- `npm run lint` — eslint (flat config in `eslint.config.mjs`)
- `npm run test:library` / `test:tooling` / `test:browser` / `test:coverage`
- `npm test` — lint + library + tooling + browser
- Note: ava runs test files as child processes (`workerThreads: false`) via `--import=tsx`.

## Publishing

- Bump: `npm version <version> --no-git-tag-version`, commit, push to `fork` main.
- Release: create a GitHub Release tagged `v<version>` → `.github/workflows/publish.yml`
  runs build + lint + tests, then `npm publish --provenance --access public`.
  The `NPM_TOKEN` repo secret is a **classic Automation** token (bypasses 2FA).

## Current state & next steps

Latest published: **threadsx@2.0.2**. See **`claudedocs/HANDOFF.md`** for the
detailed status: open PRs, mirrored/closed issues, and what to do next.
