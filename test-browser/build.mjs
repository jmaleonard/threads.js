/*
 * Bundles the browser test fixtures with esbuild into test-browser/.dist/,
 * which the Playwright web server serves. Run automatically by Playwright's
 * globalSetup, or standalone via `node test-browser/build.mjs`.
 *
 * With COVERAGE=1 the bundles are built with source maps (chaining through the
 * dist-esm tsc maps back to src/**{@literal /}*.ts) and instrumented with istanbul, so
 * the Playwright run can report coverage for the browser-only code paths. The
 * coverage data carries each bundle's input source map; the merge script
 * (scripts/merge-coverage.mjs) remaps it onto the original TypeScript files.
 */
import { build } from "esbuild"
import { createInstrumenter } from "istanbul-lib-instrument"
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..")
const outdir = join(here, ".dist")
const withCoverage = process.env.COVERAGE === "1"

rmSync(outdir, { recursive: true, force: true })
mkdirSync(join(outdir, "workers"), { recursive: true })

const common = {
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  sourcemap: withCoverage,
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

// The HTML page is a static asset in both modes.
cpSync(join(here, "fixtures", "index.html"), join(outdir, "index.html"))

if (withCoverage) {
  // The BlobWorker test loads /worker.js via importScripts. The shipped bundle
  // is built by rollup without source maps, so for coverage runs an equivalent
  // bundle is built from the same entry with esbuild, which chains the tsc
  // source maps automatically. bundle-entry.js assigns the `expose` global
  // itself, so a plain IIFE works in place of the UMD wrapper here.
  await build({
    ...common,
    entryPoints: [join(root, "dist-esm", "worker", "bundle-entry.js")],
    outfile: join(outdir, "worker.js")
  })

  const instrumenter = createInstrumenter({ esModules: false, compact: true, produceSourceMap: false })
  for (const bundle of ["main.js", "workers/hello-world.js", "workers/increment.js", "worker.js"]) {
    const jsPath = join(outdir, bundle)
    const code = readFileSync(jsPath, "utf8")
    const inputSourceMap = JSON.parse(readFileSync(jsPath + ".map", "utf8"))
    writeFileSync(jsPath, instrumenter.instrumentSync(code, jsPath, inputSourceMap))
  }
  console.log(`Built and instrumented browser test fixtures to ${outdir}`)
} else {
  // Static asset: the prebuilt worker runtime bundle used by the BlobWorker
  // test (`npm run bundle` must have produced bundle/worker.js).
  cpSync(join(root, "bundle", "worker.js"), join(outdir, "worker.js"))
  console.log(`Built browser test fixtures to ${outdir}`)
}
