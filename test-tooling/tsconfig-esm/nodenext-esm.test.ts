import test from "ava"
import { run } from "../../test/lib/exec"

// Type-checks a consumer that imports threadsx under NodeNext ESM resolution and
// emits declarations. Guards the TypeScript + ESM issue cluster: #462 (type
// declarations resolve through the `exports` map) and #417 (the `Pool()` return
// type is nameable, so consumers can re-export it without leaking a private class).
test("consumer compiles under NodeNext ESM with declaration emit", async t => {
  const result = await run("tsc", ["--project", require.resolve("./tsconfig.json")])
  t.is(
    result.exitCode,
    0,
    `tsc exited with non-zero exit code.\nStdout:\n${result.stdout}\nStderr:\n${result.stderr}`
  )
})
