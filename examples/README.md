# threadsx examples

Runnable, self-contained examples. Each folder has its own `README.md` with run
instructions — install threadsx (`npm install threadsx`) and run the entry file
with `node`.

| Example | What it shows |
|---------|---------------|
| [node-cpu-offload](./node-cpu-offload) | An HTTP server that offloads a CPU-bound route to a long-lived worker, keeping the event loop responsive. |
| [pool-batch](./pool-batch) | Distributing a batch of CPU-bound jobs across a pool of workers sized to the machine's cores. |

All examples use the modern, bundler-friendly worker form:

```js
new Worker(new URL("./worker.mjs", import.meta.url))
```
