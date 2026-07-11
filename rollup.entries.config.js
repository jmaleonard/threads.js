// Builds the real-ESM package output (esm/) that the "import" condition in
// package.json#exports points at. It re-emits the tsc ESM output (dist-esm/) as
// Node-loadable `.mjs` files — adding the explicit extensions Node ESM requires —
// with the runtime dependencies left external. Node ESM consumers therefore get
// genuine ESM instead of a re-export of the CommonJS build, while bundlers keep
// using the extensionless dist-esm/ tree via the "module" condition.
//
// `preserveModules` is essential (not a single-file bundle): the worker-resolution
// code detects its caller by walking the stack and skipping frames inside
// master/implementation*. Collapsing every module into one file would defeat that
// and break relative-string worker paths (`new Worker("./worker")`).
//
// The banner re-creates `require`/`__dirname`/`__filename` from `import.meta.url`,
// since the worker-resolution code reaches for them and they do not exist in an
// ESM module scope.
const path = require("path")
const { builtinModules } = require("module")

const runtimeDeps = ["callsites", "debug", "observable-fns"]

const esmShimBanner = [
  `import { createRequire as __createRequire } from "module";`,
  `import { fileURLToPath as __fileURLToPath } from "url";`,
  `import { dirname as __pathDirname } from "path";`,
  `const require = __createRequire(import.meta.url);`,
  `const __filename = __fileURLToPath(import.meta.url);`,
  `const __dirname = __pathDirname(__filename);`
].join("\n")

function isExternal(id) {
  if (id.startsWith("node:")) return true
  if (builtinModules.includes(id)) return true
  return runtimeDeps.some(dep => id === dep || id.startsWith(dep + "/"))
}

module.exports = {
  input: [
    "dist-esm/index.js",
    "dist-esm/observable.js",
    "dist-esm/worker/index.js",
    "dist-esm/master/register.js"
  ].map(entry => path.resolve(__dirname, entry)),
  external: isExternal,
  onwarn(warning, warn) {
    // tsc helpers reference top-level `this`; harmless, rewritten to undefined.
    if (warning.code === "THIS_IS_UNDEFINED") return
    warn(warning)
  },
  output: {
    dir: path.resolve(__dirname, "esm"),
    format: "es",
    preserveModules: true,
    preserveModulesRoot: path.resolve(__dirname, "dist-esm"),
    entryFileNames: "[name].mjs",
    chunkFileNames: "[name].mjs",
    banner: esmShimBanner,
    exports: "named"
  }
}
