---
layout: article
title: Quick start
permalink: /getting-started
excerpt: Get started using threadsx – Install the package, optionally set up Webpack and TypeScript.
aside:
  toc: true
---

## Quick start

This is how to spawn a simple worker managed using threadsx. The worker will hash passwords, lifting the main CPU load off the master thread.

```js
// master.js
import { spawn, Thread, Worker } from "threadsx"

async function main() {
  const auth = await spawn(new Worker("./workers/auth"))
  const hashed = await auth.hashPassword("Super secret password", "1234")

  console.log("Hashed password:", hashed)

  await Thread.terminate(auth)
}

main().catch(console.error)
```

```js
// workers/auth.js - will be run in worker thread
import sha256 from "js-sha256"
import { expose } from "threadsx/worker"

expose({
  hashPassword(password, salt) {
    return sha256(password + salt)
  }
})
```

### Moving parts

The interesting bits in the sample code above are

* `spawn()` to create a new worker
* `expose()` to declare what functionality you want your worker to expose
* `Thread.terminate()` to kill the worker once you don't need it anymore

Also note that we imported `Worker` from threadsx. This is an important detail as you would usually use the global `Worker` on the `window` in browsers or import `Worker` from `worker_threads` in node.js.

Importing the `Worker` from threadsx allows us not only to run the same code in browsers and node, but the threadsx `Worker` transparently provides additional functionality, too, to make using it as easy as possible.

Learn more about it on the [Basic usage](/usage) page.


## Installation

```
npm install threadsx
```

threadsx ships both ESM and CommonJS builds and requires **Node.js 20 or newer** (it uses native `worker_threads`).

## Platform setup

### Run using node.js

Running code using threadsx in node works out of the box.

Note that we wrap the native `Worker`, so `new Worker("./foo/bar")` will resolve the path relative to the module that calls it, not relative to the current working directory. That aligns it with the behavior when bundling the code.

During development you can even point a worker at a TypeScript file directly — threadsx runs it through [`tsx`](https://github.com/privatenumber/tsx) (or `ts-node`) when either is installed.

### Build with a bundler (webpack 5, Vite, esbuild, rollup)

Modern bundlers detect workers from the standard URL form, so **no extra plugin is required**:

```js
import { spawn, Worker } from "threadsx"

const worker = new Worker(new URL("./workers/auth", import.meta.url))
const auth = await spawn(worker)
```

webpack 5, Vite, esbuild and rollup bundle the referenced worker automatically. This replaces the old `threads-plugin` flow, which is no longer needed (and is unmaintained).

#### When using TypeScript

Make sure the TypeScript compiler keeps the `import` / `export` statements intact (for example `"module": "esnext"` on the worker entry), so the bundler can resolve `new Worker(new URL(...))`.

### Making `Worker` global (Parcel and similar)

If your bundler only recognizes `new Worker()` when `Worker` is the global, import `threadsx/register` once at the start of your master code:

```diff
  import { spawn } from "threadsx"
+ import "threadsx/register"

  // ...

  const work = await spawn(new Worker("./worker"))
```

This registers the library's `Worker` implementation for your platform as the global `Worker`. Be aware that this affects any code that instantiates a plain web worker `Worker`: the threadsx `Worker` is a web worker with some sugar on top, but that sugar might have unexpected side effects on third-party libraries.

Everything else should work out of the box.

### Electron

When building an Electron application you probably want to enable ASAR packaging – it's usually enabled by default. Your JavaScript files will then be packaged into an ASAR archive which can help reducing the executable size and time to launch.

The problem is that you can `require()` / `import` JavaScript modules from within the ASAR archive, but you cannot spawn workers packaged in the archive as easily. In order to spawn workers, you can use the [`asarUnpack`](https://www.electron.build/configuration/configuration#configuration-asarUnpack) option to unpack the archive when the app launches. `threadsx` will automatically look for the worker in the unpacked archive directory.

The following sample snippet shows how to set that option in your `package.json` file. You will have to use the right paths for your application's files.

```diff
+ "asarUnpack": {
+   "dist/main/0.bundle.worker.js",
+   "dist/main/0.bundle.worker.js.map"
+ }
```

## Next

Learn about the details and all the other features of the threadsx API, like

* Exposing more than one function
* Writing stateful workers
* Using thread pools
* Using observables to stream data
* and more…

<div class="mt-5">
  <p class="text-center">
    <a class="button button--rounded button--secondary button--lg" href="/usage">
      <i class="fas fa-arrow-right mr-2" style="font-size: 90%"></i>
      API & Usage
    </a>
  </p>
</div>
