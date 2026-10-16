import { createPlan } from "../lib/ai.js";
import { readInput, sendJson } from "../lib/http.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return sendJson(response, 405, { error: "Use POST to create a project plan." });
  }

  try {
    const input = await readInput(request);
    const result = await createPlan(input);
    return sendJson(response, 200, result);
  } catch (error) {
    const status = error.statusCode || 500;
    return sendJson(response, status, { error: error.message || "Could not create a plan." });
  }
}
