import test from "ava"
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
