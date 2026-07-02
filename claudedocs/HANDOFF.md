# threadsx — handoff / status

_Last updated when development was moved to a new machine._

## What this project is

A maintained, modernized fork of threads.js, published as **`threadsx`** on npm.
Repo: `github.com/jmaleonard/threadsx` (fork of `andywer/threads.js`).
Docs site: https://threadsx.jmaleonard.com (GitHub Pages, built from `main`/`docs`).

## Environment / remotes

- `origin` → `git@github.com:andywer/threads.js.git` (upstream — do not push)
- `fork`   → `https://github.com/jmaleonard/threadsx.git` (our repo — push here)
- GitHub CLI (`gh`) is authed as `jmaleonard`.
- `NPM_TOKEN` (classic Automation token) is set as a repo secret for publishing.

## Done so far

1. **Modernized the toolchain** (Node 20+, TS 5.9, rollup 4, ava 7 + tsx, ESLint 10,
   Playwright, webpack 5), clean CJS/ESM dual-package, removed tiny-worker/tslint/puppet-run.
2. **Renamed** the package/repo/site to `threadsx`; docs rebranded; orange theme.
3. **Published** `threadsx@2.0.0`, `2.0.1` (metadata/SEO), `2.0.2` (worker-URL fix).
4. Added `llms.txt` / `llms-full.txt`, Open Graph meta + image, examples, `/examples` docs.
5. **Addressed upstream issues** (see below).

## Open PRs (need review + merge)

All branch off `main`, each with a test, each closing a mirrored fork issue.
Local branches are pushed to `fork`.

| PR | Branch | Fixes (upstream) |
|----|--------|------------------|
| #9  | `fix/471-falsey-observable-values` | #471 falsey observable values dropped |
| #11 | `fix/388-signal-handler-optout`    | #388, #484 opt out of process.exit signal handlers (`THREADS_SKIP_SIGNAL_HANDLERS`) |
| #14 | `fix/316-pool-termination`         | #316, #396, #461 pool termination hangs |
| #16 | `fix/429-dom-lib-types`            | #429 public types force the DOM lib |
| #18 | `fix/386-crashed-worker`           | #386 crashed worker never rejects pending calls |
| #20 | `docs/473-sync-worker-streaming`   | #473 (docs only — inherent worker behaviour, not a bug) |

**Merge caveat:** several PRs touch the same files (`src/master/invocation-proxy.ts`,
`src/master/pool.ts`, `src/master/implementation.node.ts`), so they will conflict
with each other. Merge them **one at a time** and resolve the small conflicts, or
rebase them into a single integration branch. Re-run `npm test` after each merge.

## Issues filed on the fork

- Mirrored (open, one per PR): #8, #10, #12, #13, #15, #17, #19.
- Already fixed by the modernization — filed and **closed** as resolved (for
  discoverability): #21–#30 (upstream #496, #452, #345, #387, #466, #381, #483,
  #422, #326, #412).

## Suggested next steps

1. Watch CI on the 6 open PRs; merge them (sequentially, per the caveat above).
2. Cut a `2.0.3`/`2.1.0` release once the fixes are merged (bump + GitHub Release).
3. Remaining upstream issues not yet addressed are mostly **feature requests**
   (shared memory, async generators, worker-to-worker, Deno/Bun, pin-to-worker)
   and **docs/questions** — triage as desired.
4. Growth levers still pending (human-only): submit to context7, post the
   Show HN / dev.to drafts, watch upstream issue `andywer/threads.js#497`.

## How to resume on this machine

```
git clone https://github.com/jmaleonard/threadsx.git
cd threadsx
# On a fresh clone `origin` = the fork (your push target). Optionally add upstream:
git remote add upstream https://github.com/andywer/threads.js.git
npm install
git fetch --all                 # pull the open PR branches
npm run build && npm test
```

Note: the previous machine used remote names `fork` (jmaleonard/threadsx, push
target) and `origin` (andywer upstream). A fresh clone will instead have `origin`
pointing at the fork. Just push to whichever remote points at
`github.com/jmaleonard/threadsx`.
