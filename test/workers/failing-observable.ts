import { Observable } from "observable-fns"
import { expose } from "../../src/worker"

expose(function failingObservable() {
  return new Observable(observer => {
    observer.next(1)
    observer.error(Error("Observable failed"))
  })
})
