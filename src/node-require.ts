/*
 * Runtime module/path resolution for the Node.js implementation.
 *
 * Spawning a worker needs real filesystem paths at runtime, but webpack
 * rewrites `require`, `require.resolve` and `__dirname` at compile time.
 * `__non_webpack_require__` is webpack's documented escape hatch: it compiles
 * to the untouched `require` of the output bundle, so resolution happens at
 * runtime against the real filesystem. Every other environment (plain Node,
 * esbuild, rollup, Vite) keeps `createRequire` and `__dirname` intact, so no
 * `eval()` tricks are needed there.
 *
 * This module is only ever loaded on Node targets: the package.json "browser"
 * field maps its sole importers to `false` for browser bundles.
 */
import { createRequire } from "module"
import * as path from "path"

declare const __non_webpack_require__: typeof require | undefined

/** Whether this code is running inside a webpack bundle. */
export function isWebpackBundle(): boolean {
  return typeof __non_webpack_require__ === "function"
}

let nodeRequire: NodeRequire | undefined

/**
 * Returns a `require` that resolves against the real filesystem at runtime,
 * even inside a bundle.
 */
export function getNodeRequire(): NodeRequire {
  if (typeof __non_webpack_require__ === "function") {
    return __non_webpack_require__
  }
  if (!nodeRequire) {
    // CJS build: `__filename` is this module's real path. ESM build (esm/):
    // the build banner derives `__filename` from `import.meta.url`. In an
    // environment that defines neither (dist-esm bundled straight to ESM by a
    // non-webpack bundler), resolve from the current working directory.
    const base = typeof __filename !== "undefined"
      ? __filename
      : path.join(process.cwd(), "__threadsx_resolve__.js")
    nodeRequire = createRequire(base)
  }
  return nodeRequire
}

/**
 * Directory to resolve relative worker paths against when no caller path and
 * no base URL are available. Matches this module's directory where the runtime
 * provides one, and falls back to the current working directory.
 */
export function getModuleDirname(): string {
  return typeof __dirname !== "undefined" ? __dirname : process.cwd()
}
