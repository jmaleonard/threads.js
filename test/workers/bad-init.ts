import { parentPort } from "worker_threads"

// Sends a malformed init message (an expose() type the master does not know)
// so tests can verify that spawn() rejects AND tears the worker down instead
// of leaking a live worker handle.
parentPort!.postMessage({ type: "init", exposed: { type: "gibberish" } })
