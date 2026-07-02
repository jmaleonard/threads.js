// Self-references the package by name so it resolves through package.json#exports
// ("threadsx/worker" -> the built ESM worker entry).
import { expose } from "threadsx/worker"

expose({
  add: (a, b) => a + b
})
