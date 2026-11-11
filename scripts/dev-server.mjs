import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const port = Number(process.env.PORT || 4173);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml"
};

createServer((request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  let filePath = path.resolve(root, `.${requestPath}`);

  if (!filePath.startsWith(root) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = path.join(root, "index.html");
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(filePath).pipe(response);
}).listen(port, () => {
  console.log(`Tomorrow Desk is running at http://localhost:${port}`);
});
