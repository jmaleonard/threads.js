import test from "ava"
import * as path from "path"
import { run } from "../../test/lib/exec"

// Runs the *built* ESM package entry (esm/) in a real Node ESM process. Guards
// that the "import" condition serves genuine, runnable ESM (not a CJS re-export)
// and that spawning workers still resolves worker paths correctly once the tsc
// ESM output is re-emitted as `.mjs`. Requires `npm run build` to have produced
// esm/ (CI builds via the prepare hook, as the other tooling tests also rely on).
test("built ESM entry runs in Node and spawns workers", async t => {
  const consumer = path.resolve(__dirname, "consumer.mjs")
  const result = await run("node", [consumer])
  t.is(result.exitCode, 0, `consumer exited non-zero.\nStdout:\n${result.stdout}\nStderr:\n${result.stderr}`)
  t.deepEqual(JSON.parse(result.stdout), { urlSum: 5, strSum: 9 })
})
