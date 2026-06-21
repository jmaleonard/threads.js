---
layout: article
title: Examples
permalink: /examples
excerpt: Runnable, real-world threadsx examples — CPU offloading in an HTTP server and batch processing with a thread pool.
sidebar:
  nav: sidebar
aside:
  toc: true
---

Runnable, self-contained examples live in the
[`examples/`](https://github.com/jmaleonard/threadsx/tree/main/examples) folder
of the repository. Each one installs with `npm install threadsx` and runs with
plain `node` — no bundler required — using the modern worker form
`new Worker(new URL("./worker.mjs", import.meta.url))`.

## Offload a CPU-bound route in an HTTP server

Run heavy work in a long-lived worker so the server's event loop stays
responsive. ([full example](https://github.com/jmaleonard/threadsx/tree/main/examples/node-cpu-offload))

`primes.worker.mjs`

```js
import { expose } from "threadsx/worker"

function countPrimesUpTo(limit) {
  let count = 0
  for (let n = 2; n <= limit; n++) {
    let isPrime = true
    for (let d = 2; d * d <= n; d++) {
      if (n % d === 0) { isPrime = false; break }
    }
    if (isPrime) count++
  }
  return count
}

expose(countPrimesUpTo)
```

`server.mjs`

```js
import { createServer } from "node:http"
import { spawn, Thread, Worker } from "threadsx"

const countPrimes = await spawn(
  new Worker(new URL("./primes.worker.mjs", import.meta.url))
)

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost")
  if (url.pathname === "/primes") {
    const count = await countPrimes(Number(url.searchParams.get("limit") ?? 1_000_000))
    res.end(JSON.stringify({ count }))
  } else {
    res.end(JSON.stringify({ ok: true })) // stays instant during heavy work
  }
})

server.listen(3000)
process.on("SIGINT", async () => { await Thread.terminate(countPrimes); process.exit(0) })
```

## Process a batch with a thread pool

Distribute many CPU-bound jobs across a pool of workers sized to the machine's
cores. ([full example](https://github.com/jmaleonard/threadsx/tree/main/examples/pool-batch))

```js
import { availableParallelism } from "node:os"
import { Pool, spawn, Worker } from "threadsx"

const pool = Pool(
  () => spawn(new Worker(new URL("./primes.worker.mjs", import.meta.url))),
  Math.max(1, availableParallelism() - 1)
)

for (const limit of [500_000, 1_000_000, 1_500_000, 2_000_000]) {
  pool.queue(async countPrimes => {
    console.log(limit, await countPrimes(limit))
  })
}

await pool.completed()
await pool.terminate()
```

See the [thread pools guide](./usage-pool) for the full `Pool` API.
