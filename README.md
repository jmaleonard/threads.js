<h1 align="center">threadsx</h1>

<p align="center">
  <strong>Make web workers &amp; worker threads as simple as a function call.</strong>
</p>

<p align="center">
  <a href="https://github.com/jmaleonard/threadsx/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/jmaleonard/threadsx/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="Node" src="https://img.shields.io/badge/node-%E2%89%A520-3c873a">
  <img alt="Modules" src="https://img.shields.io/badge/modules-ESM%20%26%20CommonJS-f97316">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-ready-3178c6">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue">
</p>

<p align="center">
  A maintained, modernized fork of <a href="https://github.com/andywer/threads.js">threads.js</a> · <a href="https://threadsx.jmaleonard.com">threadsx.jmaleonard.com</a>
</p>

<br />

Offload CPU-intensive tasks to worker threads in node.js and web browsers using one uniform API. Uses [web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) in the browser and native [`worker_threads`](https://nodejs.org/api/worker_threads.html) in node.

### Features

* First-class support for **async functions** & **observables**
* Write code once, run it **in the browser and in node**
* Manage bulk task executions with **thread pools**
* Use **`require()`** and **`import`/`export`** in workers
* Ships **ESM and CommonJS** builds with **up-to-date TypeScript types**
* Works with modern bundlers (**webpack 5, Vite, esbuild, rollup**) out of the box

### About this fork

`threadsx` continues [andywer/threads.js](https://github.com/andywer/threads.js), which is no longer actively maintained. It modernizes the toolchain and dependencies, targets **Node.js 20+** with native `worker_threads`, drops the legacy `tiny-worker` fallback, and supports the `new Worker(new URL(…, import.meta.url))` pattern emitted by modern bundlers. The public API is unchanged.

## Installation

```
npm install threadsx
```

Requires **Node.js 20 or newer**.

## Platform support

<details>
<summary>Run on node.js</summary>

<p></p>

Running code using threadsx in node works out of the box.

Note that we wrap the native `Worker`, so `new Worker("./foo/bar")` will resolve the path relative to the module that calls it, not relative to the current working directory. That aligns it with the behavior when bundling the code.

During development you can also point a worker at a TypeScript file directly — threadsx runs it through [`tsx`](https://github.com/privatenumber/tsx) (or `ts-node`) when either is installed.

</details>

<details>
<summary>Bundlers (webpack 5, Vite, esbuild, rollup)</summary>

<p></p>

Modern bundlers detect workers from the standard URL form, so **no extra plugin is required**:

```js
import { spawn, Worker } from "threadsx"

const worker = new Worker(new URL("./workers/auth", import.meta.url))
const auth = await spawn(worker)
```

This replaces the old `threads-plugin` flow, which is no longer needed.

When using TypeScript, make sure the compiler keeps the `import` / `export` statements intact (e.g. `"module": "esnext"` on the worker entry) so the bundler can resolve `new Worker(new URL(...))`.

</details>

<details>
<summary>Making <code>Worker</code> global (Parcel and similar)</summary>

<p></p>

If your bundler only recognizes `new Worker()` when `Worker` is the global, import `threadsx/register` once at the start of your master code:

```diff
  import { spawn } from "threadsx"
+ import "threadsx/register"

  // ...

  const work = await spawn(new Worker("./worker"))
```

This registers the library's `Worker` implementation as the global `Worker`. Be aware this affects any code that instantiates a plain web worker `Worker`.

</details>

## Getting started

```js
// master.js
import { spawn, Thread, Worker } from "threadsx"

const auth = await spawn(new Worker("./workers/auth"))
const hashed = await auth.hashPassword("Super secret password", "1234")

console.log("Hashed password:", hashed)

await Thread.terminate(auth)
```

```js
// workers/auth.js
import sha256 from "js-sha256"
import { expose } from "threadsx/worker"

expose({
  hashPassword(password, salt) {
    return sha256(password + salt)
  }
})
```

### spawn()

The `hashPassword()` function of the `auth` object in the master code proxies the call to the `hashPassword()` function in the worker.

If the worker's function returns a promise or an observable then you can use the return value as such in the master code. If the function returns a primitive value, expect the master function to return a promise resolving to that value.

### expose()

Use `expose()` to make a function or an object containing methods callable from the master thread.

When exposing an object, `spawn()` asynchronously returns an object exposing all the object's functions. If you `expose()` a function, `spawn()` returns a callable function instead.

## Documentation

Find the full documentation on the [website](https://threadsx.jmaleonard.com):

- [**Quick start**](https://threadsx.jmaleonard.com/getting-started)
- [**Basic usage**](https://threadsx.jmaleonard.com/usage)
- [**Using observables**](https://threadsx.jmaleonard.com/usage-observables)
- [**Thread pools**](https://threadsx.jmaleonard.com/usage-pool)
- [**Advanced**](https://threadsx.jmaleonard.com/usage-advanced)

## Debug

We use the [`debug`](https://github.com/debug-js/debug) package to provide opt-in debug logging. All debug messages have a scope starting with `threads:`, with different sub-scopes:

- `threads:master:messages`
- `threads:master:spawn`
- `threads:master:thread-utils`
- `threads:pool:${poolName || poolID}`

Set `DEBUG=threads:*` to enable all of the library's debug logging:

```
DEBUG=threads:* npm test
```

## License

MIT — see [LICENSE](./LICENSE). Originally created by [Andy Wermke](https://github.com/andywer) as [threads.js](https://github.com/andywer/threads.js).
