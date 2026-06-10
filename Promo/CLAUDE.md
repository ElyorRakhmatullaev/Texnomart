# Texnomart Promo

Internal, role-based B2B workspace for planning and approving **planned & unplanned promo campaigns** in a promo calendar. Bootstrapped from `docs/promo_prompt_pack.md` (derived from the ТЗ v6.0 spec).

> For shared tech stack, design system, patterns, and conventions see the root [CLAUDE.md](../CLAUDE.md).
> For current state and known issues see [docs/AI_CONTEXT.md](../docs/AI_CONTEXT.md).
> For full screen specs see [docs/promo_prompt_pack.md](../docs/promo_prompt_pack.md) (Foundation + Master + S1–S8 + Appendices A–D).
> For lessons and gotchas see [tasks/lessons.md](../tasks/lessons.md).

## Status

**Bootstrap + Master shell + S1 complete; S2 complete (Phases 1–5).** The app runs (`pnpm dev:promo`): auth flow, 7-module nav, the 9-role switcher, Promo primitives, seed mock data, the real **Краткий промо-календарь (S1)** screen, and the **Полный промо-календарь (S2)** editable grid (Pattern F split-pane, 38-field dictionary, role gating, column-group chooser; **Phase 2**: inline editing of КМ fields with live validation, остаток ✏️ + warehouse-breakdown popover, installment auto-recalc, gift conditional fields, «В рекламу» checkboxes + bulk-select, and a functional draft/submit action bar — mock toasts; **Phase 3**: nomenclature entry via a searchable 1С Command picker (no free-text), duplicate-check confirm dialog with a persistent «дубль» marker + line history, and a gift-nomenclature picker; **Phase 4**: Excel/CSV bulk import with a per-row validation preview, and the 1С-availability flow — «Ожидает проверки 1С» banner + re-check + submit gate; **Phase 5**: unplanned-campaign creation («Создать акцию» — new внеплановая with system-generated № промо + ≥3-cal-day deadline guard, OR «встроить в плановую»), edit-until-first-send, campaigns lifted into page state so created/integrated ones render, and a mobile full-screen per-line edit Sheet). Screens **S3–S8** are **pending** (still placeholders).

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
        full-calendar/              # S2 — Полный промо-календарь (complete; Phases 1–5: editable grid + nomenclature entry + Excel import & 1С states + unplanned creation + mobile per-line Sheet)
          FullCalendarPage.tsx      #   shell: role gate + PageHeader + column chooser + FilterBar + editable line store (useReducer Map: edit/add/addMany/recheck1C/bulkAdv) + campaign state (visibleCampaigns: created/integrated campaigns appear) + bulk-select strip + non-blocking 1С «Ожидает проверки» banner (re-check) + live-validation fixed-footer action bar (draft/submit gated on validity AND no pending 1С; submit flips firstSendDone on unplanned); hosts the add/gift pickers, duplicate-confirm dialog, Excel-import dialog, create/edit-campaign dialog, and the mobile per-line Sheet
          FullCalendarGrid.tsx      #   Pattern F split-pane grid (frozen select/№ промо/ФИО КМ/Номенклатура + scrolling 38-field block); editable КМ cells, editable «В рекламу» checkboxes, row/group select for bulk; per-band «+ Добавить номенклатуру» + «Изменить» (unplanned, not-yet-sent), empty-campaign band, mobile row-tap chevron (onLineTap); clickable gift-nomenclature cell; campaign group bands, amber tint + lock/required/rejected/duplicate(+info tooltip)/1С markers
          EditableCell.tsx          #   inline number/money/percent/text input — commit on blur/Enter, Esc cancels, required «не заполнено» marker + ✏️ manual pencil; fixed height keeps panes aligned (reused by the grid AND the per-line Sheet)
          AddNomenclatureDialog.tsx #   searchable 1С-reference Command picker in a Dialog (§8.2.1, no free-text); reused for adding a line AND picking gift nomenclature
          ExcelImportDialog.tsx     #   Excel/CSV bulk import (§8.2.1): campaign select + «Скачать шаблон» + drag-drop/«Вставить пример» + per-row validation preview (Готово/Дубль/Ошибка + reason); imports non-error rows as drafts (pending 1С); full-screen below sm
          CreateCampaignDialog.tsx  #   §10: two-tab Dialog «Новая внеплановая» (тип/название/период, system № промо, ≥3-cal-day deadline guard) / «Встроить в плановую» (existing planned campaign); also edit-mode (prefilled, no tabs) for an unplanned not-yet-sent campaign; full-screen below sm
          LineEditSheet.tsx         #   mobile full-screen «редактировать строку» Sheet — line fields stacked by group (Товар/Цены/Маркетинг) over a read-only context block; reuses EditableCell so edits hit the same store
          WarehousePopover.tsx      #   per-warehouse остаток breakdown + total (§8.2.2, read-only from 1С); native-button trigger beside the editable остаток
          gridFields.ts             #   38-field column dictionary (Appendix C): groups, widths, source→lock (km editable incl. giftNomenclature; auto/1С/calc locked), required
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
      promo-mock-data.ts            # seed: 8 campaigns, 6 КМ, 30 SKUs, 7 promo types; S2 PromoLine model + 9 lines, warehouse breakdown, installment + full-calendar-access helpers, isGiftType / missingRequiredFields / isLineValid validators; Phase 3: createPromoLine factory, detectDuplicate (+DuplicateHit), LineHistoryEntry; Phase 4: IMPORT_COLUMNS, buildImportTemplateCsv/buildImportSampleCsv, parseImportCsv (+ParsedImportRow/ImportParseResult), createImportedLine; Phase 5: createUnplannedCampaign (+UnplannedCampaignInput), validateUnplannedInput, minUnplannedStartDate/addCalendarDays/MIN_UNPLANNED_LEAD_DAYS, PromoCampaign.firstSendDone, «Черновик» CampaignStatus
    styles/                         # index/tailwind/theme/fonts/globals (copied from Dashboard)
```

## Routes

| Route | Component | Status |
|---|---|---|
| `/login` `/login/2fa` `/login/forgot-password` `/login/reset-password/:token` | auth pages | Done (shared mock auth) |
| `/` | → redirects to `/short-calendar` | Done |
| `/short-calendar` | ShortCalendarPage | **Done (S1)** — table + «План акций» mode |
| `/short-calendar/:promoId` | ShortCalendarDetailPage | **Done (S1)** — Pattern D full page |
| `/full-calendar` | FullCalendarPage | **Done (S2 — complete)** — editable Pattern F grid: inline editing, live validation, warehouse popover, bulk-select, functional action bar, nomenclature entry (1С Command picker) + duplicate check + gift picker, Excel/CSV import + 1С availability banner/re-check/submit gate, unplanned-campaign creation + integrate-into-planned + edit-until-first-send, mobile full-screen per-line edit Sheet |
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
- `app-shell.tsx`: optional `roleSwitcher` prop → role pill + user-menu switcher; nav gating uses the active role (falls back to `config.user.role`). The Promo wrapper drives the existing `maxWidth` prop per-route (`100%` for `/full-calendar`, `1400px` elsewhere) via `useLocation`.
- `components/filter-bar.tsx`: added optional `className` prop (merged via `cn`) to override the container — Promo's full calendar passes `bg-transparent px-0`; Dashboard usages unchanged.
- `components/page-header.tsx`: header height relaxed `sm:h-14` → `sm:min-h-14` so tall titles (32px H1 + subtitle) aren't clipped; backward-compatible.
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
