// Page-side code, bundled by build.mjs. Every tab runs this and connects to
// the SAME worker instance.
import { spawnShared, Thread } from "threadsx"

const countEl = document.getElementById("count")
const statusEl = document.getElementById("status")
const incrementBtn = document.getElementById("increment")
const connectBtn = document.getElementById("connect")
const fallbackCheckbox = document.getElementById("force-fallback")

connectBtn.addEventListener("click", async () => {
  connectBtn.disabled = true
  fallbackCheckbox.disabled = true

  const counter = await spawnShared(
    // The factory contains the literal constructor calls so bundlers can
    // detect the worker. The leader tab runs it with { shared: false } on
    // the fallback path.
    ({ shared }) => shared
      ? new SharedWorker("./counter.worker.js", { name: "shared-counter" })
      : new Worker("./counter.worker.js"),
    { name: "shared-counter", forceFallback: fallbackCheckbox.checked }
  )

  const state = await counter.getState()
  countEl.textContent = state.count
  statusEl.textContent = `Connected (worker started ${state.startedAt}, ${state.tabs} tab(s))`

  // Worker-initiated events reach every tab, keeping all UIs in sync.
  Thread.broadcasts(counter).subscribe(({ count, tabs }) => {
    countEl.textContent = count
    statusEl.textContent = `Connected (${tabs} tab(s))`
  })

  incrementBtn.disabled = false
  incrementBtn.addEventListener("click", async () => {
    await counter.increment()
  })

  // Thread.terminate(counter) would disconnect THIS tab only; the worker
  // keeps serving the other tabs.
})
