import { test, expect } from "@playwright/test"

declare global {
  interface Window {
    runThreadsTests(): Promise<{
      helloWorld: string
      increment: number[]
      blobWorker: number[]
    }>
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
})
