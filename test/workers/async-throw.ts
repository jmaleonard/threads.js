// Installs the worker-side uncaught error handlers, then throws asynchronously
// without ever calling expose(). The master must receive the uncaught error and
// reject the spawn() promise before the init timeout.
import "../../src/worker"

setTimeout(() => {
  throw Error("Async uncaught error before init")
}, 50)
