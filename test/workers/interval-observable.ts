import { Observable } from "observable-fns"
import { expose } from "../../src/worker"

// Emits forever until the master unsubscribes, which sends a cancel message
// that must reach the worker-side subscription teardown (clearing the timer —
// a leaked interval would keep the worker's event loop busy).
expose(function ticks() {
  return new Observable<number>(observer => {
    let counter = 0
    const interval = setInterval(() => observer.next(counter++), 20)
    return () => clearInterval(interval)
  })
})
