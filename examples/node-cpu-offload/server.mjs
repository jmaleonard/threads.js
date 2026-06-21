import { createServer } from "node:http"
import { spawn, Thread, Worker } from "threadsx"

// Spawn one long-lived worker at startup and reuse it across requests.
const countPrimes = await spawn(
  new Worker(new URL("./primes.worker.mjs", import.meta.url))
)

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost")

  if (url.pathname === "/ping") {
    // Stays instant even while /primes is crunching, because the heavy work
    // runs in the worker, not on this event loop.
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (url.pathname === "/primes") {
    const limit = Number(url.searchParams.get("limit") ?? 1_000_000)
    const started = Date.now()
    const count = await countPrimes(limit)
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ limit, count, ms: Date.now() - started }))
    return
  }

  res.writeHead(404, { "content-type": "application/json" })
  res.end(JSON.stringify({ error: "not found", try: ["/primes?limit=1000000", "/ping"] }))
})

const shutdown = async () => {
  await Thread.terminate(countPrimes)
  server.close(() => process.exit(0))
}
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

const port = Number(process.env.PORT ?? 3000)
server.listen(port, () => {
  console.log(`Listening on http://localhost:${port}`)
  console.log(`  GET /primes?limit=1000000   -> counts primes in a worker`)
  console.log(`  GET /ping                   -> stays instant during heavy work`)
})
