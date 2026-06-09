# AI Context — Texnomart Monorepo

> Last updated: 2026-06-09

All UI is mock data — no backend or API integration exists yet. Architecture, structure, and conventions are in `CLAUDE.md` (root + per-project).

## Project Status

| Project | Status |
|---|---|
| **Broker Dashboard** | All 14 prompt pack pages complete, 23 routes. Prototype stage (mock data). |
| **Texnomart Promo** | Bootstrap + Master shell + **S1 (Краткий промо-календарь)** complete; **S2 (Полный промо-календарь) grid skeleton — Phase 1** complete — runnable app (`pnpm dev:promo`): auth, 7-module nav, 9-role switcher, Promo primitives, seed mock data, S1 short calendar, S2 read-only Pattern F grid. S2 Phases 2–5 (editing, nomenclature entry, Excel import, 1С states, unplanned, mobile) and screens S3–S8 are placeholders. See `Promo/CLAUDE.md`. |

## Known Issues & TODOs

- [ ] Geography map uses SVG placeholders — needs Yandex Maps API
- [ ] Dark mode untested (CSS variables defined)
- [ ] No pagination on Applications table
- [ ] Filter chips are visual only (no real filtering)
- [ ] `ApplicationDetailDrawer.tsx` is legacy — remove
- [ ] No i18n system — language selector non-functional
- [ ] MUI Material in dependencies but unused — remove
- [ ] `globals.css` is empty
- [ ] No tests
- [ ] No API layer
- [ ] ApplicationsPage list needs mobile Pattern K
- [ ] Detail pages other than Applications still use sticky action bars (can float mid-screen on short tabs); Applications uses the flex-column fixed-footer layout — consider converting the rest for consistency
- [ ] **Promo**: module screens S3–S8 are placeholders (S1 short calendar + S2 full-calendar grid skeleton are built)
- [ ] **Promo S2**: Phase 1 (read-only grid skeleton) only — editing, nomenclature entry, Excel import, 1С states, unplanned creation, and mobile per-line Sheet (Phases 2–5) are pending; the action bar is inert and installment values are an illustrative model (not exact bank formulas)
- [ ] **Promo**: «План акций» mode is a mock state machine (local state + toasts) — no persistence; plan-row creation adds to local state only
- [ ] **Promo**: overdue tags are computed against the real `new Date()`; seed PR-2026-007 exists so the OverdueTag path is visible at today's date

## Next Steps

1. Mobile responsiveness for ApplicationsPage list
2. API integration layer (replace mock data)
3. Cleanup: legacy `ApplicationDetailDrawer.tsx`, unused MUI/Emotion deps
4. Dark mode visual QA
5. i18n for Uzbek language support
6. Build out **Texnomart Promo** screens from `docs/promo_prompt_pack.md` — next is **S2 Phase 2** (inline editing + validation wiring on «Прогноз продаж», installment auto-calc on edit, остаток ✏️ + warehouse popover, gift conditional fields, «В рекламу» checkboxes + bulk-select), then S2 Phases 3–5 (nomenclature entry, Excel import + 1С states, unplanned creation + mobile), then S3–S8
