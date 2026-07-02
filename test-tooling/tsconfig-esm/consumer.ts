// Regression fixture for the TypeScript + ESM issue cluster.
//
// Compiled under `module`/`moduleResolution: nodenext` with declaration emit on,
// this guards against:
//   #462 — threadsx resolves its own type declarations through the package
//          `exports` map when imported from ESM (no "Could not find a declaration
//          file for module" / implicit-any).
//   #417 — the value returned by `Pool()` has a *nameable* public type, so a
//          consumer can re-export it. Declaration emit surfaces TS4023/TS4094 if
//          the private `WorkerPool` class ever leaks back into the public surface.

import { Pool, spawn, Thread, Worker } from "../../"

export const getWorkers = async () => {
  const general = Pool(() => spawn(new Worker("./worker")), { size: 2 })
  return { general }
}

// Emitting a declaration for this exported type is what triggered #417.
export type Workers = Awaited<ReturnType<typeof getWorkers>>

export async function shutdown(workers: Workers) {
  await workers.general.terminate()
}

// Also exercise a plain spawned-thread type flowing through an exported signature.
export async function makeThread() {
  return spawn(new Worker("./worker"))
}
export type SpawnedThread = Thread & Awaited<ReturnType<typeof makeThread>>
