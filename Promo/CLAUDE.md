# Texnomart Promo

Internal, role-based B2B workspace for planning and approving **planned & unplanned promo campaigns** in a promo calendar. Bootstrapped from `docs/promo_prompt_pack.md` (derived from the ТЗ v6.0 spec).

> For shared tech stack, design system, patterns, and conventions see the root [CLAUDE.md](../CLAUDE.md).
> For current state and known issues see [docs/AI_CONTEXT.md](../docs/AI_CONTEXT.md).
> For full screen specs see [docs/promo_prompt_pack.md](../docs/promo_prompt_pack.md) (Foundation + Master + S1–S8 + Appendices A–D).
> For lessons and gotchas see [tasks/lessons.md](../tasks/lessons.md).

## Status

**Bootstrap + Master shell + S1 complete; S2 grid skeleton (Phase 1) complete.** The app runs (`pnpm dev:promo`): auth flow, 7-module nav, the 9-role switcher, Promo primitives, seed mock data, the real **Краткий промо-календарь (S1)** screen, and the **Полный промо-календарь (S2)** read-only grid skeleton (Pattern F split-pane, 38-field dictionary, role gating, column-group chooser, inert action bar). S2 Phases 2–5 (inline editing, nomenclature entry, Excel import, 1С states, unplanned creation, mobile) and screens S3–S8 are **pending** (S3–S8 still placeholders).

## Commands

```
pnpm dev:promo      # start dev server (Vite)
pnpm build:promo    # production build
```

> pnpm is invoked via `corepack pnpm …` in this environment (pnpm is not on PATH; corepack ships with Node).

## Project Structure

```
Promo/
  index.html
  vite.config.ts                    # aliases: @ → ./src, @texnomart/ui, @texnomart/shared
  src/
    main.tsx                        # createRoot + styles
    app/
      App.tsx                       # AuthProvider → RoleProvider → RouterProvider + Toaster
      routes.tsx                    # guest /login + protected layout; module placeholders
      role-context.tsx              # RoleProvider / useRole — 9 roles, sessionStorage-persisted
      shell-config.tsx              # createPromoShellConfig(role): nav, breadcrumbs, logos, badges
      components/
        AppShell.tsx                # thin wrapper over @texnomart/shared AppShell + role switcher + command search
        ModulePlaceholder.tsx       # titled placeholder + demo FilterBar + in-progress empty state (S2–S8)
        short-calendar/             # S1 — Краткий промо-календарь
          ShortCalendarPage.tsx     #   PageHeader + mode Tabs + FilterBar + table / mobile list
          ShortCalendarTable.tsx    #   Pattern F split-pane grid (frozen identity + scrolling per-КМ pane)
          AggregatedIndicators.tsx  #   §4.6 four count-chips cluster
          PlanMode.tsx              #   «План акций» stepper + role-aware approval + create-row dialog
          ShortCalendarDetailPage.tsx #  Pattern D full page /short-calendar/:promoId
        full-calendar/              # S2 — Полный промо-календарь (Phase 1: read-only grid skeleton)
          FullCalendarPage.tsx      #   shell: role gate + PageHeader + column chooser + FilterBar + inert fixed-footer action bar
          FullCalendarGrid.tsx      #   Pattern F split-pane grid (frozen № промо/ФИО КМ/Номенклатура + scrolling 38-field block), campaign group bands, lock/required/rejected/duplicate/1С markers
          gridFields.ts             #   38-field column dictionary (Appendix C): groups, widths, source→lock, required
          ColumnGroupToggle.tsx     #   «Колонки N из 5» popover with group checkboxes
        auth/                       # Login, 2FA, ForgotPassword, ResetPassword, AuthLayout, AuthContext (re-export), RequireAuth (re-export)
    components/                     # Promo-specific shared primitives (reused by every screen)
      PromoStatusBadge.tsx          # wraps shared StatusBadge; full status map (Appendix A)
      OverdueTag.tsx                # red «+N дн.» micro-tag, never blocking
      Money.tsx / RuDate.tsx        # wrappers over formatSum / formatDateFull
      ReasonDialog.tsx              # confirm Dialog with required reason Textarea
      VersionHistoryDrawer.tsx      # right Sheet, version list + «только изменения» toggle (stub → S4)
      DeadlineChips.tsx             # calendar-deadline chips (46/21/17 дн., «календарные»)
    lib/
      promo-mock-data.ts            # seed: 8 campaigns, 6 КМ, 30 SKUs, 7 promo types; S2 PromoLine model + 9 lines, warehouse breakdown, installment + full-calendar-access helpers
    styles/                         # index/tailwind/theme/fonts/globals (copied from Dashboard)
```

## Routes

| Route | Component | Status |
|---|---|---|
| `/login` `/login/2fa` `/login/forgot-password` `/login/reset-password/:token` | auth pages | Done (shared mock auth) |
| `/` | → redirects to `/short-calendar` | Done |
| `/short-calendar` | ShortCalendarPage | **Done (S1)** — table + «План акций» mode |
| `/short-calendar/:promoId` | ShortCalendarDetailPage | **Done (S1)** — Pattern D full page |
| `/full-calendar` | FullCalendarPage | **Done (S2 — Phase 1)** — read-only Pattern F grid skeleton (Phases 2–5 pending) |
| `/approvals` `/approvals/:id` | ApprovalsPage | Placeholder (S3) |
| `/reports` | ReportsPage | Placeholder (S5) |
| `/notifications` | NotificationsPage | Placeholder (S6) |
| `/audit` | AuditPage | Placeholder (S8) |
| `/promo-types` `/promo-types/:ruleId` | PromoTypesPage | Placeholder (S7), role-gated to КД/Администратор |

## Roles (9) — `role-context.tsx`

Коммерческий директор · Операционный директор · Директор маркетинга · Категорийный менеджер (КМ) · Старший КМ · Сотрудник маркетинга · Сотрудник закупа · Сотрудник аналитики · Администратор.

- The active role lives in `RoleContext` (`useRole()`), persisted to `sessionStorage` (`promo:current-role`), default **Коммерческий директор**.
- The switcher is in the AppShell **avatar dropdown** + a **pill** beside the avatar — implemented as an optional, backward-compatible extension to the shared `AppShell` (`roleSwitcher` prop + `RoleSwitcherConfig` type). Apps that omit it (Dashboard) are unchanged.
- Nav items gate by the **active role** (`NavItem.roles`); the `/promo-types` item is КД/Администратор only.
- Full access matrix: prompt-pack **Appendix D**.

## Shared (`@texnomart/shared`) changes made for Promo

- `types`: added `RoleSwitcherConfig`.
- `app-shell.tsx`: optional `roleSwitcher` prop → role pill + user-menu switcher; nav gating uses the active role (falls back to `config.user.role`).
- `utils/formatters.ts`: added `formatSum` (UZS «сум»).

## Conventions

- All UI text **Russian**. Currency UZS via `formatSum` → «1 299 000 сум». Dates DD.MM.YYYY (`RuDate`), date+time in history.
- Always label deadlines «календарные дни» vs review SLAs «рабочие дни».
- Cancellation is a **separate state** (`cancelled`), never inside «Признак акции» (план/внеплан only).
- «Ознакомление» ≠ «Согласование». Rollback unsupported — reverting is a new correction.
- Statuses render only through `<PromoStatusBadge>` (soft tint, color + text). Overdue via `<OverdueTag>` — never blocks.
- All data mock in `src/lib/`. Detail views are full pages, never drawers (drawers only for config/version history).

## When Building a Section (S1–S8)

1. Read the matching S-prompt + Appendices in `docs/promo_prompt_pack.md`.
2. Replace the route's placeholder component with the real screen under `src/app/components/<feature>/`.
3. Reuse `@texnomart/ui` primitives, `@texnomart/shared` patterns, and the Promo primitives in `src/components/`.
4. Extend `promo-mock-data.ts` for screen-specific data; gate actions by `useRole()`.
5. Follow Patterns A–K, design tokens, and Russian-only locale.
