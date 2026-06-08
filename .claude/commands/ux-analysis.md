---
name: ux-analysis
description: Comprehensive UX analysis of any Figma design — evaluates usability, accessibility, consistency, and interaction patterns, then produces scored recommendations with actionable fixes
argument-hint: [figma-url-1] [figma-url-2] ...
allowed-tools: mcp__figma__get_design_context mcp__figma__get_screenshot mcp__figma__get_metadata WebSearch
---

# UX Analysis of Figma Designs

You are a senior UX auditor. Perform a comprehensive, actionable UX analysis of the Figma design(s) provided below.

## Input

Figma URLs to analyze:
$ARGUMENTS

## Step 1: Parse URLs and Gather Design Data

For each Figma URL:

1. **Extract identifiers** from the URL:
   - `figma.com/design/:fileKey/:fileName?node-id=:nodeId` — convert `-` to `:` in nodeId
   - `figma.com/design/:fileKey/branch/:branchKey/:fileName` — use branchKey as fileKey
   - `figma.com/make/:makeFileKey/:makeFileName` — use makeFileKey
   - `figma.com/board/:fileKey/:fileName` — FigJam file, use `get_figjam`

2. **Collect data** using these tools (call in parallel per URL):
   - `mcp__figma__get_screenshot` — visual overview of the design
   - `mcp__figma__get_design_context` — code output, tokens, component instances, annotations
   - `mcp__figma__get_metadata` — node tree, layer structure, dimensions

3. **Identify the design system**: extract font families, color tokens (CSS variables or raw hex), spacing scale, border-radius values, icon set, and component library from the design context output.

## Step 2: Analyze Across 10 UX Categories

Evaluate each module/section of the design against these categories. Score each **X/10** with a brief justification.

### Category 1: Usability & Task Flow
- Can users complete primary tasks with minimal steps?
- Are flows linear and logical, or do they require backtracking?
- Are there dead ends where the user gets stuck?

### Category 2: Visual Hierarchy & Layout
- Does the layout guide the eye to the most important elements first?
- Is there clear distinction between primary, secondary, and tertiary content?
- Are spacing and alignment consistent?

### Category 3: Navigation & Information Architecture
- Is there a global navigation pattern (tab bar, drawer, etc.)?
- Can users orient themselves — do they know where they are and how to go back?
- Are related features grouped logically?

### Category 4: Interaction Feedback & State Coverage
Check that EVERY interactive screen has designs for:
- **Empty state** (no data yet)
- **Loading state** (skeleton or spinner)
- **Error state** (network failure, validation error)
- **Success state** (confirmation after action)
- **Partial state** (some data loaded, some pending)
Flag any missing states as P0 issues.

### Category 5: Consistency
- Are similar elements styled identically across screens?
- Do buttons, cards, inputs, and badges follow a single pattern?
- Is typography consistent (font family, weight scale, size scale)?
- Are icons from one set or mixed?

### Category 6: Accessibility
Evaluate and report specific values:
- **Color contrast**: check text/background pairs against WCAG AA (4.5:1 for normal text, 3:1 for large text). Report current ratio and suggested fix hex values.
- **Tap targets**: minimum 44x44px for mobile. Measure actual sizes from metadata.
- **Font sizes**: minimum 14px for body text, 12px only for supplementary labels.
- **Screen reader support**: do icons and status indicators have text alternatives?

### Category 7: Error Handling & Recovery
- Are error messages specific and helpful (not just "Error occurred")?
- Can users recover from errors without losing progress?
- Are there password recovery, retry, undo, and fallback mechanisms?
- Are destructive actions confirmed before execution?

### Category 8: Responsiveness & Edge Cases
- How do designs handle long text, truncation, or text overflow?
- Are layouts resilient to dynamic content (variable-length names, numbers)?
- Is there a landscape or tablet consideration?

### Category 9: Localization Readiness
- Are text containers flexible enough for languages 20-30% longer than the primary language?
- Are date, time, and number formats localizable?
- Is right-to-left (RTL) layout considered if applicable?

### Category 10: Design System Adherence
- Are all components instances of a shared library, or are there detached/overridden instances?
- Are color values using tokens/variables or hardcoded hex?
- Are spacing values from a consistent scale (4px, 8px, 12px, 16px, 24px...)?

## Step 3: Generate Recommendations

For each issue found:

1. **ID**: `{MODULE}-{NUMBER}` (e.g., AUTH-01, HOME-03, NAV-01)
2. **Priority**: `[P0]` critical / `[P1]` important / `[P2]` nice-to-have
3. **Problem**: one sentence describing what's wrong and the user impact
4. **Solution**: specific, implementable fix including:
   - Node IDs from metadata (where applicable)
   - Exact color values, font sizes, spacing from the design system
   - Wireframe-level screen descriptions for new screens (use code blocks with ASCII layout)
   - Component names to reuse from the existing design system

Prioritization criteria:
- **P0**: Blocks user tasks, missing critical states, no error recovery, accessibility failures
- **P1**: Friction in flows, inconsistencies, missing feedback, poor affordance
- **P2**: Polish, micro-interactions, edge cases, nice-to-have enhancements

## Step 4: Score Summary & Roadmap

### Summary Table
Create a table with:
| Module | Score (Before) | Score (After) | Key Changes |

### Overall Score
Calculate weighted average: Navigation and State Coverage count 2x because they affect every user interaction.

### Implementation Roadmap
Organize recommendations into sprints:
- **Sprint 1**: All P0 items (foundation — navigation, missing states, critical flows)
- **Sprint 2**: P1 items that affect the most users
- **Sprint 3**: Remaining P1 + security/auth improvements
- **Sprint 4**: All P2 items (polish, accessibility, localization)

Include total count: "X new screens to design, Y screens to modify"

## Output Format

1. Create the output folder: `results/{project_name}/` where `{project_name}` is derived from the Figma file name (lowercase, spaces replaced with hyphens, e.g., `results/texnomart-sales-app/`)
2. Save the full analysis as `results/{project_name}/ux-analysis.md`
3. Display the **Summary Table** and **Overall Score** directly in the chat response so the user sees results immediately.
