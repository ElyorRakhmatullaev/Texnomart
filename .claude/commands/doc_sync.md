---
name: doc_sync
description: Scan the monorepo and update all documentation and context files to reflect the current state
argument-hint: [optional: "dashboard", "promo", or "all"]
---

# Doc Sync

Scan the current monorepo state and bring all documentation and context files up to date.

## Focus Area

$ARGUMENTS

If no focus area specified, sync everything.

---

## Step 1: Audit Current State

Read all existing doc/context files:
- `CLAUDE.md` (root) — monorepo overview
- `styles-config.md` (root) — unified design tokens
- `docs/AI_CONTEXT.md` — project state snapshot
- `HISTORY.md` — change history
- `tasks/lessons.md` — shared lessons & gotchas
- `Dashboard/CLAUDE.md` — Broker Dashboard-specific context
- `.claude/rules/` — all rule files

Then scan the actual project to find what has changed:
- Check for new/removed files
- Review git log for recent commits since last sync

## Step 2: Identify Gaps

Compare docs vs reality. For each file, list:
- **Stale**: info that is no longer accurate
- **Missing**: new things not yet documented
- **Correct**: info that is still accurate

## Step 3: Propose & Apply Updates

Update each file as needed. Key checks:
- Are shared UI component counts accurate?
- Are project dependencies current?
- Are design tokens in styles-config.md matching theme.css files?
- Are route/page lists up to date per sub-project?
- Are monorepo structure diagrams current?

## Step 4: Report

Output a summary of what was updated.
