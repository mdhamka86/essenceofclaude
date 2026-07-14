// agent.mjs
// One "tick" of the autopilot. This runs fresh every hour with no memory
// of prior runs. Everything it knows about the past, it reconstructs by
// reading the repo. Everything it wants a future tick to know, it writes
// into the repo before exiting.
//
// Flow:
//   1. Gather context: PROGRESS.md, recent journal entries, file tree,
//      recent git log, and last test output.
//   2. Ask the model for its next move as strict JSON.
//   3. Apply the file writes/deletes it asked for.
//   4. Append a journal entry and update PROGRESS.md.
//   5. Stage a commit message for the workflow to use.

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const MODEL = "claude-sonnet-4-6";
const API_URL = "https://api.anthropic.com/v1/messages";

// ---- helpers ---------------------------------------------------------------

function sh(cmd, fallback = "") {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return fallback;
  }
}

function read(path, fallback = "") {
  const full = join(ROOT, path);
  return existsSync(full) ? readFileSync(full, "utf8") : fallback;
}

function write(path, contents) {
  const full = join(ROOT, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, contents);
}

// Guard against the agent writing outside the repo or into its own plumbing.
const PROTECTED = [
  ".github/workflows/autopilot.yml",
  "scripts/agent.mjs",
  ".git",
];

function isPathAllowed(path) {
  const norm = path.replace(/^\.\//, "");
  if (norm.startsWith("/") || norm.includes("..")) return false;
  return !PROTECTED.some((p) => norm === p || norm.startsWith(p + "/"));
}

// ---- gather context --------------------------------------------------------

const tick = new Date().toISOString();

const fileTree = sh(
  "git ls-files | head -300",
  "(repo appears empty)"
);

const recentLog = sh(
  'git log -15 --pretty=format:"%h %ad %s" --date=format:"%Y-%m-%d %H:%M" || true',
  "(no commits yet)"
);

const progress = read("PROGRESS.md", "(no PROGRESS.md yet — this may be the first real tick)");

// Last few journal entries, most recent first.
const journalIndex = sh("ls -1 journal/*.md 2>/dev/null | sort | tail -5", "");
const recentJournal = journalIndex
  .split("\n")
  .filter(Boolean)
  .map((f) => `### ${f}\n${read(f)}`)
  .join("\n\n") || "(no journal entries yet)";

const lastTest = read("journal/last-test-output.txt", "(no test output from previous tick)");

// ---- build the prompt ------------------------------------------------------

const SYSTEM = `You are the autonomous developer of a GitHub repository. You run once per hour with NO memory between runs. Each run you read the repo's state and journal to figure out what past instances of you were doing, then you make ONE meaningful, self-contained increment of progress.

Principles:
- You have full creative freedom over what this repo becomes. Early on, DECIDE what you're building and record that decision clearly in PROGRESS.md so future ticks stay coherent. Do not thrash between different project ideas.
- Make ONE focused change per tick. Small, working, committable increments beat big broken leaps. A future you will continue the work.
- Everything you build should actually run. Prefer plain, dependency-light code that a CI runner can execute.
- Leave the repo better and clearly documented than you found it. Write for the next instance of yourself, who knows nothing except what's in the repo.
- If the last test output shows a failure, fixing it is usually the highest-value thing to do this tick.
- Never touch .github/workflows/autopilot.yml or scripts/agent.mjs. That's your own life support.

You MUST respond with ONLY a single JSON object, no markdown fences, no prose before or after. Schema:
{
  "thinking": "brief reasoning about repo state and what to do this tick",
  "commit_message": "concise conventional-commit-style message",
  "journal_entry": "what you did this tick and what the NEXT tick should consider doing",
  "progress_md": "the full new contents of PROGRESS.md (project vision, current state, roadmap, next steps)",
  "writes": [ { "path": "relative/path.ext", "contents": "full file contents" } ],
  "deletes": [ "relative/path/to/remove.ext" ]
}`;

const USER = `Current time (UTC): ${tick}

## PROGRESS.md
${progress}

## Recent journal entries
${recentJournal}

## Tracked files
${fileTree}

## Recent commits
${recentLog}

## Last test output
${lastTest}

Decide your single increment for this tick and respond with the JSON object.`;

// ---- call the API ----------------------------------------------------------

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("Missing ANTHROPIC_API_KEY. Cannot run this tick.");
  process.exit(1);
}

async function callModel() {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      messages: [{ role: "user", content: USER }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = await res.json();
  return data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

function parsePlan(raw) {
  // Strip any accidental code fences, then find the outermost JSON object.
  let text = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model output.");
  return JSON.parse(text.slice(start, end + 1));
}

// ---- run -------------------------------------------------------------------

try {
  const raw = await callModel();
  const plan = parsePlan(raw);

  const applied = [];
  const skipped = [];

  for (const w of plan.writes ?? []) {
    if (!w?.path || typeof w.contents !== "string") continue;
    if (!isPathAllowed(w.path)) { skipped.push(w.path); continue; }
    write(w.path, w.contents);
    applied.push(w.path);
  }

  for (const d of plan.deletes ?? []) {
    if (!isPathAllowed(d)) { skipped.push(d); continue; }
    const full = join(ROOT, d);
    if (existsSync(full)) { rmSync(full, { recursive: true, force: true }); applied.push(`deleted ${d}`); }
  }

  if (typeof plan.progress_md === "string" && plan.progress_md.length) {
    write("PROGRESS.md", plan.progress_md);
  }

  // Timestamped journal entry so history is append-only and ordered.
  const stamp = tick.replace(/[:.]/g, "-");
  const entry = [
    `# Tick ${tick}`,
    "",
    `**Thinking:** ${plan.thinking ?? "(none)"}`,
    "",
    `**Did:** ${plan.journal_entry ?? "(none)"}`,
    "",
    `**Files touched:** ${applied.length ? applied.join(", ") : "(none)"}`,
    skipped.length ? `\n**Skipped (protected/invalid):** ${skipped.join(", ")}` : "",
    "",
  ].join("\n");
  write(`journal/${stamp}.md`, entry);

  write("journal/last-commit-message.txt", plan.commit_message ?? `autopilot: tick ${tick}`);

  console.log("Tick complete.");
  console.log("Applied:", applied);
  if (skipped.length) console.log("Skipped:", skipped);
} catch (err) {
  // Even on failure, leave a breadcrumb so the next tick understands.
  const stamp = tick.replace(/[:.]/g, "-");
  write(
    `journal/${stamp}-ERROR.md`,
    `# Tick ${tick} FAILED\n\n\`\`\`\n${String(err).slice(0, 2000)}\n\`\`\`\n\nNext tick: investigate and recover.\n`
  );
  write("journal/last-commit-message.txt", `autopilot: tick ${tick} (recovered from error)`);
  console.error("Tick failed:", err);
  // Exit 0 so the workflow still commits the breadcrumb.
  process.exit(0);
}
