# Node CPU offload

An HTTP server that offloads a CPU-bound route to a long-lived worker, so the
event loop stays responsive while the heavy work runs.

```bash
npm install threadsx
node server.mjs
```

Then, in another terminal:

```bash
# Heavy: counts primes in the worker (takes a moment)
curl "http://localhost:3000/primes?limit=2000000"

# Stays instant even while the request above is still crunching
curl "http://localhost:3000/ping"
```

The worker is spawned once at startup with
`new Worker(new URL("./primes.worker.mjs", import.meta.url))` and reused for
every request, then terminated on shutdown.
