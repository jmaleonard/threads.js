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
    --tx-ink: #1f2430;
    --tx-muted: #6b7280;
    --tx-card-bg: #ffffff;
    --tx-card-border: rgba(17, 24, 39, 0.08);
  }

  article a:not(.tx-btn) { font-weight: inherit; }

  /* Kill the theme's default section borders/rhythm so our own takes over */
  .tx-page section { border: none; }
  .tx-page h2 { border: none; }

  .tx-page {
    text-align: center;
  }

  /* ---------- Hero ---------- */
  .tx-hero {
    position: relative;
    padding: 3.5rem 1rem 3rem;
    overflow: hidden;
  }
  .tx-hero::before {
    content: "";
    position: absolute;
    top: -40%;
    left: 50%;
    width: 720px;
    height: 720px;
    max-width: 120vw;
    transform: translateX(-50%);
    background: radial-gradient(circle, rgba(255, 138, 0, 0.18) 0%, rgba(255, 94, 98, 0.10) 35%, rgba(255, 255, 255, 0) 70%);
    z-index: 0;
    pointer-events: none;
  }
  .tx-hero > * { position: relative; z-index: 1; }

  .tx-wordmark {
    font-size: clamp(3.25rem, 11vw, 6rem);
    font-weight: 800;
    letter-spacing: -0.05em;
    line-height: 1;
    margin: 0;
    background: var(--tx-grad);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
  .tx-tagline {
    font-size: clamp(1.1rem, 2.6vw, 1.5rem);
    font-weight: 500;
    color: var(--tx-ink);
    margin: 1.25rem auto 0.75rem;
    max-width: 38ch;
  }
  .tx-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.85rem;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--tx-muted);
    background: rgba(17, 24, 39, 0.04);
    border: 1px solid var(--tx-card-border);
  }
  .tx-pill a { color: var(--tx-accent); font-weight: 600; }

  .tx-badges {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    margin: 1.4rem auto 0;
  }
  .tx-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.7rem;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--tx-ink);
    background: var(--tx-card-bg);
    border: 1px solid var(--tx-card-border);
  }
  .tx-badge i { color: var(--tx-accent); }

  /* ---------- Install terminal ---------- */
  .tx-terminal {
    display: inline-flex;
    align-items: center;
    gap: 0.9rem;
    margin: 1.75rem auto 0;
    padding: 0.85rem 1.25rem;
    border-radius: 12px;
    background: #0f172a;
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.25);
    font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 1rem;
  }
  .tx-terminal .tx-dots { display: inline-flex; gap: 0.4rem; }
  .tx-terminal .tx-dots i {
    width: 11px; height: 11px; border-radius: 50%; display: inline-block;
  }
  .tx-terminal .tx-dots i:nth-child(1) { background: #ff5f56; }
  .tx-terminal .tx-dots i:nth-child(2) { background: #ffbd2e; }
  .tx-terminal .tx-dots i:nth-child(3) { background: #27c93f; }
  .tx-terminal code { color: #e2e8f0; background: none; padding: 0; }
  .tx-terminal .tx-prompt { color: #f97316; margin-right: 0.5rem; }

  /* ---------- Buttons ---------- */
  .tx-cta-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.85rem; margin-top: 2rem; }
  .tx-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.8rem 1.7rem;
    border-radius: 999px;
    font-weight: 600;
    font-size: 1rem;
    text-decoration: none !important;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  }
  .tx-btn--primary {
    background: var(--tx-grad);
    color: #fff !important;
    box-shadow: 0 10px 24px rgba(249, 115, 22, 0.35);
  }
  .tx-btn--primary:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(249, 115, 22, 0.45); }
  .tx-btn--ghost {
    color: var(--tx-ink) !important;
    border: 1px solid rgba(17, 24, 39, 0.18);
    background: var(--tx-card-bg);
  }
  .tx-btn--ghost:hover { transform: translateY(-2px); border-color: var(--tx-accent); color: var(--tx-accent) !important; }
  .tx-btn--light { background: #fff; color: #ea580c !important; box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15); }
  .tx-btn--light:hover { transform: translateY(-2px); }

  /* ---------- Sections ---------- */
  .tx-section { max-width: 1040px; margin: 0 auto; padding: 4.5rem 1.25rem; }
  .tx-eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--tx-accent);
    margin: 0;
  }
  .tx-h2 {
    font-size: clamp(1.7rem, 4vw, 2.4rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0.5rem 0 0.5rem;
  }
  .tx-sub { color: var(--tx-muted); max-width: 50ch; margin: 0 auto; font-size: 1.05rem; }

  /* ---------- Cards ---------- */
  .tx-grid {
    display: grid;
    gap: 1.25rem;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    margin-top: 2.5rem;
    text-align: left;
  }
  .tx-card {
    background: var(--tx-card-bg);
    border: 1px solid var(--tx-card-border);
    border-radius: 16px;
    padding: 1.6rem;
    box-shadow: 0 1px 2px rgba(17, 24, 39, 0.04);
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .tx-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 34px rgba(17, 24, 39, 0.10);
    border-color: rgba(249, 115, 22, 0.4);
  }
  .tx-ico {
    width: 52px; height: 52px;
    border-radius: 14px;
    display: grid; place-items: center;
    font-size: 1.4rem;
    color: var(--tx-accent);
    background: linear-gradient(135deg, rgba(255, 138, 0, 0.14), rgba(255, 94, 98, 0.14));
    margin-bottom: 1rem;
  }
  .tx-card h3 { font-size: 1.15rem; font-weight: 700; margin: 0 0 0.4rem; border: none; }
  .tx-card p { color: var(--tx-muted); margin: 0; font-size: 0.97rem; line-height: 1.55; }
  .tx-card code { font-size: 0.85em; }

  /* ---------- Code windows ---------- */
  .tx-code-grid {
    display: grid;
    gap: 1.25rem;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    margin-top: 2.5rem;
    text-align: left;
  }
  .tx-window {
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid var(--tx-card-border);
    box-shadow: 0 16px 40px rgba(17, 24, 39, 0.10);
    background: #0f172a;
  }
  .tx-window-bar {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.6rem 0.9rem;
    background: #111827;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .tx-window-bar span { width: 11px; height: 11px; border-radius: 50%; display: inline-block; }
  .tx-window-bar span:nth-child(1) { background: #ff5f56; }
  .tx-window-bar span:nth-child(2) { background: #ffbd2e; }
  .tx-window-bar span:nth-child(3) { background: #27c93f; }
  .tx-window-bar em { margin-left: 0.5rem; color: #94a3b8; font-style: normal; font-size: 0.82rem; font-family: SFMono-Regular, Consolas, monospace; }
  .tx-window figure.highlight,
  .tx-window .highlighter-rouge,
  .tx-window .highlight,
  .tx-window pre { margin: 0 !important; border-radius: 0 !important; background: #0f172a !important; }
  .tx-window pre { padding: 1.1rem 1.25rem !important; overflow-x: auto; }
  .tx-window pre code { background: none !important; color: #e2e8f0; }

  /* ---------- Final CTA ---------- */
  .tx-cta {
    max-width: 1040px;
    margin: 1rem auto 4rem;
    padding: 3.5rem 1.5rem;
    border-radius: 24px;
    background: var(--tx-grad);
    color: #fff;
    box-shadow: 0 24px 60px rgba(249, 115, 22, 0.30);
  }
  .tx-cta h2 { color: #fff; border: none; font-size: clamp(1.6rem, 4vw, 2.2rem); font-weight: 800; margin: 0 0 0.6rem; }
  .tx-cta p { color: rgba(255, 255, 255, 0.92); margin: 0 0 1.6rem; font-size: 1.05rem; }
</style>

<div class="tx-page">

<section class="tx-hero">
  <h1 class="tx-wordmark">threadsx</h1>

  <p class="tx-tagline">Make web workers &amp; worker threads as simple as a function call.</p>

  <p>
    <span class="tx-pill">
      Maintained, modernized fork of <a href="https://github.com/andywer/threads.js" rel="noopener" target="_blank">threads.js</a>
    </span>
  </p>

  <div class="tx-badges">
    <span class="tx-badge"><i class="fab fa-node-js"></i> Node 20+</span>
    <span class="tx-badge"><i class="fas fa-cubes"></i> ESM &amp; CommonJS</span>
    <span class="tx-badge"><i class="fas fa-code"></i> TypeScript</span>
    <span class="tx-badge"><i class="fas fa-scale-balanced"></i> MIT</span>
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
  <p class="tx-eyebrow">Transparent API</p>
  <h2 class="tx-h2">Write once, run everywhere</h2>
  <p class="tx-sub">Call workers transparently and await results — in web workers and node worker threads alike.</p>

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
</section>

<section class="tx-section">
  <p class="tx-eyebrow">Built for today</p>
  <h2 class="tx-h2">Modern features</h2>
  <p class="tx-sub">Designed for modern JavaScript and TypeScript code.</p>

  <div class="tx-grid">
    <div class="tx-card">
      <div class="tx-ico"><i class="fas fa-bolt"></i></div>
      <h3>Async functions &amp; observables</h3>
      <p>Built on functional paradigms and modern APIs, threadsx makes it easy to write clear, declarative code.</p>
    </div>
    <div class="tx-card">
      <div class="tx-ico"><i class="fas fa-code"></i></div>
      <h3>Statically typed</h3>
      <p>Completely written in TypeScript — a robust code base that always ships up-to-date types out of the box.</p>
    </div>
    <div class="tx-card">
      <div class="tx-ico"><i class="fas fa-cubes"></i></div>
      <h3>Bundler-native</h3>
      <p>Works out of the box with webpack 5, Vite, esbuild and rollup via <code>new Worker(new URL(…, import.meta.url))</code> — no plugin required.</p>
    </div>
  </div>
</section>

<section class="tx-section">
  <p class="tx-eyebrow">Use cases</p>
  <h2 class="tx-h2">Versatile by design</h2>
  <p class="tx-sub">Web workers and worker threads turn out to be pretty handy.</p>

  <div class="tx-grid">
    <div class="tx-card">
      <div class="tx-ico"><i class="fas fa-gauge-high"></i></div>
      <h3>Speed up CPU-bound code</h3>
      <p>Outsource calculation-intensive work to one or many workers to improve performance drastically.</p>
    </div>
    <div class="tx-card">
      <div class="tx-ico"><i class="fas fa-layer-group"></i></div>
      <h3>Thread pools</h3>
      <p>Manage bulk tasks with a pool that dispatches work to workers in a controlled, predictable way.</p>
    </div>
    <div class="tx-card">
      <div class="tx-ico"><i class="fas fa-desktop"></i></div>
      <h3>Smooth UI</h3>
      <p>Offload business logic from the main thread — where rendering happens — and keep a buttery 60 FPS.</p>
    </div>
    <div class="tx-card">
      <div class="tx-ico"><i class="fas fa-shield-halved"></i></div>
      <h3>Sandbox sensitive code</h3>
      <p>Shield security-relevant logic from the rest of the app by isolating it inside a dedicated worker.</p>
    </div>
  </div>
</section>

<section class="tx-section">
  <p class="tx-eyebrow">Runs anywhere</p>
  <h2 class="tx-h2">Supported platforms</h2>
  <p class="tx-sub">An abstraction layer over the different worker implementations.</p>

  <div class="tx-grid">
    <div class="tx-card">
      <div class="tx-ico"><i class="fab fa-node-js"></i></div>
      <h3>Node.js 20+</h3>
      <p>Using native <a href="https://nodejs.org/api/worker_threads.html" rel="nofollow noopener" target="_blank">worker threads</a>.</p>
    </div>
    <div class="tx-card">
      <div class="tx-ico"><i class="fab fa-chrome"></i></div>
      <h3>Web browsers</h3>
      <p>Using <a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API" rel="nofollow noopener" target="_blank">web workers</a> — Chrome, Firefox, Safari &amp; Edge.</p>
    </div>
    <div class="tx-card">
      <div class="tx-ico"><i class="fas fa-display"></i></div>
      <h3>Every desktop OS</h3>
      <p>Continuously tested on Linux, macOS and Windows in CI.</p>
    </div>
  </div>
</section>

<div class="tx-cta">
  <h2>Ready to parallelize?</h2>
  <p>Spin up a worker in a single line and await the result.</p>
  <a class="tx-btn tx-btn--light" href="{{ '/getting-started' | relative_url }}">
    Get started <i class="fas fa-arrow-right" style="font-size: 0.85em"></i>
  </a>
</div>

</div>
