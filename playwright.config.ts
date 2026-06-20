import { defineConfig, devices } from "@playwright/test"

const port = 5610

export default defineConfig({
  testDir: "./test-browser",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`
  },
  webServer: {
    // Bundle the fixtures, then serve them. The library must already be built
    // (npm run build) so dist-esm/ and bundle/worker.js exist.
    command: "node test-browser/build.mjs && node test-browser/serve.mjs",
    url: `http://localhost:${port}/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
})
