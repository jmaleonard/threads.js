import * as WorkerThreadsModule from "worker_threads"

// `worker_threads` is a stable, always-present part of every Node.js version
// this package supports (>=20), so it is imported statically. Browser bundles
// never load this module: the package.json "browser" field maps both this
// file's importers and "worker_threads" itself to `false`.

type WorkerThreadsInterface = typeof WorkerThreadsModule

export default function getImplementation(): WorkerThreadsInterface {
  return WorkerThreadsModule
}
