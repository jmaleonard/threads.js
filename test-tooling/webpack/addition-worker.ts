import { expose, isWorkerRuntime } from "../../dist/worker/index.js"

if (!isWorkerRuntime()) {
  throw Error("isWorkerRuntime() says we are not in a worker.")
}

expose(function add(a: number, b: number) {
  return a + b
})
