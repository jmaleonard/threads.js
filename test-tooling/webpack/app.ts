import { isWorkerRuntime, spawn, Pool, Thread, Worker } from "../../dist/index.js"

type AdditionWorker = (a: number, b: number) => number
type HelloWorker = (text: string) => string

// webpack 5 detects `new Worker(new URL("./worker", import.meta.url))` and emits
// each referenced worker as its own bundle chunk. No threads.js webpack plugin
// is required.

async function testPool() {
  const pool = Pool(() => spawn<HelloWorker>(
    new Worker(new URL("./pool-worker.ts", import.meta.url))
  ))
  const results = await Promise.all([
    pool.queue(hello => hello("World")),
    pool.queue(hello => hello("World")),
    pool.queue(hello => hello("World")),
    pool.queue(hello => hello("World"))
  ])
  await pool.terminate()

  for (const result of results) {
    if (result !== "Hello, World") {
      throw Error("Unexpected result returned by pool worker: " + result)
    }
  }
}

async function testAddition() {
  const add = await spawn<AdditionWorker>(
    new Worker(new URL("./addition-worker.ts", import.meta.url))
  )
  const result = await add(2, 3)
  await Thread.terminate(add)

  if (result !== 5) {
    throw Error("Unexpected result returned by addition worker: " + result)
  }
}

function testWorkerRuntime() {
  if (isWorkerRuntime() !== false) {
    throw Error("Expected isWorkerRuntime() to return false. Got: " + isWorkerRuntime())
  }
}

export default async function run() {
  await Promise.all([testPool(), testAddition()])
  testWorkerRuntime()
  return "test succeeded"
}
