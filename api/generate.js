// Server-side function (runs on Vercel). The secret API key lives ONLY here, never in the browser.

const SYSTEM_PROMPT = `You are a patient, encouraging maths teacher for Grade 9 students.
Topic: the Pythagorean theorem (a^2 + b^2 = c^2) ONLY.
You adapt ONE core task (a right-triangle problem) to the learner level you are given.
Rules:
- The maths must be 100% correct. Double-check every calculation before answering.
- Use plain, friendly language. Use units where relevant.
- Never reveal the final answer inside the problem text or the hints.
- Reply with valid JSON only, no markdown.`;

const LEVELS = {
  basic: `LEVEL = BASIC (Foundation).
Create a problem with a simple Pythagorean triple such as 3-4-5, 6-8-10 or 5-12-13, with whole-number sides. Ask for the hypotenuse OR one missing leg, in a simple context (a drawn triangle or a short sentence).
Give 3 hints that get gradually more direct (the last hint may state the formula with the numbers filled in).
Give the solution as small, numbered, step-by-step lines (identify the hypotenuse, write the formula, substitute, calculate, square root).`,
  intermediate: `LEVEL = INTERMEDIATE (Standard).
Create a standard grade-level problem: find a missing side (decimals or a square root answer rounded to 1 decimal place), OR find the area or perimeter of a right triangle after finding the missing side. Do not use a famous triple.
Give 3 hints: (1) what to identify, (2) which formula to use, (3) how to rearrange it. Do not give a complete worked step in the hints.
Give a concise solution in 4-6 steps.`,
  advanced: `LEVEL = ADVANCED (Extension).
Create a real-world, multi-step problem, for example a ladder against a wall, a TV or screen diagonal, a rectangular field's diagonal path, or the shortest distance between two points. It must need at least two steps (e.g. find one side first, then use the result; or convert units; or compare two options).
Give 3 hints that only guide the strategy (draw the right triangle, decide what each side represents, plan the order of steps), never the numbers.
Give a full solution in 5-8 steps, ending with a one-sentence interpretation of the answer in the real-world context.`,
};

async function askGemini(system, user) {
  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.9, responseMimeType: "application/json" },
      }),
    }
  );
  if (!r.ok) throw new Error("AI service error " + r.status);
  const data = await r.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  const { mode = "generate", level, problem, answer, studentAnswer } = req.body || {};
  if (!LEVELS[level]) return res.status(400).json({ error: "Unknown level" });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "Server key missing" });

  try {
    if (mode === "generate") {
      const seed = Math.floor(Math.random() * 100000); // makes each problem different
      const user = `${LEVELS[level]}
Variation number: ${seed} (use it to pick different numbers/context each time).
Return JSON exactly like:
{"problem": "text", "hints": ["h1","h2","h3"], "steps": ["step 1","step 2"], "answer": "final answer with units"}`;
      return res.status(200).json(await askGemini(SYSTEM_PROMPT, user));
    }

    if (mode === "check") {
      const user = `${LEVELS[level]}
The student was given this problem: ${String(problem).slice(0, 1500)}
The correct final answer is: ${String(answer).slice(0, 200)}
The student answered: ${String(studentAnswer).slice(0, 200)}
Decide if the student is correct (accept equivalent forms and small rounding differences).
Then write feedback in 2-3 short sentences matched to the level: for Basic be very encouraging and point to the exact step to recheck; for Intermediate name the likely mistake (e.g. adding instead of subtracting for a leg); for Advanced ask a guiding question about their strategy. If wrong, do NOT reveal the correct answer.
Return JSON exactly like: {"correct": true, "feedback": "text"}`;
      return res.status(200).json(await askGemini(SYSTEM_PROMPT, user));
    }

    return res.status(400).json({ error: "Unknown mode" });
  } catch (e) {
    return res.status(502).json({ error: "The AI could not answer. Please try again." });
  }
};
