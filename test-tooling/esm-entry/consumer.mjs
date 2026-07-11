// Loads the *built* ESM entry via the package `exports` "import" condition
// (Node self-reference), then spawns a worker two ways to prove the real-ESM
// output runs in Node: the recommended URL form and the relative-string form
// (the latter exercises the caller-detection path that a single-file bundle
// would break).
import { spawn, Thread, Worker } from "threadsx"
import { Observable } from "threadsx/observable"
import "threadsx/register"

if (typeof Observable !== "function") throw new Error("observable entry did not load")
if (typeof globalThis.Worker !== "function") throw new Error("register entry did not run")

const urlThread = await spawn(new Worker(new URL("./worker.mjs", import.meta.url)))
const urlSum = await urlThread.add(2, 3)
await Thread.terminate(urlThread)

const strThread = await spawn(new Worker("./worker.mjs"))
const strSum = await strThread.add(4, 5)
await Thread.terminate(strThread)

console.log(JSON.stringify({ urlSum, strSum }))
