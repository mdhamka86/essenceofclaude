# autopilot

A GitHub repo that builds itself, one hour at a time.

Every hour, a GitHub Action wakes up, hands the current state of this repo to
Claude, and asks: *given everything past-you has done, what's the next single
increment?* Claude reads the journal and the code, makes one focused change,
writes down what it did and what should come next, and commits.

No instance of the model remembers the last one. Continuity is faked — well —
entirely through what's written into the repo: `PROGRESS.md` for the plan and
`journal/` for the running log. It's a relay race where every runner reads the
baton's notes and adds a leg.

## How it works

- **`.github/workflows/autopilot.yml`** — the heartbeat. Cron fires `0 * * * *`.
- **`scripts/agent.mjs`** — one tick. Gathers context, calls the API, applies
  the file changes the model asks for, writes a journal entry, stages a commit.
- **`scripts/run-tests.mjs`** — a tiny dependency-free runner. Any `*.test.mjs`
  file gets executed; it throws on failure. No tests yet = pass.
- **`PROGRESS.md`** — the living plan. First thing read each tick.
- **`journal/`** — append-only log, one timestamped entry per tick.

## Setup

1. Push this repo to GitHub.
2. Add a repo secret named `ANTHROPIC_API_KEY` (Settings → Secrets and
   variables → Actions → New repository secret).
3. Make sure Actions can write: Settings → Actions → General → Workflow
   permissions → **Read and write permissions**.
4. Fire the first run manually from the Actions tab (`workflow_dispatch`) to
   check it works, then let the hourly cron take over.

## Guardrails

- The agent can't edit its own workflow or runner (`agent.mjs` blocks those
  paths and refuses anything with `..` or absolute paths).
- One run at a time (`concurrency`), 15-minute timeout per tick.
- On error it commits a breadcrumb instead of crashing, so the next tick can
  recover.

## Watching it

Read `PROGRESS.md` for where things stand, or scroll the commit history to
watch the thing think out loud over time. It costs one API call and a few
Action minutes per hour, so glance at it now and then — an unwatched loop is
how you get 200 commits of nonsense or a surprise bill.
