---
layout: home
permalink: /
article_header: false
title: Web worker meets worker threads
---

<style>
  :root {
    --tx-accent: #f97316;
    --tx-accent-2: #ff5e62;
    --tx-grad: linear-gradient(135deg, #ff8a00 0%, #ff5e62 100%);
    --tx-ink: #111827;
    --tx-muted: #6b7280;
    --tx-border: rgba(17, 24, 39, 0.08);
    --tx-code-bg: #0f172a;
  }

  article a:not(.tx-btn) { font-weight: inherit; }

  /* Kill the theme's default section borders/rhythm so our own takes over */
  .tx-page section { border: none; }
  .tx-page h2, .tx-page h3 { border: none; }

  .tx-page { text-align: center; }

  /* ---------- Hero ---------- */
  .tx-hero {
    position: relative;
    padding: 4rem 1rem 2.5rem;
  }
  .tx-hero::before {
    content: "";
    position: absolute;
    top: -50%;
    left: 50%;
    width: 680px;
    height: 680px;
    max-width: 110vw;
    transform: translateX(-50%);
    background: radial-gradient(circle, rgba(255, 138, 0, 0.14) 0%, rgba(255, 94, 98, 0.07) 40%, rgba(255, 255, 255, 0) 70%);
    z-index: 0;
    pointer-events: none;
  }
  .tx-hero > * { position: relative; z-index: 1; }

  .tx-wordmark {
    font-size: clamp(2.75rem, 9vw, 4.5rem);
    font-weight: 800;
    letter-spacing: -0.045em;
    line-height: 1;
    margin: 0;
    background: var(--tx-grad);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
  .tx-tagline {
    font-size: clamp(1.15rem, 3vw, 1.6rem);
    font-weight: 600;
    letter-spacing: -0.015em;
    color: var(--tx-ink);
    margin: 1.1rem auto 0.5rem;
    max-width: 30ch;
    line-height: 1.3;
  }
  .tx-lede {
    color: var(--tx-muted);
    font-size: 1.02rem;
    max-width: 52ch;
    margin: 0.6rem auto 0;
    line-height: 1.6;
  }
  .tx-lede a { color: var(--tx-accent); font-weight: 600; }

  .tx-meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.45rem 1.1rem;
    margin: 1.3rem auto 0;
    font-size: 0.84rem;
    font-weight: 600;
    color: var(--tx-muted);
  }
  .tx-meta span { display: inline-flex; align-items: center; gap: 0.4rem; }
  .tx-meta i { color: var(--tx-accent); }

  /* ---------- Install terminal ---------- */
  .tx-terminal {
    display: inline-flex;
    align-items: center;
    gap: 0.9rem;
    margin: 1.6rem auto 0;
    padding: 0.8rem 1.2rem;
    border-radius: 12px;
    background: var(--tx-code-bg);
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.22);
    font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 1rem;
  }
  .tx-terminal .tx-dots { display: inline-flex; gap: 0.4rem; }
  .tx-terminal .tx-dots i { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .tx-terminal .tx-dots i:nth-child(1) { background: #ff5f56; }
  .tx-terminal .tx-dots i:nth-child(2) { background: #ffbd2e; }
  .tx-terminal .tx-dots i:nth-child(3) { background: #27c93f; }
  .tx-terminal code { color: #e2e8f0; background: none; padding: 0; }
  .tx-terminal .tx-prompt { color: var(--tx-accent); margin-right: 0.5rem; }

  /* ---------- Buttons ---------- */
  .tx-cta-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.8rem; margin-top: 1.8rem; }
  .tx-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.6rem;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.98rem;
    text-decoration: none !important;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }
  .tx-btn--primary {
    background: var(--tx-grad);
    color: #fff !important;
    box-shadow: 0 8px 20px rgba(249, 115, 22, 0.32);
  }
  .tx-btn--primary:hover { transform: translateY(-2px); box-shadow: 0 12px 26px rgba(249, 115, 22, 0.4); }
  .tx-btn--ghost {
    color: var(--tx-ink) !important;
    border: 1px solid rgba(17, 24, 39, 0.16);
    background: #fff;
  }
  .tx-btn--ghost:hover { transform: translateY(-2px); border-color: var(--tx-accent); color: var(--tx-accent) !important; }
  .tx-btn--light { background: #fff; color: #ea580c !important; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.14); }
  .tx-btn--light:hover { transform: translateY(-2px); }

  /* ---------- Sections ---------- */
  .tx-section { max-width: 1000px; margin: 0 auto; padding: 3.75rem 1.25rem 0; }
  .tx-h2 {
    font-size: clamp(1.55rem, 3.6vw, 2.1rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0 0 0.4rem;
  }
  .tx-sub { color: var(--tx-muted); max-width: 56ch; margin: 0 auto; font-size: 1.02rem; line-height: 1.6; }
  .tx-sub code { font-size: 0.88em; }

  /* ---------- Code windows ---------- */
  .tx-code-grid {
    display: grid;
    gap: 1.2rem;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    margin-top: 2rem;
    text-align: left;
  }
  .tx-window {
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid var(--tx-border);
    box-shadow: 0 14px 34px rgba(17, 24, 39, 0.10);
    background: var(--tx-code-bg);
  }
  .tx-window-bar {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.55rem 0.9rem;
    background: #111827;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .tx-window-bar span { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .tx-window-bar span:nth-child(1) { background: #ff5f56; }
  .tx-window-bar span:nth-child(2) { background: #ffbd2e; }
  .tx-window-bar span:nth-child(3) { background: #27c93f; }
  .tx-window-bar em { margin-left: 0.5rem; color: #94a3b8; font-style: normal; font-size: 0.8rem; font-family: SFMono-Regular, Consolas, monospace; }
  .tx-window figure.highlight,
  .tx-window .highlighter-rouge,
  .tx-window .highlight,
  .tx-window pre { margin: 0 !important; border-radius: 0 !important; background: var(--tx-code-bg) !important; }
  .tx-window pre { padding: 1.05rem 1.2rem !important; overflow-x: auto; }
  .tx-window pre code { background: none !important; color: #e2e8f0; }

  /* ---------- Feature list ---------- */
  .tx-features {
    display: grid;
    gap: 1.9rem 2.5rem;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    margin-top: 2.4rem;
    text-align: left;
  }
  .tx-feature { display: flex; gap: 0.95rem; align-items: flex-start; }
  .tx-feature i {
    flex: none;
    width: 40px; height: 40px;
    border-radius: 11px;
    display: grid; place-items: center;
    font-size: 1.05rem;
    color: var(--tx-accent);
    background: linear-gradient(135deg, rgba(255, 138, 0, 0.13), rgba(255, 94, 98, 0.13));
    margin-top: 0.15rem;
  }
  .tx-feature h3 { font-size: 1.02rem; font-weight: 700; margin: 0 0 0.25rem; }
  .tx-feature p { color: var(--tx-muted); margin: 0; font-size: 0.94rem; line-height: 1.55; }
  .tx-feature code { font-size: 0.86em; }

  /* ---------- Platform strip ---------- */
  .tx-strip {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.6rem;
    margin-top: 2.2rem;
  }
  .tx-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--tx-ink);
    background: #fff;
    border: 1px solid var(--tx-border);
  }
  .tx-chip i { color: var(--tx-accent); }

  /* ---------- Final CTA ---------- */
  .tx-cta {
    max-width: 1000px;
    margin: 4rem auto;
    padding: 3rem 1.5rem;
    border-radius: 22px;
    background: var(--tx-grad);
    color: #fff;
    box-shadow: 0 20px 50px rgba(249, 115, 22, 0.28);
  }
  .tx-cta h2 { color: #fff; border: none; font-size: clamp(1.5rem, 3.6vw, 2rem); font-weight: 800; margin: 0 0 0.5rem; }
  .tx-cta p { color: rgba(255, 255, 255, 0.92); margin: 0 0 1.5rem; font-size: 1.02rem; }
</style>

<div class="tx-page">

<section class="tx-hero">
  <h1 class="tx-wordmark">threadsx</h1>

  <p class="tx-tagline">Workers as simple as a function call.</p>

  <p class="tx-lede">
    One transparent API over web workers and Node worker threads:
    <code>spawn()</code> a worker, call its functions, await the results.
    A maintained, modernized fork of
    <a href="https://github.com/andywer/threads.js" rel="noopener" target="_blank">threads.js</a>.
  </p>

  <div class="tx-meta">
    <span><i class="fab fa-node-js"></i> Node 20+</span>
    <span><i class="fab fa-chrome"></i> All modern browsers</span>
    <span><i class="fas fa-cubes"></i> ESM &amp; CommonJS</span>
    <span><i class="fas fa-code"></i> TypeScript</span>
    <span><i class="fas fa-scale-balanced"></i> MIT</span>
  </div>

  <div class="tx-terminal">
    <span class="tx-dots"><i></i><i></i><i></i></span>
    <code><span class="tx-prompt">$</span>npm install threadsx</code>
  </div>

  <div class="tx-cta-row">
    <a class="tx-btn tx-btn--primary" href="{{ '/getting-started' | relative_url }}">
      Get started <i class="fas fa-arrow-right" style="font-size: 0.85em"></i>
    </a>
    <a class="tx-btn tx-btn--ghost" href="{{ '/usage' | relative_url }}">Documentation</a>
    <a class="tx-btn tx-btn--ghost" href="https://github.com/jmaleonard/threadsx" rel="noopener" target="_blank">
      <i class="fab fa-github"></i> GitHub
    </a>
  </div>
</section>

<section class="tx-section">
  <h2 class="tx-h2">This is the whole idea</h2>
  <p class="tx-sub">
    Expose functions from a worker, call them from the main thread like any other
    async function. Same code in the browser and in Node.
  </p>

  <div class="tx-code-grid">
    <div class="tx-window">
      <div class="tx-window-bar"><span></span><span></span><span></span><em>master.js</em></div>
{% highlight js %}
import { spawn, Thread, Worker } from "threadsx"

const auth = await spawn(new Worker("./workers/auth"))
const hashed = await auth.hashPassword("Super secret", "1234")

console.log("Hashed password:", hashed)
await Thread.terminate(auth)
{% endhighlight %}
    </div>
    <div class="tx-window">
      <div class="tx-window-bar"><span></span><span></span><span></span><em>workers/auth.js</em></div>
{% highlight js %}
import sha256 from "js-sha256"
import { expose } from "threadsx/worker"

expose({
  hashPassword(password, salt) {
    return sha256(password + salt)
  }
})
{% endhighlight %}
    </div>
  </div>

  <div class="tx-code-grid">
    <div class="tx-window">
      <div class="tx-window-bar"><span></span><span></span><span></span><em>pool.js — bulk work, bounded concurrency</em></div>
{% highlight js %}
import { Pool, spawn, Worker } from "threadsx"

const pool = Pool(() => spawn(new Worker("./workers/crunch")), 4)

for (const file of files) {
  pool.queue(crunch => crunch(file))
}
await pool.completed()
await pool.terminate()
{% endhighlight %}
    </div>
    <div class="tx-window">
      <div class="tx-window-bar"><span></span><span></span><span></span><em>stream.js — observables from workers</em></div>
{% highlight js %}
import { spawn, Worker } from "threadsx"

const counter = await spawn(new Worker("./workers/counter"))

// Worker functions can return observables:
counter.values().subscribe(count => {
  console.log("Progress:", count)
})
{% endhighlight %}
    </div>
  </div>
</section>

<section class="tx-section">
  <h2 class="tx-h2">What to expect</h2>
  <p class="tx-sub">No message-passing boilerplate, no bundler plugins, no stale types.</p>

  <div class="tx-features">
    <div class="tx-feature">
      <i class="fas fa-bolt"></i>
      <div>
        <h3>Transparent async calls</h3>
        <p>Worker functions look like local async functions. Errors reject the promise with the real error, not a cryptic event.</p>
      </div>
    </div>
    <div class="tx-feature">
      <i class="fas fa-layer-group"></i>
      <div>
        <h3>Thread pools built in</h3>
        <p><code>Pool()</code> spawns workers, queues tasks, limits concurrency, and reports events. Terminate it and every worker goes with it.</p>
      </div>
    </div>
    <div class="tx-feature">
      <i class="fas fa-tower-broadcast"></i>
      <div>
        <h3>Observables &amp; streaming</h3>
        <p>Return an observable from a worker to stream values. Subscribe on the main thread; unsubscribing cancels the job in the worker.</p>
      </div>
    </div>
    <div class="tx-feature">
      <i class="fas fa-window-restore"></i>
      <div>
        <h3>Shared workers across tabs</h3>
        <p><code>spawnShared()</code> gives every tab one worker instance — native SharedWorker where available, a BroadcastChannel fallback elsewhere — with <code>broadcast()</code> events to all tabs.</p>
      </div>
    </div>
    <div class="tx-feature">
      <i class="fas fa-right-left"></i>
      <div>
        <h3>Zero-copy transfers</h3>
        <p>Wrap ArrayBuffers in <code>Transfer()</code> to move them between threads instead of copying. Non-cloneable values fail with a clear <code>ThreadCloneError</code>.</p>
      </div>
    </div>
    <div class="tx-feature">
      <i class="fas fa-cubes"></i>
      <div>
        <h3>Bundler-native</h3>
        <p>Works out of the box with webpack 5, Vite, esbuild and rollup via <code>new Worker(new URL(…, import.meta.url))</code>. Real ESM and CommonJS builds, no plugin required.</p>
      </div>
    </div>
    <div class="tx-feature">
      <i class="fas fa-heart-pulse"></i>
      <div>
        <h3>Actively maintained</h3>
        <p>TypeScript-first with self-contained types, leak-audited worker lifecycle, and a test suite that runs on Linux, macOS, Windows and real Chromium in CI.</p>
      </div>
    </div>
  </div>

  <div class="tx-strip">
    <span class="tx-chip"><i class="fab fa-node-js"></i> worker_threads</span>
    <span class="tx-chip"><i class="fas fa-globe"></i> Web Workers</span>
    <span class="tx-chip"><i class="fas fa-box"></i> webpack 5</span>
    <span class="tx-chip"><i class="fas fa-bolt"></i> Vite</span>
    <span class="tx-chip"><i class="fas fa-cube"></i> esbuild</span>
    <span class="tx-chip"><i class="fas fa-circle-notch"></i> rollup</span>
  </div>
</section>

<div class="tx-cta">
  <h2>Ready to parallelize?</h2>
  <p>Spin up a worker in one line and await the result.</p>
  <a class="tx-btn tx-btn--light" href="{{ '/getting-started' | relative_url }}">
    Get started <i class="fas fa-arrow-right" style="font-size: 0.85em"></i>
  </a>
</div>

</div>
