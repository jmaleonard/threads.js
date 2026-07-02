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

## Merged PRs (all on `main`, squash-merged, branches deleted)

Each had a test and green CI. Mirrored fork issues auto-closed on merge.

| PR | Fixes (upstream) |
|----|------------------|
| #9  | #471 falsey observable values dropped |
| #11 | #388, #484 opt out of process.exit signal handlers (`THREADS_SKIP_SIGNAL_HANDLERS`) |
| #14 | #316, #396, #461 pool termination hangs |
| #16 | #429 public types force the DOM lib |
| #18 | #386 crashed worker never rejects pending calls |
| #20 | #473 (docs only — inherent worker behaviour, not a bug) |

## Open PRs

| PR | Branch | Fixes (upstream) |
|----|--------|------------------|
| #31 | `fix/typescript-esm-types` | #417 nameable `Pool()` return type (code); #462 declaration resolution under NodeNext (regression test); #434 TS workers under ESM (docs) |

## Issues filed on the fork

- Mirrored PR issues **#8, #10, #12, #13, #15, #17** auto-closed by the merged PRs.
- **#19** (docs mirror of #473) and **#5** (npm publishing epic) closed as resolved.
- Already fixed by the modernization — filed and **closed** for discoverability:
  #21–#30 (upstream #496, #452, #345, #387, #466, #381, #483, #422, #326, #412).
- **Open epics #1–#4** (ESM dual-package / worker-resolution / test-coverage /
  dependency-hygiene) — partly done; each has a progress comment listing the
  remaining sub-tasks.

## Suggested next steps

1. Merge #31 once CI is green.
2. Cut a `2.0.3`/`2.1.0` release — the 6 merged fixes (+ #31) are not published yet.
3. Chip away at the open epics #1–#4 (see their progress comments), e.g. the small
   wins: add a `types` condition to the `./register` export (#1), Dependabot config (#4).
4. Remaining upstream issues not yet addressed are mostly **feature requests**
   (shared memory, async generators, worker-to-worker, Deno/Bun, pin-to-worker)
   and **docs/questions** — triage as desired.
5. Growth levers still pending (human-only): submit to context7, post the
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
