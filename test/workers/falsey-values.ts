import { Observable } from "observable-fns"
import { expose } from "../../src/worker"

expose(function emitFalseyValues() {
  return new Observable(observer => {
    observer.next(0)
    observer.next(false)
    observer.next("")
    observer.next(null)
    observer.next(1)
    observer.complete()
  })
})
