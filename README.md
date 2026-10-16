# Pythagoras Pathways – AI Math Differentiator

A web app that uses AI (Google Gemini) to turn one core task, the Pythagorean theorem, into three difficulty levels: Basic, Intermediate and Advanced. Each level has its own problem style, hints, solution and answer feedback.

**Live demo:** PASTE-YOUR-VERCEL-LINK-HERE

## Features
- Three level buttons (mobile-friendly)
- AI-generated problem, new every time
- Progressive hints (3 per problem), tailored to the level
- "Check my answer" with level-specific AI feedback
- Step-by-step solution on request

## How differentiation works
One shared system prompt sets the topic and rules. A separate level prompt changes the numbers (3-4-5 triples vs. decimals vs. real-world multi-step), the hint style, and the feedback tone. See `api/generate.js`.

## Project structure
- `index.html` – interface (HTML, CSS, JavaScript)
- `api/generate.js` – serverless function that holds the prompts and calls the AI
- The API key is stored as the environment variable `GEMINI_API_KEY` (never in the code).

## Run / deploy
1. Get a free key at https://aistudio.google.com/apikey
2. Import this repo in Vercel and add `GEMINI_API_KEY` under Environment Variables.
3. Deploy.

## Limitations
AI can occasionally make maths errors; answers should be verified. Free API limits may slow the app.

Author: YOUR NAME
