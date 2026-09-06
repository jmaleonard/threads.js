import { test, expect } from "@playwright/test"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

declare global {
  interface Window {
    runThreadsTests(): Promise<{
      helloWorld: string
      increment: number[]
      blobWorker: number[]
    }>
    collectCoverage(): { page: any, workers: any[] }
  }
}

test("threads.js runs worker threads in the browser", async ({ page }) => {
  const pageErrors: string[] = []
  page.on("pageerror", error => pageErrors.push(String(error)))

  await page.goto("/index.html")

  const results = await page.evaluate(() => window.runThreadsTests())

  expect(results.helloWorld).toBe("Hello World")
  expect(results.increment).toEqual([1, 2, 3])
  expect(results.blobWorker).toEqual([1, 2, 3])
  expect(pageErrors).toEqual([])

  // Coverage runs (COVERAGE=1): the fixtures were istanbul-instrumented by
  // build.mjs; persist the page and worker counters for the merge script.
  const coverage = await page.evaluate(() => window.collectCoverage())
  if (coverage.page || coverage.workers.length > 0) {
    const outDir = join(process.cwd(), "coverage-browser")
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, "browser-coverage.json"), JSON.stringify(coverage))
  }
})
