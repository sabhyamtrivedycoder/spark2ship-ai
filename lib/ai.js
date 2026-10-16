const PLAN_INSTRUCTIONS = `You are Spark2Ship, a practical project coach for students who are learning by building.
Create achievable plans that respect the student's budget, time, experience, and tools. Prefer small prototypes, explain jargon briefly, and include one concrete first action.
Return only valid JSON with this shape:
{"summary":"one short paragraph","milestones":[{"title":"...","description":"...","tasks":["...","..."]}],"tools":["..."],"risks":[{"risk":"...","mitigation":"..."}]}
Use 3 milestones, 2-4 tasks per milestone, 3-6 tools, and 2-3 risks. Avoid unsafe electrical instructions; flag supervision when a project involves mains power, heat, chemicals, or tools that can injure someone.`;

function clean(value, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeInput(input = {}) {
  const idea = clean(input.idea, 700);
  if (idea.length < 8) {
    const error = new Error("Describe your idea in at least a few words.");
    error.statusCode = 400;
    throw error;
  }

  return {
    idea,
    budget: clean(input.budget, 100) || "Keep costs low",
    timeframe: clean(input.timeframe, 100) || "A few weeks",
    skillLevel: clean(input.skillLevel, 50) || "Beginner",
    tools: clean(input.tools, 250) || "No tools specified",
  };
}

function demoPlan(input) {
  const project = input.idea.replace(/[.!?]+$/, "");
  return {
    demo: true,
    plan: {
      summary: `A starter roadmap for ${project}. This sample plan is here to help you explore the app; add an API key to generate a plan tailored by AI.`,
      milestones: [
        {
          title: "Define the smallest useful version",
          description: "Choose one problem to solve and one result you can show.",
          tasks: [
            "Write one sentence describing who this helps and how.",
            "List the three features the first version must have.",
            "Pick one simple way to demonstrate that it works.",
          ],
        },
        {
          title: "Build a working prototype",
          description: `Make a small version that fits your ${input.timeframe.toLowerCase()} timeline and available tools.`,
          tasks: [
            "Sketch the main screen or system flow.",
            "Build the core feature before adding extras.",
            "Try it with a sample input and write down what breaks.",
          ],
        },
        {
          title: "Test and share what you learned",
          description: "Get feedback, improve one rough edge, and prepare a clear demo.",
          tasks: [
            "Ask two people to try the prototype without coaching them.",
            "Fix the most confusing or unreliable part.",
            "Add a README with setup steps, screenshots, and next ideas.",
          ],
        },
      ],
      tools: input.tools === "No tools specified"
        ? ["A notebook for sketches", "A code editor", "A simple checklist"]
        : [input.tools, "A notebook for sketches", "A simple checklist"],
      risks: [
        { risk: "The first version grows too large.", mitigation: "Keep only the three must-have features in the first build." },
        { risk: "A tool or part is unavailable.", mitigation: `Check availability early and stay within: ${input.budget}.` },
      ],
    },
  };
}

async function openAiText(instructions, input) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  let response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-6-astra",
        instructions,
        input,
        max_output_tokens: 1200,
      }),
      signal: AbortSignal.timeout(25_000),
    });
  } catch {
    const error = new Error("The AI service could not be reached. Check your connection and try again.");
    error.statusCode = 502;
    throw error;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(response.status === 401
      ? "The AI key was not accepted. Check OPENAI_API_KEY in your local environment."
      : "The AI could not answer right now. Please try again in a moment.");
    error.statusCode = response.status === 401 ? 502 : 502;
    throw error;
  }

  const text = payload.output_text || payload.output
    ?.flatMap((item) => item.content || [])
    .find((item) => item.type === "output_text")?.text;

  if (!text) {
    const error = new Error("The AI returned an empty answer. Please try again.");
    error.statusCode = 502;
    throw error;
  }
  return text;
}

function parsePlan(text) {
  const source = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    const plan = JSON.parse(source);
    if (!plan.summary || !Array.isArray(plan.milestones) || !Array.isArray(plan.tools) || !Array.isArray(plan.risks)) {
      throw new Error("missing plan sections");
    }
    plan.milestones = plan.milestones.slice(0, 4).map((milestone) => ({
      title: clean(milestone.title, 100) || "Milestone",
      description: clean(milestone.description, 400),
      tasks: Array.isArray(milestone.tasks) ? milestone.tasks.slice(0, 5).map((task) => clean(task, 180)) : [],
    }));
    plan.tools = plan.tools.slice(0, 8).map((tool) => clean(tool, 120));
    plan.risks = plan.risks.slice(0, 4).map((item) => ({
      risk: clean(item.risk, 200),
      mitigation: clean(item.mitigation, 300),
    }));
    plan.summary = clean(plan.summary, 600);
    return plan;
  } catch {
    const error = new Error("The AI returned a plan in an unexpected format. Please try again.");
    error.statusCode = 502;
    throw error;
  }
}

export async function createPlan(rawInput) {
  const input = normalizeInput(rawInput);
  const text = await openAiText(PLAN_INSTRUCTIONS, JSON.stringify(input));
  if (!text) return demoPlan(input);
  return { demo: false, plan: parsePlan(text) };
}

export async function suggestNextStep(rawInput) {
  const input = {
    idea: clean(rawInput.idea, 700),
    blocker: clean(rawInput.blocker, 500),
    progress: clean(rawInput.progress, 800),
    nextTask: clean(rawInput.nextTask, 300),
  };
  if (!input.idea || !input.blocker) {
    const error = new Error("Add a short note about what is blocking you.");
    error.statusCode = 400;
    throw error;
  }

const instructions = `You are Spark2Ship, a supportive project coach for student builders. Give one practical next step, then two short alternatives. Ask a clarifying question only if essential. Keep the answer under 130 words, be specific to the project, and do not invent tools or results.`;
  const text = await openAiText(instructions, JSON.stringify(input));
  if (text) return { demo: false, suggestion: text.trim() };

  return {
    demo: true,
    suggestion: `Sample coaching: make the blocker smaller by writing down the exact step that fails. Try one low-risk experiment, note what happened, and update your task. For “${input.idea}”, your next task is: ${input.nextTask || "build one tiny proof of concept"}. Add an API key for suggestions tailored by AI.`,
  };
}
