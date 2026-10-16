import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPlan, suggestNextStep } from "./lib/ai.js";
import { readInput } from "./lib/http.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3000;
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

async function loadLocalEnv() {
  try {
    const content = await fs.readFile(path.join(root, ".env.local"), "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || match[1] in process.env) continue;
      process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function json(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function handleApi(request, response, pathname) {
  if (request.method !== "POST") {
    return json(response, 405, { error: "Use POST for this action." });
  }
  try {
    const input = await readInput(request);
    const result = pathname === "/api/plan"
      ? await createPlan(input)
      : await suggestNextStep(input);
    return json(response, 200, result);
  } catch (error) {
    return json(response, error.statusCode || 500, { error: error.message || "Something went wrong." });
  }
}

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host || "localhost"}`).pathname;
  if (pathname === "/api/plan" || pathname === "/api/coach") {
    return handleApi(request, response, pathname);
  }

  let requestedPath;
  try {
    requestedPath = decodeURIComponent(pathname === "/" ? "/index.html" : pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }
  const filePath = path.resolve(root, `.${requestedPath}`);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const body = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    response.end(body);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500).end("Not found");
  }
});

// The local app only opts into live AI through its own ignored .env.local file.
// Do not silently reuse a machine-wide key that the project owner did not add here.
delete process.env.OPENAI_API_KEY;
await loadLocalEnv();
server.listen(port, "0.0.0.0", () => {
  console.log(`BuildBuddy AI is ready at http://localhost:${port}`);
});
