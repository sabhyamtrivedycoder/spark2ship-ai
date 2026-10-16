import { suggestNextStep } from "../lib/ai.js";
import { readInput, sendJson } from "../lib/http.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return sendJson(response, 405, { error: "Use POST to ask for a next step." });
  }

  try {
    const input = await readInput(request);
    const suggestion = await suggestNextStep(input);
    return sendJson(response, 200, suggestion);
  } catch (error) {
    const status = error.statusCode || 500;
    return sendJson(response, status, { error: error.message || "Could not find a next step." });
  }
}
