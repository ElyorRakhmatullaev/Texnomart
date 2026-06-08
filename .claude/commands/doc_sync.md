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
- `Dashboard/CLAUDE.md` — Dashboard-specific context
- `Dashboard/docs/AI_CONTEXT.md` — Dashboard project state
- `Promo/CLAUDE.md` — Promo-specific context
- `Promo/docs/AI_CONTEXT.md` — Promo project state
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
- Are route/page lists up to date?

## Step 4: Report

Output a summary of what was updated.
