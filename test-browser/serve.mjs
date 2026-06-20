/*
 * Minimal static file server for the bundled browser test fixtures.
 * Used as the Playwright `webServer` command.
 */
import { createReadStream, existsSync, statSync } from "node:fs"
import { createServer } from "node:http"
import { dirname, extname, join, normalize } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const rootDir = join(here, ".dist")
const port = Number(process.env.PORT) || 5610

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8"
}

const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0])
  const relativePath = normalize(url === "/" ? "/index.html" : url).replace(/^(\.\.[/\\])+/, "")
  const filePath = join(rootDir, relativePath)

  if (!filePath.startsWith(rootDir) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404)
    res.end("Not found")
    return
  }

  res.writeHead(200, { "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream" })
  createReadStream(filePath).pipe(res)
})

server.listen(port, () => {
  console.log(`Serving ${rootDir} at http://localhost:${port}`)
})
