# AI Context — Texnomart Monorepo

> Last updated: 2026-06-10

All UI is mock data — no backend or API integration exists yet. Architecture, structure, and conventions are in `CLAUDE.md` (root + per-project).

## Project Status

| Project | Status |
|---|---|
| **Broker Dashboard** | All 14 prompt pack pages complete, 23 routes. Prototype stage (mock data). |
| **Texnomart Promo** | Bootstrap + Master shell + **S1 (Краткий промо-календарь)** complete; **S2 (Полный промо-календарь) Phases 1–4** complete — runnable app (`pnpm dev:promo`): auth, 7-module nav, 9-role switcher, Promo primitives, seed mock data, S1 short calendar, S2 editable Pattern F grid (inline editing, live validation, остаток ✏️ + warehouse popover, installment auto-recalc, gift conditional fields, «В рекламу» bulk-select, functional draft/submit action bar; **Phase 3**: nomenclature entry via a searchable 1С Command picker + duplicate-check confirm dialog with persistent «дубль» marker/history, gift nomenclature picker; **Phase 4**: Excel/CSV bulk import with per-row validation preview + 1С availability banner/re-check + submit gate). S2 Phase 5 (unplanned creation, mobile per-line Sheet) and screens S3–S8 are placeholders. See `Promo/CLAUDE.md`. |

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
- [ ] **Promo**: module screens S3–S8 are placeholders (S1 short calendar + S2 full-calendar Phases 1–4 are built)
- [ ] **Promo S2**: Phases 1–4 (read-only skeleton + inline editing/validation + nomenclature entry & duplicate check + Excel import & 1С states) done — unplanned creation and mobile per-line Sheet (Phase 5) are pending; installment values are an illustrative model (not exact bank formulas)
- [ ] **Promo S2**: edits/added/imported lines live only in in-memory React state (no persistence — «Сохранить черновик»/«Отправить» are mock toasts; reload reseeds). No per-person КМ identity, so any КМ-role user edits all КМ lines and new/imported lines attach to the campaign's existing КМ (mock simplification, same as S1). Прогноз продаж↔цена and цена↔скидка% are not auto-linked
- [ ] **Promo S2 Phase 3**: duplicate detection covers same-promo and overlapping-period cross-promo, but seed campaigns have no overlapping periods, so the cross-promo branch isn't reachable from the seed UI (same-promo path is). Line «история» is stored on the line but not yet surfaced in a drawer (full VersionHistoryDrawer is S4)
- [ ] **Promo S2 Phase 4**: «Excel» import is client-side CSV (no .xlsx parser dep); the 1С re-check always passes (the failed-row-with-reason path is represented by the existing rejected/reason marker, not a separate 1С-failure simulation); import is scoped to a chosen campaign (no № промо column in the file) and doesn't detect duplicates among rows within the same import batch
- [ ] **Promo**: «План акций» mode is a mock state machine (local state + toasts) — no persistence; plan-row creation adds to local state only
- [ ] **Promo**: overdue tags are computed against the real `new Date()`; seed PR-2026-007 exists so the OverdueTag path is visible at today's date

## Next Steps

1. Mobile responsiveness for ApplicationsPage list
2. API integration layer (replace mock data)
3. Cleanup: legacy `ApplicationDetailDrawer.tsx`, unused MUI/Emotion deps
4. Dark mode visual QA
5. i18n for Uzbek language support
6. Build out **Texnomart Promo** screens from `docs/promo_prompt_pack.md` — next is **S2 Phase 5** (unplanned campaign creation: «Создать внеплановую акцию» — no № промо/system-generated id, признак auto «Внеплановая», type editable until first send, deadline ≥ 3 кал. дн. before start; «встроить в существующую плановую акцию»; + mobile per-line edit Sheet: tapping a line opens a full-screen «редактировать строку» Sheet with fields stacked by group, and the Excel/warehouse dialogs become full-screen Sheets below sm), then S3–S8
