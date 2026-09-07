import http from "node:http"

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" })
  res.end(JSON.stringify({ ok: true, service: "api" }))
})

server.listen(3000, "127.0.0.1", () => {
  console.log("API listening on http://127.0.0.1:3000")
})
