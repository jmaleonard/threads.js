// Tiny static server for the built example. No dependencies.
import { createReadStream, existsSync, statSync } from "node:fs"
import { createServer } from "node:http"
import { extname, join, normalize } from "node:path"

const rootDir = join(process.cwd(), "dist")
const port = Number(process.env.PORT) || 8080

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8"
}

createServer((req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0])
  const relativePath = normalize(url === "/" ? "/index.html" : url).replace(/^(\.\.[/\\])+/, "")
  const filePath = join(rootDir, relativePath)

  if (!filePath.startsWith(rootDir) || !existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404)
    res.end("Not found")
    return
  }
  res.writeHead(200, { "content-type": mimeTypes[extname(filePath)] || "application/octet-stream" })
  createReadStream(filePath).pipe(res)
}).listen(port, () => {
  console.log(`Serving on http://localhost:${port} — open it in several tabs.`)
})
