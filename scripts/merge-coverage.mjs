/*
 * Merges the node (c8) and browser (Playwright + istanbul) coverage into one
 * report, so the browser-only source files count toward the totals.
 *
 * Inputs:
 *   coverage/coverage-final.json          — from `npm run test:coverage`
 *   coverage-browser/browser-coverage.json — from `COVERAGE=1 playwright test`
 *
 * The browser data is keyed to the instrumented bundle files and carries their
 * input source maps, which chain back to the original src/**{@literal /}*.ts files;
 * istanbul-lib-source-maps remaps it before merging. Output goes to
 * coverage-merged/ (text summary on stdout, lcov for upload) and the script
 * exits non-zero when the merged totals fall below the thresholds.
 */
import libCoverage from "istanbul-lib-coverage"
import libReport from "istanbul-lib-report"
import libSourceMaps from "istanbul-lib-source-maps"
import reports from "istanbul-reports"

const { createCoverageMap } = libCoverage
const { createSourceMapStore } = libSourceMaps
import { existsSync, readFileSync } from "node:fs"
import * as path from "node:path"

// Calibrated against the merged report, not the node-only c8 numbers: the two
// count differently (c8 converts V8 coverage, the browser side is
// istanbul-instrumented) and the merge adds browser-only files that node tests
// cannot reach fully.
const THRESHOLDS = { statements: 88, lines: 94, branches: 76, functions: 81 }

const root = process.cwd()
const srcPrefix = path.join(root, "src") + path.sep

function fail(message) {
  console.error(message)
  process.exit(1)
}

const nodeCoverageFile = path.join(root, "coverage", "coverage-final.json")
const browserCoverageFile = path.join(root, "coverage-browser", "browser-coverage.json")

if (!existsSync(nodeCoverageFile)) {
  fail(`Missing ${nodeCoverageFile} — run \`npm run test:coverage\` first.`)
}
if (!existsSync(browserCoverageFile)) {
  fail(`Missing ${browserCoverageFile} — run \`COVERAGE=1 npx playwright test\` first.`)
}

// Remap the browser bundle coverage onto the original TypeScript sources.
const browserData = JSON.parse(readFileSync(browserCoverageFile, "utf8"))
const bundleMap = createCoverageMap({})
for (const coverage of [browserData.page, ...(browserData.workers || [])].filter(Boolean)) {
  bundleMap.merge(coverage)
}
const remapped = await createSourceMapStore().transformCoverage(bundleMap)

// Keep only files under src/ (the bundles also contain fixture code and
// dependencies) and merge the node coverage on top.
const merged = createCoverageMap({})
for (const file of remapped.files()) {
  if (file.startsWith(srcPrefix)) {
    merged.addFileCoverage(remapped.fileCoverageFor(file))
  }
}
merged.merge(JSON.parse(readFileSync(nodeCoverageFile, "utf8")))

const context = libReport.createContext({
  dir: path.join(root, "coverage-merged"),
  coverageMap: merged
})
reports.create("text").execute(context)
reports.create("text-summary").execute(context)
reports.create("lcovonly", { file: "lcov.info" }).execute(context)

const summary = merged.getCoverageSummary()
const failures = Object.entries(THRESHOLDS).filter(
  ([metric, threshold]) => summary[metric].pct < threshold
)
if (failures.length > 0) {
  fail(
    failures
      .map(([metric, threshold]) => `Merged ${metric} coverage ${summary[metric].pct}% is below the ${threshold}% threshold.`)
      .join("\n")
  )
}
console.log("\nMerged coverage written to coverage-merged/ (lcov.info for upload).")
