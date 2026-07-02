import "../../src/index"
// Importing the library initializes the worker implementation, which installs
// the SIGINT/SIGTERM handlers (unless opted out).
process.stdout.write(String(process.listenerCount("SIGINT")))
