// ESM entry for Node. Re-exports the CommonJS build (which is runtime-safe in
// both module systems); bundlers get the tree-shakeable dist-esm/ build via the
// "module" condition in package.json#exports.
export * from "./dist/index.js"
