/*
 * Bundles the browser test fixtures with esbuild into test-browser/.dist/,
 * which the Playwright web server serves. Run automatically by Playwright's
 * globalSetup, or standalone via `node test-browser/build.mjs`.
 */
import { build } from "esbuild"
import { cpSync, mkdirSync, rmSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..")
const outdir = join(here, ".dist")

rmSync(outdir, { recursive: true, force: true })
mkdirSync(join(outdir, "workers"), { recursive: true })

const common = {
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  // esbuild honours the package.json `browser` field, so the browser
  // implementations are selected automatically.
  mainFields: ["browser", "module", "main"]
}

await build({
  ...common,
  entryPoints: [join(here, "fixtures", "main.ts")],
  outfile: join(outdir, "main.js")
})

await build({
  ...common,
  entryPoints: {
    "workers/hello-world": join(here, "fixtures", "workers", "hello-world.ts"),
    "workers/increment": join(here, "fixtures", "workers", "increment.ts")
  },
  outdir
})

// Static assets: the HTML page and the prebuilt worker runtime bundle used by
// the BlobWorker test (`npm run bundle` must have produced bundle/worker.js).
cpSync(join(here, "fixtures", "index.html"), join(outdir, "index.html"))
cpSync(join(root, "bundle", "worker.js"), join(outdir, "worker.js"))

console.log(`Built browser test fixtures to ${outdir}`)
