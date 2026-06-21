import { expose } from "threadsx/worker"

// A deliberately CPU-bound function. Running it on the main thread would block
// the HTTP server's event loop; running it in a worker keeps the server
// responsive.
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
