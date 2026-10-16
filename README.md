# BuildBuddy AI

BuildBuddy helps student builders turn a project idea into a practical roadmap. It creates milestones, task checklists, a toolkit, and risk mitigations. Builders can save progress locally and ask for a next step when they get stuck.

## Run locally

1. Install Node.js 18 or newer.
2. In this folder, run `npm run dev`.
3. Open the local address printed in the terminal (normally `http://localhost:3000`).

No package installation is needed. Without an API key, the app uses a clearly marked sample plan so the interface can still be explored.

## Enable AI planning

1. Copy `.env.example` to `.env.local`.
2. Add your API key to `OPENAI_API_KEY` in `.env.local`.
3. Set `OPENAI_MODEL` to a model enabled for your API account if needed.
4. Restart `npm run dev`.

Keep `.env.local` private. It is excluded by `.gitignore`. Never put an API key in `app.js`, `index.html`, or any other browser code. BuildBuddy sends project details to OpenAI only when an API key is configured; the project plan and progress notes are saved in the browser's local storage.

## Deploy

The app includes Vercel serverless functions in `api/`. Import this repository into Vercel, add `OPENAI_API_KEY` as an environment variable in the project settings, optionally set `OPENAI_MODEL`, then deploy. If no key is configured, users see sample output. Before sharing a live AI-enabled endpoint broadly, add an access or rate limit appropriate for your deployment so other people cannot use your API quota without permission.

## Project structure

- `index.html`, `styles.css`, `app.js` — responsive browser interface
- `api/plan.js` — project plan endpoint
- `api/coach.js` — next-step coaching endpoint
- `lib/ai.js` — prompt, sample output, and server-side API calls
- `server.js` — dependency-free local development server

The AI calls use the OpenAI Responses API. See the [text generation guide](https://developers.openai.com/api/docs/guides/text).

