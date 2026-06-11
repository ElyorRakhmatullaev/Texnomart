# AI Context — Texnomart Monorepo

> Last updated: 2026-06-11 (Promo S4 — Phase 2: edit-after-approval + Маркетинг re-approval + incremental send + period ✏️/bold)

All UI is mock data — no backend or API integration exists yet. Architecture, structure, and conventions are in `CLAUDE.md` (root + per-project).

## Project Status

| Project | Status |
|---|---|
| **Broker Dashboard** | All 14 prompt pack pages complete, 23 routes. Prototype stage (mock data). |
| **Texnomart Promo** | Bootstrap + Master shell + **S1 (Краткий промо-календарь)** complete; **S2 (Полный промо-календарь) complete (Phases 1–5)**; **S3 (Согласование и проверка) complete (Phases 1–3)** — runnable app (`pnpm dev:promo`): auth, 7-module nav, 9-role switcher, Promo primitives, seed mock data, S1 short calendar, S2 editable Pattern F grid (inline editing, live validation, остаток ✏️ + warehouse popover, installment auto-recalc, gift conditional fields, «В рекламу» bulk-select, functional draft/submit action bar; nomenclature entry via 1С Command picker + duplicate check; Excel/CSV import + 1С availability banner/re-check/submit gate; unplanned-campaign creation/integrate + edit-until-first-send + mobile per-line Sheet), and the **S3 approval workspace** at `/approvals` (+ `/approvals/:id`): role-aware review queue with a working-days SLA timer (Pattern C table → Mode-B cards) + «Не участвует»/«Авто-передано» tags, a split-view detail with per-line/bulk Принять·Отклонить (`ReasonDialog` comment), status transitions (Старший КМ → КД auto-forward → «Принято КД»; any line rejected → whole КМ set returns to «Не заполнено»), the full **«Не участвует»** lifecycle (КМ «Мои участия» raises → Старший КМ → КД; КД sets it directly), **live auto-escalation** to КД after the 2-working-day breach, a non-blocking **просрочка** note, a per-campaign **advance gate**, review comments surfaced in the **`VersionHistoryDrawer`**, and a mobile fixed action bar. **S4 (Управление изменениями) — Phases 1–2**: Phase 1 — the three-view `VersionHistoryDrawer` (Только изменения / Полный актуальный отчёт / История версий) with a per-field diff, opened from a per-campaign «История» button; Phase 2 — edit-after-approval (edits to an approved campaign are diffed against a baseline → amber changed-cell highlight + «N изм. после согл.» badge + a «Черновик — не отправлено» drawer section), «Ожидает повторного согласования маркетинга» routing (§11.8; additions skip it), Сотрудник маркетинга «Согласовать (маркетинг)» → КД «Согласовать и отправить смежным отделам» appending a live new version (incremental send), and period change (§11.5: КД «Изменить период» → bold + ✏️, re-approval re-triggered). Screens S5–S8 are placeholders. See `Promo/CLAUDE.md`. |

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
- [ ] **Promo**: module screens S5–S8 are placeholders (S1 short calendar + S2 full-calendar + S3 approvals built; S4 change-management started — Phase 1)
- [ ] **Promo S4**: Phases 1–2 done. Phase 1 — versioning model + three-view `VersionHistoryDrawer` + per-field diff. Phase 2 — edit-after-approval change tracking (baseline diff, amber cell highlight, «N изм. после согл.» badge, live draft section), «Ожидает повторного согласования маркетинга» (§11.8, additions skip it), Сотрудник маркетинга re-approve → КД «Согласовать и отправить» appending a live version (incremental send re-baselines/clears the draft), period change (§11.5 bold + ✏️). Mock limits: in-memory only (reload reseeds — baseline, live versions, marketing re-approval all reset); PR-2026-003 (1+1) is now the reachable approved campaign for the demo; no per-person identity; period-change deadline guards not enforced; the incremental "send" is a toast (no departments/notifications module — S5/S6). **Phase 3 pending** (cancellation of campaign/line + «Скрыть отменённое» filter ON by default + «Изменить дедлайн»)
- [ ] **Promo S3**: complete (Phases 1–3). Phase 3 added: full «Не участвует» lifecycle (КМ «Мои участия» raises → Старший КМ → КД; КД sets directly), live auto-escalation to КД after the 2-working-day breach («Авто-передано» tag, derived from the SLA — no timers), non-blocking просрочка note + history surfacing in `VersionHistoryDrawer`, per-campaign advance gate («Готовность кампании: N из M», can't advance until every КМ is final), mobile fixed action bar. Mock limits: in-memory only (reload reseeds the provider; direct deep-links to `/approvals/:id` reseed too — navigate via the queue/panel to keep in-session state); no per-person КМ identity, so the КМ «Мои участия» panel lists every (campaign, КМ) participation and КД can set «Не участвует» for any КМ; the sidebar «Согласование» badge reads the seed baseline (AppShell is above the provider), not in-session decisions — the queue itself updates
- [ ] **Promo S2**: complete (read-only skeleton + inline editing/validation + nomenclature entry & duplicate check + Excel import & 1С states + unplanned creation/integrate/edit + mobile per-line Sheet); installment values are an illustrative model (not exact bank formulas)
- [ ] **Promo S2**: edits/added/imported/created lines & campaigns live only in in-memory React state (no persistence — «Сохранить черновик»/«Отправить» are mock toasts; reload reseeds). No per-person КМ identity, so any КМ-role user edits all КМ lines and new/imported lines + created campaigns attach to a default/the campaign's existing КМ (mock simplification, same as S1). Прогноз продаж↔цена and цена↔скидка% are not auto-linked
- [ ] **Promo S2 Phase 5**: unplanned creation generates a № промо (UN-2026-1xx) and enforces ≥3 календарных дней before start; `firstSendDone` (тип/период lock after first send) is in-memory only and the deadline rule isn't re-enforced when editing an existing campaign; the mobile per-line Sheet is reachable at any width via the row chevron (shown below md)
- [ ] **Promo S2 Phase 3**: duplicate detection covers same-promo and overlapping-period cross-promo, but seed campaigns have no overlapping periods, so the cross-promo branch isn't reachable from the seed UI (same-promo path is). Per-line «история» (dup additions, `LineHistoryEntry`) is stored on the line but not surfaced in the version drawer — the S4 `VersionHistoryDrawer` shows campaign-level versions + the live edit-after-approval diff, not the per-line dup log
- [ ] **Promo S2 Phase 4**: «Excel» import is client-side CSV (no .xlsx parser dep); the 1С re-check always passes (the failed-row-with-reason path is represented by the existing rejected/reason marker, not a separate 1С-failure simulation); import is scoped to a chosen campaign (no № промо column in the file) and doesn't detect duplicates among rows within the same import batch
- [ ] **Promo**: «План акций» mode is a mock state machine (local state + toasts) — no persistence; plan-row creation adds to local state only
- [ ] **Promo**: overdue tags are computed against the real `new Date()`; seed PR-2026-007 exists so the OverdueTag path is visible at today's date

## Next Steps

1. Mobile responsiveness for ApplicationsPage list
2. API integration layer (replace mock data)
3. Cleanup: legacy `ApplicationDetailDrawer.tsx`, unused MUI/Emotion deps
4. Dark mode visual QA
5. i18n for Uzbek language support
6. Build out **Texnomart Promo** screens from `docs/promo_prompt_pack.md` — S2 + S3 complete; **S4 Phases 1–2 done** (versioning + three-view drawer + diff; edit-after-approval + Маркетинг re-approval + incremental send + period ✏️/bold). Next: **S4 Phase 3** (cancellation of campaign/line + «Скрыть отменённое» filter ON by default + «Изменить дедлайн»), then S5–S8
