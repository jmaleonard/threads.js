import test from "ava"
import { spawn, Thread, Worker } from "../src/index"

test("propagates falsey values emitted by an observable worker", async t => {
  const captured: any[] = []

  const emitFalseyValues = await spawn<() => any>(new Worker("./workers/falsey-values"))
  await new Promise<void>((resolve, reject) => {
    emitFalseyValues().subscribe(value => captured.push(value), reject, resolve)
  })
  await Thread.terminate(emitFalseyValues)

  // 0, false, "" and null are falsey but must still reach the subscriber.
  t.deepEqual(captured, [0, false, "", null, 1])
})

test("can use worker returning an observable subject", async t => {
  const captured: Array<{ min: number, max: number }> = []

  const minmax = await spawn(new Worker("./workers/minmax"))
  minmax.values().subscribe(values => captured.push(values))

  await minmax.push(2)
  await minmax.push(3)
  await minmax.push(4)
  await minmax.push(1)
  await minmax.push(5)
  await minmax.finish()

  await Thread.terminate(minmax)
  t.deepEqual(captured, [
    { min: 2, max: 2 },
    { min: 2, max: 3 },
    { min: 2, max: 4 },
    { min: 1, max: 4 },
    { min: 1, max: 5 }
  ])
})
