# Lessons Learned

## 2026-06-04 — Circular import crash (FullCalendar)
**Problem**: `FullCalendar.tsx` called `mkRow()` at module top level, which accessed `MOCK_CAMPAIGNS` imported from `App.tsx`. Due to circular imports (App → FullCalendar → App), `MOCK_CAMPAIGNS` was `undefined` at module-eval time, causing a white screen with no visible error.

**Root cause**: ESM live bindings work for values accessed at render time (inside components), but NOT for values accessed during module initialization (top-level code). `ShortCalendar.tsx` works because it only accesses App.tsx exports inside `useApp()` at render time.

**Fix**: Wrapped `INITIAL_ROWS` in a `buildInitialRows()` function and called it via `useState(() => buildInitialRows(campaigns, managers))` inside the component, so App.tsx exports are resolved by the time the function runs.

**Rule**: In any `src/pages/*.tsx` module, NEVER access `MOCK_CAMPAIGNS`, `MOCK_MANAGERS`, or other App.tsx exports at the top level. Always access them inside component bodies (via hooks, useMemo, useState lazy init).

## 2026-06-05 — Sticky positioning fails in nested overflow contexts (FullCalendar)
**Problem**: `position: sticky` on `<td>` elements in FullCalendar's data grid did not work — frozen columns scrolled along with the rest of the table, ignoring `sticky` + `left` values.

**Root cause**: App.tsx wraps page content in `<main className="overflow-auto">`. CSS `position: sticky` requires the nearest scrolling ancestor to be the element you want sticky behavior relative to. When a `<td>` is inside `<table>` inside `<div overflow-auto>` inside `<main overflow-auto>`, the sticky context can become ambiguous or broken across browsers. Attempted fixes (`!important`, `will-change`, `border-collapse: separate`, CSS classes) all failed.

**Fix**: Replaced the single-table approach with a **split-pane layout** — two side-by-side divs: a fixed-width left div (frozen columns, `overflow-y: auto; overflow-x: hidden`, hidden scrollbar) and a flex-grow right div (scrollable columns, `overflow: auto`). Vertical scrolling is synchronized via `onScroll` handlers (`scrollLeftRef.scrollTop = scrollRightRef.scrollTop`). Both tables use `border-collapse: separate` so that `<th>` elements can be `position: sticky; top: 0` for vertical header sticking.

**Rule**: Never use `position: sticky` on `<td>` elements for horizontal frozen columns when the table is inside App.tsx's `<main overflow-auto>`. Use the split-pane pattern instead. Vertical header sticking (`sticky top`) on `<th>` still works within each pane because the pane div is the direct scroll container.
