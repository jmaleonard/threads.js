import { availableParallelism } from "node:os"
import { Pool, spawn, Worker } from "threadsx"

// A batch of CPU-bound jobs (count primes up to each limit).
const jobs = [500_000, 750_000, 1_000_000, 1_250_000, 1_500_000, 1_750_000, 2_000_000, 2_250_000]

const size = Math.max(1, availableParallelism() - 1)
console.log(`Processing ${jobs.length} jobs across a pool of ${size} workers...\n`)

const pool = Pool(
  () => spawn(new Worker(new URL("./primes.worker.mjs", import.meta.url))),
  size
)

const started = Date.now()
const results = []

for (const limit of jobs) {
  // queue() returns immediately; the pool runs jobs as workers free up.
  pool.queue(async countPrimes => {
    const count = await countPrimes(limit)
    results.push({ limit, count })
    console.log(`  primes <= ${limit.toLocaleString()}: ${count.toLocaleString()}`)
  })
}

// Resolves once every queued job has finished.
await pool.completed()
await pool.terminate()

console.log(`\nDone: ${results.length} jobs in ${Date.now() - started}ms`)
