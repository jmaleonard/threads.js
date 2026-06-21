# Thread pool batch

Distributes a batch of CPU-bound jobs across a pool of workers sized to the
machine's available cores, so the work runs in parallel.

```bash
npm install threadsx
node index.mjs
```

`Pool(spawnFn, size)` keeps `size` workers alive; `pool.queue(fn)` hands each job
to the next free worker, and `pool.completed()` resolves once the whole batch is
done. Compared to running the jobs one-by-one on the main thread, throughput
scales with the number of cores.
