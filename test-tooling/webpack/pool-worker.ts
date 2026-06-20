import { expose } from "../../dist/worker/index.js"

expose(function hello(text: string) {
  return `Hello, ${text}`
})
