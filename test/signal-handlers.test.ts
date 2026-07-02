import test from "ava"
import execa from "execa"
import { fileURLToPath } from "url"

const probe = fileURLToPath(new URL("./fixtures/signal-handlers-probe.ts", import.meta.url))

async function sigintListenerCount(env: Record<string, string>): Promise<number> {
  const { stdout } = await execa("node", ["--import", "tsx", probe], {
    env: { ...process.env, ...env }
  })
  return Number(stdout.trim())
}

test("installs a SIGINT handler by default", async t => {
  t.true(await sigintListenerCount({}) >= 1)
})

test("THREADS_SKIP_SIGNAL_HANDLERS opts out of the signal handlers", async t => {
  t.is(await sigintListenerCount({ THREADS_SKIP_SIGNAL_HANDLERS: "1" }), 0)
})
