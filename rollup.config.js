const commonjs = require("@rollup/plugin-commonjs")
const { nodeResolve } = require("@rollup/plugin-node-resolve")

module.exports = {
  // tsc emits `__awaiter`/`__generator` helpers that reference top-level `this`,
  // which rollup rewrites to `undefined` (harmless) but warns about loudly.
  onwarn(warning, warn) {
    if (warning.code === "THIS_IS_UNDEFINED") return
    warn(warning)
  },
  plugins: [
    nodeResolve({
      browser: true,
      mainFields: ["module", "main"],
      preferBuiltins: true
    }),

    commonjs()
  ]
};
