---
name: ux-designer
description: Expert UX analysis using ux-designer agent — gathers Figma design data via MCP, then delegates comprehensive evaluation to a specialized UX designer subagent
argument-hint: [figma-url-1] [figma-url-2] ...
allowed-tools: mcp__figma__get_design_context mcp__figma__get_screenshot mcp__figma__get_metadata WebSearch
---

# UX Designer Analysis

Perform a comprehensive UX analysis of Figma design(s) using a two-phase approach: **you** gather design data via Figma MCP tools, then delegate the expert analysis to a **ux-designer** subagent.

## Input

Figma URLs to analyze:
$ARGUMENTS

---

## Phase 1: Data Gathering (you do this — you have MCP tools)

### Step 1.1: Parse URLs

For each Figma URL, extract identifiers:
- `figma.com/design/:fileKey/:fileName?node-id=:nodeId` — convert `-` to `:` in nodeId
- `figma.com/design/:fileKey/branch/:branchKey/:fileName` — use branchKey as fileKey
- `figma.com/make/:makeFileKey/:makeFileName` — use makeFileKey
- `figma.com/board/:fileKey/:fileName` — FigJam file, use `get_figjam`

### Step 1.2: Collect Design Data

For each URL, call these tools **in parallel**:
- `mcp__figma__get_screenshot` — visual overview
- `mcp__figma__get_design_context` — code output, tokens, component instances, annotations
- `mcp__figma__get_metadata` — node tree, layer structure, dimensions

### Step 1.3: Extract Design System

From the design context output, compile:
- Font families, weight scale, size scale
- Color tokens (CSS variables or raw hex values)
- Spacing scale, border-radius values
- Icon set and component library names
- Design annotations or documentation links

### Step 1.4: Save Raw Data

1. Derive `{project_name}` from the Figma file name (lowercase, spaces → hyphens)
2. Create folder: `results/{project_name}/`
3. Write `results/{project_name}/raw-design-data.md` with this structure:

```markdown
# {Project Name} — Raw Design Data

## Design System
### Colors
[list all color tokens / hex values found]
### Typography
[font families, sizes, weights]
### Spacing & Radius
[spacing scale, border-radius values]
### Icons & Components
[icon set name, component library, key component list]

## Screens Analyzed
### Screen: {name} (node: {nodeId})
- **Screenshot**: [description of what's visible]
- **Components used**: [list of component instances]
- **Node structure**: [key layers and their dimensions]
- **Annotations**: [any designer notes found]
- **Visible issues**: [placeholder bugs, missing elements, broken instances]
```

---

## Phase 2: Delegate to UX Designer Agent

Spawn an `Agent` with `subagent_type: "ux-designer"`.

**IMPORTANT**: The ux-designer agent only has `Write, Read, MultiEdit` — no MCP tools. You MUST paste all raw design data directly into the agent prompt. Do not tell it to read a file — include everything inline.

**Agent prompt template** (fill in the `{...}` sections with actual data from Phase 1):

---

**BEGIN AGENT PROMPT:**

You are performing a comprehensive UX audit. Below is all the design data gathered from Figma.

## Project: {project_name}

## Design System
{paste full design system section from raw-design-data.md}

## Screens
{paste full screens section from raw-design-data.md — all screenshots descriptions, components, nodes, annotations, issues}

---

## Your Task

Analyze this design across 10 UX categories. Score each **X/10** with justification.

### 1. Usability & Task Flow
- Can users complete primary tasks with minimal steps?
- Are flows linear and logical, or require backtracking?
- Are there dead ends?

### 2. Visual Hierarchy & Layout
- Does layout guide the eye to the most important elements?
- Clear distinction between primary, secondary, tertiary content?
- Consistent spacing and alignment?

### 3. Navigation & Information Architecture
- Is there a global navigation pattern (tab bar, drawer, etc.)?
- Can users orient themselves — where they are, how to go back?
- Are related features grouped logically?

### 4. Interaction Feedback & State Coverage
Check that EVERY interactive screen has designs for:
- **Empty state** (no data yet)
- **Loading state** (skeleton or spinner)
- **Error state** (network failure, validation error)
- **Success state** (confirmation after action)
- **Partial state** (some data loaded, some pending)
Flag any missing states as P0 issues.

### 5. Consistency
- Are similar elements styled identically across screens?
- Do buttons, cards, inputs, badges follow a single pattern?
- Typography consistent (font family, weight, size)?
- Icons from one set or mixed?

### 6. Accessibility (WCAG 2.1)
- **Color contrast**: text/background pairs against WCAG AA (4.5:1 normal, 3:1 large). Report ratios + fix hex values.
- **Tap targets**: minimum 44x44px for mobile. Report actual sizes.
- **Font sizes**: minimum 14px body, 12px only for supplementary labels.
- **Screen reader**: do icons/status indicators have text alternatives?
- **Focus management**: keyboard/switch navigation considered?

### 7. Error Handling & Recovery
- Error messages specific and helpful?
- Can users recover without losing progress?
- Password recovery, retry, undo, fallback mechanisms?
- Destructive actions confirmed?

### 8. Responsiveness & Edge Cases
- Long text, truncation, overflow handling?
- Layouts resilient to dynamic content (variable-length names, numbers)?
- Landscape / tablet considerations?

### 9. Localization Readiness
- Text containers flexible for languages 20-30% longer?
- Date, time, number formats localizable?
- RTL layout considered if applicable?

### 10. Design System Adherence
- All components from shared library, or detached/overridden?
- Colors using tokens/variables or hardcoded hex?
- Spacing from consistent scale?

## Recommendation Format

For each issue:
- **ID**: `{MODULE}-{NUMBER}` (e.g., AUTH-01, HOME-03, NAV-01)
- **Priority**: `[P0]` critical / `[P1]` important / `[P2]` nice-to-have
- **Problem**: one sentence — what's wrong + user impact
- **Solution**: specific fix with:
  - Node IDs (where applicable)
  - Exact color values, font sizes, spacing from the design system
  - Wireframe-level screen descriptions for new screens (ASCII layout in code blocks)
  - Component names to reuse

Priority criteria:
- **P0**: Blocks user tasks, missing critical states, no error recovery, accessibility failures
- **P1**: Friction, inconsistencies, missing feedback, poor affordance
- **P2**: Polish, micro-interactions, edge cases

## Output

Write the full report to: `results/{project_name}/ux-analysis.md`

Use this structure:

```
# {Project Name} — UX Analysis Report

## Design System Summary
[tokens, fonts, colors, spacing]

## Scoring Summary
| Module | Score | Key Issues |
|--------|-------|------------|
| ... | X/10 | ... |
| **Overall** | **X/10** | **weighted avg (Navigation & State Coverage count 2x)** |

## Detailed Analysis by Module

### {Module Name} ({Score}/10)
#### Issues Found
{MODULE}-01 [P0] ...
{MODULE}-02 [P1] ...
(for each issue: Problem + Solution with full detail)

## Implementation Roadmap
### Sprint 1 (Foundation): all P0 items
### Sprint 2 (Core UX): high-impact P1 items
### Sprint 3 (Security & Polish): remaining P1
### Sprint 4 (Quality): all P2 items

Total: X new screens to design, Y screens to modify
```

**END AGENT PROMPT**

---

## Phase 3: Present Results (you do this)

After the ux-designer agent completes:

1. Read `results/{project_name}/ux-analysis.md`
2. Display the **Scoring Summary table** and **Overall Score** in the chat
3. Highlight the top 3-5 most critical (P0) findings
4. Mention total recommendation count and sprint breakdown
