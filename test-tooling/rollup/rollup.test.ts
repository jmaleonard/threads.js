import test from "ava"
import * as path from "path"
import { rollup } from "rollup"
import config from "./rollup.config"

// Verifies that threads.js (master and worker side) can be bundled with rollup
// without resolution errors. The bundled output is exercised in a real browser
// by the Playwright suite (see test-browser/).
test("can be bundled using rollup", async t => {
  t.timeout(120000) // milliseconds

  const appBundle = await rollup({
    input: path.resolve(__dirname, "app.js"),
    ...config
  })
  const workerBundle = await rollup({
    input: path.resolve(__dirname, "worker.js"),
    ...config
  })

  const [appOutput, workerOutput] = await Promise.all([
    appBundle.generate({ format: "iife", name: "app" }),
    workerBundle.generate({ format: "iife", name: "worker" })
  ])

  t.true(appOutput.output[0].code.length > 0)
  t.true(workerOutput.output[0].code.length > 0)
})
