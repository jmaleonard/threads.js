import test from "ava"
import * as path from "path"
import webpack, { Configuration, Stats } from "webpack"

const browserConfig = require("./webpack.web.config") as Configuration
const serverConfig = require("./webpack.node.config") as Configuration

const stringifyWebpackError = (error: any) =>
  !error
    ? ""
    : typeof error.stack === "string"
    ? error.stack
    : typeof error.message === "string"
    ? error.message
    : String(error)

async function runWebpack(config: Configuration): Promise<Stats> {
  return new Promise((resolve, reject) => {
    webpack(config).run((error, stats) => {
      if (error || !stats) {
        reject(error ?? new Error("Webpack produced no stats"))
      } else {
        resolve(stats)
      }
    })
  })
}

test("can create a browser bundle with webpack", async t => {
  const stats = await runWebpack(browserConfig)
  const errors = stats.compilation.errors
  t.deepEqual(errors, [], stringifyWebpackError(errors[0]))
})

test("can create a server bundle with webpack", async t => {
  const stats = await runWebpack(serverConfig)
  const errors = stats.compilation.errors
  t.deepEqual(errors, [], stringifyWebpackError(errors[0]))
})

test("can run a webpack-bundled worker app on the node target", async t => {
  t.timeout(120000)

  // Build an app that spawns its pool and addition workers via webpack 5's
  // native `new Worker(new URL("./worker", import.meta.url))` support, then run
  // the bundle end to end to prove the bundled workers actually execute.
  const stats = await runWebpack({
    ...serverConfig,
    entry: require.resolve("./app.ts"),
    output: {
      ...serverConfig.output,
      path: path.resolve(__dirname, "./dist/app-run.node")
    }
  })
  const errors = stats.compilation.errors
  t.deepEqual(errors, [], stringifyWebpackError(errors[0]))

  const run = require("./dist/app-run.node/main")
  const result = await run()
  t.is(result, "test succeeded")
})
