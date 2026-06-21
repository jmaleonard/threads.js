import { expose } from "threadsx/worker"

// CPU-bound work to distribute across the pool.
function countPrimesUpTo(limit) {
  let count = 0
  for (let n = 2; n <= limit; n++) {
    let isPrime = true
    for (let d = 2; d * d <= n; d++) {
      if (n % d === 0) {
        isPrime = false
        break
      }
    }
    if (isPrime) count++
  }
  return count
}

expose(countPrimesUpTo)
