/*
 * Bundling smoke-test entry. Imports the master and worker side of the built
 * threads.js package so webpack has to resolve and bundle the whole public API
 * for both the `web` and `node` targets. Runtime worker spawning (which used to
 * rely on the unmaintained threads-plugin) is covered by the Playwright and
 * rollup tests instead.
 */
import { spawn, Pool, Worker, BlobWorker, isWorkerRuntime } from "../../dist/index.js"
import { expose } from "../../dist/worker/index.js"

export default {
  spawn,
  Pool,
  Worker,
  BlobWorker,
  isWorkerRuntime,
  expose
}
