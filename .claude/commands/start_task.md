---
name: start_task
description: Load project context, review current state, identify affected areas, and propose an approach before writing any code
argument-hint: [task description]
---

# Start Task

Before writing any code, fully load the project context and propose an approach for user approval.

## Task

$ARGUMENTS

---

## Step 1: Load Project Foundation

Read `CLAUDE.md` in the project root. This contains project-wide conventions, stack details, and constraints. If it doesn't exist, note that and continue.

## Step 2: Load Layer-Specific Rules

Check `.claude/rules/` for rule files relevant to the task. Read any that match the layers you expect to touch (e.g., `frontend.md`, `backend.md`, `design.md`, `api.md`). If the folder is empty or doesn't exist, note that and continue.

## Step 3: Review Past Lessons

Read `tasks/lessons.md` for documented mistakes, gotchas, and learnings from previous work. Pay attention to entries related to the current task type. If the file doesn't exist, note that and continue.

## Step 4: Identify Affected Modules & Load Sub-Project Context

Based on the task description:
- List which module(s) will be affected
- List which layers will be touched (UI, logic, data, API, config, tests)
- Flag any cross-module dependencies
- Read the affected sub-project's `CLAUDE.md` (e.g., `Dashboard/CLAUDE.md`) for project-specific routes, structure, and conventions. If more than one sub-project is affected, read all of them.

## Step 5: Load Current Project State

Read `docs/AI_CONTEXT.md` for the current project state — active features, known issues, architecture decisions, and work in progress. If it doesn't exist, note that and continue.

## Step 6: Check Recent History

Read `HISTORY.md` for recent changes and context that may affect this task. Look for:
- Related recent changes that could conflict
- Patterns established by recent work
- Incomplete work that this task may depend on

If the file doesn't exist, note that and continue.

## Step 7: Propose Approach

Based on everything gathered, present a clear plan:

### Context Summary
- What you learned from the project files
- Any relevant lessons or recent changes

### Affected Files
List every file that will be **created** or **modified**, in the order you'll work on them:
```
[C] path/to/new-file.ext        — reason
[M] path/to/existing-file.ext   — what changes
```

### Approach
- Step-by-step plan with rationale
- Flag any risks or trade-offs
- Note any missing context that could change the plan

### Questions
- List anything unclear that could affect the approach

## Step 8: Wait for Approval

**STOP HERE.** Do not write any code until the user explicitly approves the approach. Present the plan and wait for confirmation or adjustments.
