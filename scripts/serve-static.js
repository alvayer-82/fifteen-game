import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT || 4173);
const rootDir = process.cwd();
const indexFile = join(rootDir, "index.html");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function resolvePath(rawUrl = "/") {
  const urlPath = rawUrl.split("?")[0];
  const safePath = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(rootDir, safePath === "/" ? "index.html" : safePath);

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    return filePath;
  }

  return indexFile;
}

const server = createServer((request, response) => {
  try {
    const filePath = resolvePath(request.url);
    const contentType = contentTypes[extname(filePath)] || "application/octet-stream";
    const stream = createReadStream(filePath);

    stream.on("error", () => {
      if (!response.headersSent) {
        response.writeHead(404, {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store"
        });
      }

      response.end("Not found");
    });

    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });

    stream.pipe(response);
  } catch {
    response.writeHead(500, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    });
    response.end("Internal server error");
  }
});

server.on("clientError", () => {
  // Ignore bad client sockets during browser shutdowns in tests.
});

server.listen(port, () => {
  console.log(`Static test server listening on http://127.0.0.1:${port}`);
});
