// Installs the worker-side handlers, then leaves a promise rejection unhandled
// without ever calling expose(). The master must receive the uncaught error and
// reject the spawn() promise before the init timeout.
import "../../src/worker"

Promise.reject(Error("Unhandled rejection in worker"))
