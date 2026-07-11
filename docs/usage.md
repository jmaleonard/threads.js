---
layout: article
title: Basic usage
permalink: /usage
excerpt: How to use the threadsx API.
sidebar:
  nav: sidebar
aside:
  toc: true
---

## Basics

A trivial worker example to demo the two most important functions provided by threadsx: `spawn()` and `expose()`.

```js
// master.js
import { spawn, Thread, Worker } from "threadsx"

async function main() {
  const add = await spawn(new Worker("./workers/add"))
  const sum = await add(2, 3)

  console.log(`2 + 3 = ${sum}`)

  await Thread.terminate(add)
}

main().catch(console.error)
```

```js
// workers/add.js
import { expose } from "threadsx/worker"

expose(function add(a, b) {
  return a + b
})
```

### spawn()

The return value of `add()` in the master code depends on the `add()` return value in the worker:

If the function returns a promise or an observable, then in the master code you will receive a promise or observable that proxies the one returned by the thread function.

If the function returns a primitive value, expect the master thread function to return a promise resolving to that value.

### expose()

Use `expose()` to make either a function or an object callable from the master thread.

In case of exposing an object, `spawn()` will asynchronously return an object exposing all the object's functions, following the same rules as functions directly `expose()`-ed.

## Using workers

### Function worker

This is one of two kinds of workers. A function worker exposes a single function that can be called from the master thread.

```js
// master.js
import { spawn, Thread, Worker } from "threadsx"

const fetchGithubProfile = await spawn(new Worker("./workers/fetch-github-profile"))
const andywer = await fetchGithubProfile("andywer")

console.log(`User "andywer" has signed up on ${new Date(andywer.created_at).toLocaleString()}`)

await Thread.terminate(fetchGithubProfile)
```

```js
// workers/fetch-github-profile.js
import fetch from "isomorphic-fetch"
import { expose } from "threadsx/worker"

expose(async function fetchGithubProfile(username) {
  const response = await fetch(`https://api.github.com/users/${username}`)
  return response.json()
})
```

### Module worker

This is the second kind of worker. A module worker exposes an object whose values are functions. Use it if you want your worker to expose more than one function.

```js
// master.js
import { spawn, Thread, Worker } from "threadsx"

const counter = await spawn(new Worker("./workers/counter"))
await counter.increment()
await counter.increment()
await counter.decrement()

console.log(`Counter is now at ${await counter.getCount()}`)

await Thread.terminate(counter)
```

```js
// workers/counter.js
import { expose } from "threadsx/worker"

let currentCount = 0

const counter = {
  getCount() {
    return currentCount
  },
  increment() {
    return ++currentCount
  },
  decrement() {
    return --currentCount
  }
}

expose(counter)
```

### Error handling

Works fully transparent - the promise in the master code's call will be rejected with the error thrown in the worker, also yielding the worker error's stack trace.

```js
// master.js
import { spawn, Thread, Worker } from "threadsx"

const counter = await spawn(new Worker("./workers/counter"))

try {
  await counter.increment()
  await counter.increment()
  await counter.decrement()

  console.log(`Counter is now at ${await counter.getCount()}`)
} catch (error) {
  console.error("Counter thread errored:", error)
} finally {
  await Thread.terminate(counter)
}
```

## Blob workers

Sometimes you need to ship master and worker code in a single file. There is an alternative way to create a worker for those situations, allowing you to inline the worker code in the master code.

The `BlobWorker` class works just like the regular `Worker` class, but instead of taking a path to a worker, the constructor takes the worker source code as a binary blob.

There is also a convenience function `BlobWorker.fromText()` that creates a new `BlobWorker`, but allows you to pass a source string instead of a binary buffer.

Here is a webpack-based example, leveraging the `raw-loader` to inline the worker code. The worker code that we load using the `raw-loader` is the content of bundles that have been created by two previous webpack runs: one worker build targetting node.js, one for web browsers.

```js
import { spawn, BlobWorker } from "threadsx"
import MyWorkerNode from "raw-loader!../dist/worker.node/worker.js"
import MyWorkerWeb from "raw-loader!../dist/worker.web/worker.js"

const MyWorker = process.browser ? MyWorkerWeb : MyWorkerNode

const worker = await spawn(BlobWorker.fromText(MyWorker))
// Now use this worker as always
```

Bundle this module and you will obtain a stand-alone bundle that has its worker inlined. This is particularly useful for libraries using threadsx.

## TypeScript

### Type-safe workers

When using TypeScript you can declare the type of a `spawn()`-ed worker:

```ts
// master.ts
import { spawn, Thread, Worker } from "threadsx"

type HashFunction = (input: string) => Promise<string>

const sha512 = await spawn<HashFunction>(new Worker("./workers/sha512"))
const hashed = await sha512("abcdef")
```

It's also easy to export the type from the worker module and use it when `spawn()`-ing:

```ts
// master.ts
import { spawn, Thread, Worker } from "threadsx"
import { Counter } from "./workers/counter"

const counter = await spawn<Counter>(new Worker("./workers/counter"))
console.log(`Initial counter: ${await counter.getCount()}`)

await counter.increment()
console.log(`Updated counter: ${await counter.getCount()}`)

await Thread.terminate(counter)
```

```ts
// counter.ts
import { expose } from "threadsx/worker"

let currentCount = 0

const counter = {
  getCount() {
    return currentCount
  },
  increment() {
    return ++currentCount
  },
  decrement() {
    return --currentCount
  }
}

export type Counter = typeof counter

expose(counter)
```

### TypeScript workers in node.js

You can spawn `*.ts` / `*.tsx` workers directly during development, without transpiling them first, as long as a TypeScript runtime is installed. threadsx prefers [`tsx`](https://github.com/privatenumber/tsx) and falls back to [`ts-node`](https://github.com/TypeStrong/ts-node):

```bash
npm install --save-dev tsx
```

When the path passed to `new Worker()` resolves to a `*.ts` file, threadsx wraps the worker in a small in-memory module that registers the TypeScript runtime before loading your worker code. *If you see timeouts spawning threads, increase the `THREADS_WORKER_INIT_TIMEOUT` environment variable (milliseconds, default 10000) to account for the runtime's startup time.*

If no TypeScript runtime is available, `new Worker()` falls back to loading the same file with a `*.js` extension — it is then up to you to transpile the worker module beforehand.

#### ESM projects (`"type": "module"`)

TypeScript workers work the same way in an ESM project. Point the worker at the source file — the modern `new URL(..., import.meta.url)` form is recommended so the path resolves the same in Node and in bundlers:

```ts
// master.ts (or master.mts) — package.json has "type": "module"
import { spawn, Thread, Worker } from "threadsx"
import type { API } from "./worker"

const api = await spawn<API>(new Worker(new URL("./worker.ts", import.meta.url)))
console.log(await api.greet("world"))
await Thread.terminate(api)
```

```ts
// worker.ts
import { expose } from "threadsx/worker"

const api = { greet: (name: string) => `hello, ${name}` }
export type API = typeof api

expose(api)
```

threadsx transpiles the worker through `tsx` (or `ts-node`) inside a CommonJS wrapper, so a `*.ts` worker loads correctly even when your project sets `"type": "module"` — you won't hit the `ERR_REQUIRE_ESM` error that a bare `ts-node/register` loader runs into ([#434](https://github.com/andywer/threads.js/issues/434)). Run your app with `tsx` (or `node --import tsx`) as usual.

### TypeScript workers in webpack

When building your app with webpack, the module path will automatically be replaced with the path of the worker's resulting bundle file.
