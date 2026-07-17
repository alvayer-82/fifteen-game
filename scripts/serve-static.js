import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT || 4173);
const rootDir = process.cwd();

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function resolvePath(urlPath) {
  const safePath = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(rootDir, safePath);

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    return filePath;
  }

  return join(rootDir, "index.html");
}

const server = createServer((request, response) => {
  const requestPath = request.url === "/" ? "/index.html" : request.url;
  const filePath = resolvePath(requestPath);
  const contentType = contentTypes[extname(filePath)] || "application/octet-stream";

  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });

  createReadStream(filePath).pipe(response);
});

server.listen(port, () => {
  console.log(`Static test server listening on http://127.0.0.1:${port}`);
});
