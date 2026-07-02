import test from "ava"
import { spawn, Pool, Worker } from "../src/index"
import { PoolEventType, QueuedTask } from "../src/master/pool"

test.serial("thread pool basics work and events are emitted", async t => {
  const events: Pool.Event[] = []
  let spawnCalled = 0
  let taskFnCalled = 0

  const spawnHelloWorld = () => {
    spawnCalled++
    return spawn<() => string>(new Worker("./workers/hello-world"))
  }
  const pool = Pool(spawnHelloWorld, 3)
  pool.events().subscribe(event => events.push(event))

  // Just to make sure all worker threads are initialized before starting to queue
  // This is only necessary for testing to make sure that this is the first event recorded
  await new Promise((resolve, reject) => {
    pool.events()
      .filter(event => event.type === PoolEventType.initialized)
      .subscribe(resolve, reject)
  })

  await pool.queue(async helloWorld => {
    taskFnCalled++
    const result = await helloWorld()
    t.is(result, "Hello World")
    return result
  })

  await pool.terminate()
  t.is(spawnCalled, 3)
  t.is(taskFnCalled, 1)

  t.deepEqual(events, [
    {
      type: Pool.EventType.initialized,
      size: 3
    },
    {
      type: Pool.EventType.taskQueued,
      taskID: 1
    },
    {
      type: Pool.EventType.taskStart,
      taskID: 1,
      workerID: 1
    },
    {
      type: Pool.EventType.taskCompleted,
      returnValue: "Hello World",
      taskID: 1,
      workerID: 1
    },
    {
      type: Pool.EventType.taskQueueDrained
    },
    {
      type: Pool.EventType.terminated,
      remainingQueue: []
    }
  ])
})

test.serial("pool.completed() works", async t => {
  const returned: any[] = []

  const spawnHelloWorld = () => spawn(new Worker("./workers/hello-world"))
  const pool = Pool(spawnHelloWorld, 2)

  for (let i = 0; i < 3; i++) {
    pool.queue(async helloWorld => {
      returned.push(await helloWorld())
    })
  }

  await pool.completed()

  t.deepEqual(returned, [
    "Hello World",
    "Hello World",
    "Hello World"
  ])

  await pool.terminate()
})

test.serial("pool.completed() proxies errors", async t => {
  const spawnHelloWorld = () => spawn(new Worker("./workers/hello-world"))
  const pool = Pool(spawnHelloWorld, 2)

  pool.queue(async () => {
    throw Error("Ooopsie")
  })

  const error = await t.throwsAsync(() => pool.completed())
  t.is(error.message, "Ooopsie")

  await pool.terminate()
})

test.serial("pool.completed(true) works", async t => {
  const spawnHelloWorld = () => spawn(new Worker("./workers/hello-world"))
  const pool = Pool(spawnHelloWorld, 2)

  await pool.completed(true)
  t.pass()

  await pool.terminate()
})

test.serial("pool.settled() does not reject on task failure", async t => {
  const returned: any[] = []

  const spawnHelloWorld = () => spawn(new Worker("./workers/hello-world"))
  const pool = Pool(spawnHelloWorld, 2)

  pool.queue(async helloWorld => {
    returned.push(await helloWorld())
  })
  pool.queue(async () => {
    throw Error("Test error one")
  })
  pool.queue(async () => {
    throw Error("Test error two")
  })

  const errors = await pool.settled()
  t.is(errors.length, 2)
  t.deepEqual(errors.map(error => error.message).sort(), [
    "Test error one",
    "Test error two"
  ])

  await pool.terminate()
})

test.serial("pool.settled(true) works", async t => {
  const spawnHelloWorld = () => spawn(new Worker("./workers/hello-world"))
  const pool = Pool(spawnHelloWorld, 2)

  await pool.settled(true)
  t.pass()

  await pool.terminate()
})

test.serial("task.cancel() works", async t => {
  const events: Pool.Event[] = []
  const spawnHelloWorld = () => spawn(new Worker("./workers/hello-world"))
  const pool = Pool(spawnHelloWorld, 1)

  pool.events().subscribe(event => events.push(event))

  let executionCount = 0
  const tasks: QueuedTask<any, any>[] = []

  for (let i = 0; i < 4; i++) {
    const task = pool.queue(helloWorld => {
      executionCount++
      return helloWorld()
    })
    tasks.push(task)
  }

  tasks[2].cancel()
  tasks[3].cancel()

  await pool.completed()
  t.is(executionCount, 2)

  const cancellationEvents = events.filter(event => event.type === "taskCanceled")
  t.deepEqual(cancellationEvents, [
    {
      type: PoolEventType.taskCanceled,
      taskID: 3
    },
    {
      type: PoolEventType.taskCanceled,
      taskID: 4
    }
  ])

  await pool.terminate()
})

test.serial("completed() resolves after terminate()", async t => {
  t.timeout(8000)
  const pool = Pool(() => spawn(new Worker("./workers/hello-world")), 1)

  // completed() is pending: with no queued tasks there is no drain event, so it
  // only settles once the pool is terminated.
  const completedPromise = pool.completed()
  await pool.terminate(true)

  // Before the fix this promise would hang forever after terminate().
  await completedPromise
  t.pass()
})

test.serial("terminate() resolves when a worker fails to initialize", async t => {
  t.timeout(8000)
  const pool = Pool(() => spawn(new Worker("./workers/slow-init"), { timeout: 300 }), 1)

  // Swallow the pool-wide init error so it is not an unhandled rejection.
  pool.events().subscribe({ error: () => undefined })

  // Before the fix terminate() would hang on the rejected worker init promise.
  await pool.terminate(true)
  t.pass()
})
