const STORAGE_KEY = "buildbuddy-project-v1";
const form = document.querySelector("#idea-form");
const ideaField = document.querySelector("#idea");
const generateButton = document.querySelector("#generate-button");
const errorBox = document.querySelector("#form-error");
const planSection = document.querySelector("#plan-section");
const planContent = document.querySelector("#plan-content");
const modeLabel = document.querySelector("#mode-label");
let project = readSavedProject();

function readSavedProject() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function saveProject() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch {
    showMessage("This browser could not save your project. You can still use this page while it stays open.");
  }
}

function showMessage(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function clearMessage() {
  errorBox.textContent = "";
  errorBox.hidden = true;
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderPlan() {
  if (!project?.plan) {
    planSection.hidden = true;
    modeLabel.textContent = "Sample mode";
    return;
  }

  planSection.hidden = false;
  modeLabel.textContent = project.demo ? "Sample mode" : "AI connected";
  planContent.replaceChildren();

  const heading = node("div", "result-heading");
  const headingCopy = node("div");
  headingCopy.append(node("p", "eyebrow", "02 / YOUR BUILD PLAN"));
  headingCopy.append(node("h2", "", project.input.idea));
  heading.append(headingCopy);

  const badge = node("span", `result-badge ${project.demo ? "is-demo" : "is-live"}`, project.demo ? "✳ Sample plan" : "✦ AI-generated");
  heading.append(badge);
  planContent.append(heading);

  const summary = node("div", "summary-card");
  summary.append(node("span", "summary-mark", "✳"));
  summary.append(node("p", "", project.plan.summary));
  planContent.append(summary);

  const overview = node("div", "overview-strip");
  [
    ["TIME", project.input.timeframe],
    ["BUDGET", project.input.budget || "Keep it low"],
    ["EXPERIENCE", project.input.skillLevel],
  ].forEach(([label, value]) => {
    const item = node("div", "overview-item");
    item.append(node("span", "overview-label", label), node("strong", "", value));
    overview.append(item);
  });
  planContent.append(overview);

  const columns = node("div", "result-columns");
  const roadmap = node("div", "roadmap-column");
  const roadmapHeader = node("div", "subsection-heading");
  roadmapHeader.append(node("div", "", "Your milestones"));
  roadmapHeader.append(node("span", "small-label", `${project.plan.milestones.length} PHASES`));
  roadmap.append(roadmapHeader);

  const tasks = [];
  project.plan.milestones.forEach((milestone, milestoneIndex) => {
    const card = node("article", "milestone-card");
    const milestoneHead = node("div", "milestone-head");
    milestoneHead.append(node("span", "milestone-number", String(milestoneIndex + 1).padStart(2, "0")));
    const copy = node("div", "milestone-copy");
    copy.append(node("h3", "", milestone.title));
    copy.append(node("p", "", milestone.description));
    milestoneHead.append(copy);
    card.append(milestoneHead);

    const taskList = node("div", "task-list");
    milestone.tasks.forEach((task, taskIndex) => {
      const taskId = `${milestoneIndex}:${taskIndex}`;
      const label = node("label", `task-row ${project.completed.includes(taskId) ? "is-done" : ""}`);
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = project.completed.includes(taskId);
      checkbox.setAttribute("aria-label", task);
      checkbox.addEventListener("change", () => {
        if (checkbox.checked && !project.completed.includes(taskId)) project.completed.push(taskId);
        if (!checkbox.checked) project.completed = project.completed.filter((item) => item !== taskId);
        label.classList.toggle("is-done", checkbox.checked);
        saveProject();
      });
      label.append(checkbox, node("span", "checkbox-visual", "✓"), node("span", "task-copy", task));
      taskList.append(label);
      tasks.push(task);
    });
    card.append(taskList);
    roadmap.append(card);
  });
  columns.append(roadmap);

  const support = node("aside", "support-column");
  const toolsCard = node("section", "support-card tools-card");
  toolsCard.append(node("p", "eyebrow", "YOUR TOOLKIT"), node("h3", "", "Start with what you have."));
  const toolsList = node("ul", "plain-list");
  project.plan.tools.forEach((tool) => toolsList.append(node("li", "", tool)));
  toolsCard.append(toolsList);
  support.append(toolsCard);

  const riskCard = node("section", "support-card risk-card");
  riskCard.append(node("p", "eyebrow", "THINGS TO WATCH"), node("h3", "", "Plan for the bumps."));
  const riskList = node("div", "risk-list");
  project.plan.risks.forEach((item) => {
    const risk = node("div", "risk-item");
    risk.append(node("strong", "", item.risk), node("p", "", item.mitigation));
    riskList.append(risk);
  });
  riskCard.append(riskList);
  support.append(riskCard);
  columns.append(support);
  planContent.append(columns);

  const progress = node("section", "progress-card");
  const progressTop = node("div", "subsection-heading");
  progressTop.append(node("div", "", "Your build log"));
  progressTop.append(node("span", "small-label", "SAVED IN THIS BROWSER"));
  progress.append(progressTop);

  const total = tasks.length;
  const done = project.completed.length;
  const progressLine = node("div", "progress-line");
  const progressTrack = node("div", "progress-track");
  const progressFill = node("span", "progress-fill");
  progressFill.style.width = `${total ? Math.min(100, (done / total) * 100) : 0}%`;
  progressTrack.append(progressFill);
  progressLine.append(progressTrack, node("span", "progress-count", `${done} / ${total} tasks`));
  progress.append(progressLine);

  const noteForm = node("form", "update-form");
  const noteLabel = node("label", "field-label", "What did you work on?");
  const noteInput = document.createElement("textarea");
  noteInput.id = "progress-note";
  noteInput.rows = 2;
  noteInput.maxLength = 500;
  noteInput.placeholder = "A quick note about what you tried, learned, or finished…";
  noteLabel.htmlFor = noteInput.id;
  noteForm.append(noteLabel, noteInput);
  const noteActions = node("div", "note-actions");
  const noteHint = node("span", "field-hint", "Your notes stay on this device.");
  const noteButton = node("button", "secondary-button", "Save update");
  noteButton.type = "submit";
  noteActions.append(noteHint, noteButton);
  noteForm.append(noteActions);
  noteForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = noteInput.value.trim();
    if (!value) return;
    project.updates.unshift({ text: value, date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }) });
    project.updates = project.updates.slice(0, 12);
    saveProject();
    renderPlan();
    document.querySelector("#progress-note")?.focus();
  });
  progress.append(noteForm);

  if (project.updates.length) {
    const updateList = node("div", "update-list");
    project.updates.forEach((entry) => {
      const update = node("article", "update-item");
      update.append(node("span", "update-date", entry.date), node("p", "", entry.text));
      updateList.append(update);
    });
    progress.append(updateList);
  }

  const coach = node("section", "coach-card");
  const coachIntro = node("div", "coach-intro");
  coachIntro.append(node("span", "coach-icon", "✦"));
  const coachCopy = node("div");
  coachCopy.append(node("p", "eyebrow", "STUCK ON SOMETHING?"), node("h3", "", "Ask Spark2Ship for a next step."));
  coachIntro.append(coachCopy);
  coach.append(coachIntro);
  const coachForm = node("form", "coach-form");
  const blocker = document.createElement("input");
  blocker.type = "text";
  blocker.maxLength = 500;
  blocker.placeholder = "What’s blocking you right now?";
  blocker.setAttribute("aria-label", "What is blocking you right now?");
  const coachButton = node("button", "primary-button coach-button", "Suggest a next step →");
  coachButton.type = "submit";
  coachForm.append(blocker, coachButton);
  const coachError = node("p", "form-error coach-error");
  coachError.hidden = true;
  coachError.setAttribute("role", "alert");
  const suggestion = node("div", "coach-answer");
  suggestion.hidden = true;
  coachForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    coachError.hidden = true;
    suggestion.hidden = true;
    if (!blocker.value.trim()) {
      coachError.textContent = "Describe what is blocking you first.";
      coachError.hidden = false;
      return;
    }
    coachButton.disabled = true;
    coachButton.textContent = "Thinking…";
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: project.input.idea,
          blocker: blocker.value.trim(),
          progress: project.updates.map((item) => item.text).join("\n"),
          nextTask: firstOpenTask(),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not get a next step.");
      suggestion.replaceChildren();
      suggestion.append(node("span", "answer-label", result.demo ? "SAMPLE SUGGESTION" : "BUILD BUDDY SUGGESTS"));
      suggestion.append(node("p", "", result.suggestion));
      suggestion.hidden = false;
      if (result.demo) modeLabel.textContent = "Sample mode";
      blocker.value = "";
    } catch (error) {
      coachError.textContent = error.message;
      coachError.hidden = false;
    } finally {
      coachButton.disabled = false;
      coachButton.textContent = "Suggest a next step →";
    }
  });
  coach.append(coachForm, coachError, suggestion);
  progress.append(coach);
  planContent.append(progress);

  requestAnimationFrame(() => planSection.scrollIntoView({ behavior: "smooth", block: "start" }));
}

function firstOpenTask() {
  for (let milestoneIndex = 0; milestoneIndex < project.plan.milestones.length; milestoneIndex += 1) {
    const tasks = project.plan.milestones[milestoneIndex].tasks;
    for (let taskIndex = 0; taskIndex < tasks.length; taskIndex += 1) {
      if (!project.completed.includes(`${milestoneIndex}:${taskIndex}`)) return tasks[taskIndex];
    }
  }
  return "Choose one improvement based on feedback";
}

ideaField.addEventListener("input", () => {
  document.querySelector("#idea-count").textContent = `${ideaField.value.length} / 700`;
});

document.querySelector("#example-button").addEventListener("click", () => {
  ideaField.value = "Build a web app that uses AI to turn a student's project idea into a realistic step-by-step plan.";
  document.querySelector("#budget").value = "Use free tools";
  document.querySelector("#timeframe").value = "Two weeks";
  document.querySelector("#skill-level").value = "Some experience";
  document.querySelector("#tools").value = "Laptop, JavaScript";
  ideaField.dispatchEvent(new Event("input"));
  ideaField.focus();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage();
  if (!ideaField.value.trim()) {
    showMessage("Add a few words about your project idea first.");
    ideaField.focus();
    return;
  }

  const payload = Object.fromEntries(new FormData(form));
  generateButton.disabled = true;
  generateButton.querySelector("span:nth-child(2)").textContent = "Making your plan…";
  generateButton.classList.add("is-loading");
  try {
    const response = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not make a plan. Please try again.");
    project = {
      id: crypto.randomUUID(),
      input: payload,
      plan: result.plan,
      demo: result.demo,
      completed: [],
      updates: [],
      createdAt: new Date().toISOString(),
    };
    saveProject();
    clearMessage();
    renderPlan();
  } catch (error) {
    showMessage(error.message || "Something went wrong. Please try again.");
  } finally {
    generateButton.disabled = false;
    generateButton.querySelector("span:nth-child(2)").textContent = "Build my plan";
    generateButton.classList.remove("is-loading");
  }
});

renderPlan();
