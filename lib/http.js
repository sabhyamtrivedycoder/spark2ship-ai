export async function readInput(request) {
  if (request.body && typeof request.body === "object") return request.body;

  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 16_000) {
      const error = new Error("That request is too large. Shorten the project details and try again.");
      error.statusCode = 413;
      throw error;
    }
  }

  try {
    return JSON.parse(raw || "{}");
  } catch {
    const error = new Error("The request could not be read. Please try again.");
    error.statusCode = 400;
    throw error;
  }
}

export function sendJson(response, status, payload) {
  if (typeof response.status === "function") {
    return response.status(status).json(payload);
  }

  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}
