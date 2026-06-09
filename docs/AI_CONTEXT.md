# AI Context — Texnomart Monorepo

> Last updated: 2026-06-09

All UI is mock data — no backend or API integration exists yet. Architecture, structure, and conventions are in `CLAUDE.md` (root + per-project).

## Project Status

| Project | Status |
|---|---|
| **Broker Dashboard** | All 14 prompt pack pages complete, 23 routes. Prototype stage (mock data). |
| **Texnomart Promo** | Bootstrap + Master shell complete — runnable app (`pnpm dev:promo`): auth, 7-module nav, 9-role switcher, Promo primitives, seed mock data. Module screens (S1–S8) are placeholders. See `Promo/CLAUDE.md`. |

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
- [ ] **Promo**: module screens S1–S8 are placeholders (only the shell + short-calendar preview exist)
- [ ] **Promo**: the «Скрыть отменённое» FilterBar switch is cosmetic in the bootstrap (real filtering lands with S1)

## Next Steps

1. Mobile responsiveness for ApplicationsPage list
2. API integration layer (replace mock data)
3. Cleanup: legacy `ApplicationDetailDrawer.tsx`, unused MUI/Emotion deps
4. Dark mode visual QA
5. i18n for Uzbek language support
6. Build out **Texnomart Promo** screens S1–S8 from `docs/promo_prompt_pack.md` (bootstrap + Master shell done) — start with S1 (Краткий промо-календарь) and S2 (Полный промо-календарь грид)
