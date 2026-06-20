import { spawn, Thread, Worker } from "../../"

// Fixture bundled by the rollup tooling test to verify threads.js resolves and
// bundles with rollup. It is not executed (browser execution is covered by the
// Playwright suite), so it simply exposes a runnable entry point.
export async function run() {
  const add = await spawn(new Worker("./worker.js"))
  const result = await add(2, 3)
  await Thread.terminate(add)
  return result
}
