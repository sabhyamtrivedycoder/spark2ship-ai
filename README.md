# Spark2Ship AI

Spark2Ship helps student builders turn a project idea into a practical roadmap. It creates milestones, task checklists, a toolkit, and risk mitigations. Builders can save progress locally and ask for a next step when they get stuck.

**Live demo:** [sabhyamtrivedycoder.github.io/spark2ship-ai](https://sabhyamtrivedycoder.github.io/spark2ship-ai/)

## Account sign-in setup

The site includes Firebase Authentication support for email/password sign-up and sign-in, password reset, sign-out, and Google, Microsoft, Apple, and GitHub sign-in. To activate accounts on GitHub Pages:

1. Create a Firebase project and add a web app.
2. Copy the Firebase web app configuration into `firebase-config.js`. This browser config is public; do not put OAuth client secrets or private keys in the repository.
3. In Firebase Authentication, enable Email/Password and each identity provider you want to offer. Add `sabhyamtrivedycoder.github.io` to the authorized domains.
4. Add each provider's OAuth client details in Firebase Console. Microsoft and GitHub require provider app registrations; Apple sign-in requires Apple Developer Program setup.

Until that Firebase setup is complete, the sign-in controls stay disabled. Account authentication does not sync or protect planner data yet; project progress remains in the current browser, and the public planner stays available as a demo.

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

Keep `.env.local` private. It is excluded by `.gitignore`. Never put an API key in `app.js`, `index.html`, or any other browser code. Spark2Ship sends project details to OpenAI only when an API key is configured; the project plan and progress notes are saved in the browser's local storage.

## Deploy

GitHub Pages publishes the static website from this repository with the workflow in `.github/workflows/pages.yml`. It serves the project planner in demo mode with sample plans and coaching. GitHub Pages cannot run the private-key AI endpoints. The live site includes a social sharing preview card.

For tailored AI responses, deploy the serverless functions to Vercel, add `OPENAI_API_KEY` as an environment variable in the project settings, optionally set `OPENAI_MODEL`, then configure the front end to call that server. Never put an API key in browser code. Before sharing a live AI-enabled endpoint broadly, add an access or rate limit appropriate for your deployment so other people cannot use your API quota without permission.

## Project structure

- `index.html`, `styles.css`, `app.js` — responsive browser interface
- `logo.svg`, `favicon.svg` — Spark2Ship logo mark and browser icon
- `api/plan.js` — project plan endpoint
- `api/coach.js` — next-step coaching endpoint
- `lib/ai.js` — prompt, sample output, and server-side API calls
- `server.js` — dependency-free local development server

The AI calls use the OpenAI Responses API. See the [text generation guide](https://developers.openai.com/api/docs/guides/text).

