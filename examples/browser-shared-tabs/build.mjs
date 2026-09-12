// Bundles the page and the worker with esbuild into dist/.
import { build } from "esbuild"
import { cpSync, mkdirSync, rmSync } from "node:fs"

rmSync("dist", { recursive: true, force: true })
mkdirSync("dist", { recursive: true })

const common = {
  bundle: true,
  format: "iife",
  platform: "browser",
  // The package.json "browser" field selects threadsx's browser implementations.
  mainFields: ["browser", "module", "main"]
}

await build({ ...common, entryPoints: ["main.mjs"], outfile: "dist/main.js" })
await build({ ...common, entryPoints: ["counter.worker.mjs"], outfile: "dist/counter.worker.js" })
cpSync("index.html", "dist/index.html")

console.log("Built to dist/ — run `node serve.mjs` and open http://localhost:8080 in several tabs.")
