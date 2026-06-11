# Texnomart Promo

Internal, role-based B2B workspace for planning and approving **planned & unplanned promo campaigns** in a promo calendar. Bootstrapped from `docs/promo_prompt_pack.md` (derived from the ТЗ v6.0 spec).

> For shared tech stack, design system, patterns, and conventions see the root [CLAUDE.md](../CLAUDE.md).
> For current state and known issues see [docs/AI_CONTEXT.md](../docs/AI_CONTEXT.md).
> For full screen specs see [docs/promo_prompt_pack.md](../docs/promo_prompt_pack.md) (Foundation + Master + S1–S8 + Appendices A–D).
> For lessons and gotchas see [tasks/lessons.md](../tasks/lessons.md).

## Status

**Bootstrap + Master shell + S1 complete; S2 complete (Phases 1–5); S3 complete (Phases 1–3); S4 complete (Phases 1–3); S5 complete; S6 complete.** The app runs (`pnpm dev:promo`): auth flow, 7-module nav, the 9-role switcher, Promo primitives, seed mock data, the real **Краткий промо-календарь (S1)** screen, the **Полный промо-календарь (S2)** editable grid (Pattern F split-pane, 38-field dictionary, role gating, column-group chooser; inline editing of КМ fields with live validation, остаток ✏️ + warehouse-breakdown popover, installment auto-recalc, gift conditional fields, «В рекламу» checkboxes + bulk-select, functional draft/submit action bar; nomenclature entry via a searchable 1С Command picker (no free-text) + duplicate-check confirm dialog with a persistent «дубль» marker + line history + gift-nomenclature picker; Excel/CSV bulk import with per-row validation preview + the 1С-availability flow («Ожидает проверки 1С» banner + re-check + submit gate); unplanned-campaign creation («Создать акцию» / «встроить в плановую») + edit-until-first-send + campaigns lifted into page state + mobile full-screen per-line edit Sheet), and the **Согласование и проверка (S3)** approval workspace at `/approvals` (+ `/approvals/:id`): **Phase 1** — role-aware review queue (one item per Promo + КМ) with a working-days SLA timer (Pattern C table → Mode-B cards, тип/КМ/«только просроченные» filters); **Phase 2** — split-view detail (read-only submitted snapshot + per-line/bulk Принять·Отклонить, `ReasonDialog` comment) with status transitions (Старший КМ → КД auto-forward → «Принято КД»; rejecting any line returns the whole КМ set to «Не заполнено»), persisted line rejection feedback + a review-comment log; **Phase 3** — full **«Не участвует»** lifecycle (КМ «Мои участия» panel raises a request → Старший КМ → КД; КД can set it directly), **live auto-escalation** to КД after the 2-working-day breach («Авто-передано» tag), a non-blocking **просрочка** note, a per-campaign **advance gate** («Готовность кампании: N из M» — can't advance until every КМ has a final decision), review comments surfaced in the **`VersionHistoryDrawer`**, and a mobile fixed bottom action bar — all role-gated. **S4 (Управление изменениями) — Phase 1**: the `VersionHistoryDrawer` is fleshed out into a **three-view** drawer (**«Только изменения»** per-field diff · **«Полный актуальный отчёт»** live current snapshot · **«История версий»** version list + S3 review-comment/просрочка surfacing) with a **«Создать корректировку»** action (editor roles; rollback unsupported §5.2.1), opened from a per-campaign **«История»** button in the full-calendar grid band (all roles). **S4 Phase 2** adds **edit-after-approval** (spec §5.1/§11.8/§11.5): editing a КМ field on an approved campaign («Согласовано и отправлено смежным отделам») is diffed against a **baseline** → amber **changed-cell highlight** + a **«N изм. после согл.»** band badge + a **«Черновик — не отправлено»** section in the drawer's «Только изменения»; value/period changes derive **«Ожидает повторного согласования маркетинга»** (additions skip it); **Сотрудник маркетинга** «Согласовать (маркетинг)» → **КД** «Согласовать и отправить смежным отделам» appends a **live** new version + clears the draft (incremental send); **period change** (КД «Изменить период») renders the period **bold + ✏️**. **S4 Phase 3** adds the cancellation & deadline layer (spec §5.3/§4.7): **campaign cancellation** (КД only → required-reason `ReasonDialog` → separate `cancelled` state + «Отменена» + red/struck band + live «Отмена» version + "departments notified" toast), **line exclusion** (КМ requests via a frozen-pane Ban action / mobile Sheet with reason → `removalPending` «ожидает исключения» → КД confirms «исключена»/rejects; distinct from the S3 `rejected` flag; dropped from validation & counts), the **«Скрыть отменённое»** FilterBar `Switch` (**ON by default** — hides cancelled campaigns + removed lines), and **deadline change** (КД «Изменить дедлайн» with reason → `deadlineChange` pending band chip → **Операционный директор** «Утвердить дедлайн» → `fillDeadlineOverride` effective + logged in the `VersionHistoryDrawer`). **S5 (Отчёты для смежных подразделений)** at `/reports`: read-only, versioned reports for campaigns at «Согласовано и отправлено смежным отделам», with **three role-gated department views** (Маркетинг / Закуп / Аналитика — Tabs on sm+, Select on mobile) + a campaign picker; per-department Appendix-C **M/P/A field subsets** (Marketing widest incl. installment block + both «В рекламу»; Закуп/Аналитика the narrow компенсация set), a desktop group-header table → **Mode-B cards below md**; **versioning** («Получено …» + version + a **17-кал.-дн. overdue marker** + «История версий» drawer + «Только изменённые» toggle, amber changed-cell ring + emerald added rows); **ознакомление** («Ознакомиться со всеми»/per-line clears the highlight, explicitly **≠ согласование**, §11.7); and the **marketing-only** editable «В рекламу (выбрано маркетингом)» checkbox + bulk-select + «Согласовать выбор (маркетинг)» (Сотрудник маркетинга, §7.2) with a §11.8 re-approval reminder. **S6 (Центр уведомлений)** at `/notifications`: a notifications center + a live top-bar bell sharing one read/unread store via a `NotificationsProvider` mounted **above** the AppShell (so the bell, the sidebar «Уведомления» badge, and the page all update live on «Ознакомлен» — unlike the S3 below-shell badge); ~8 seed notifications across **6 types** (новые/изменённые данные · отмена акции · удаление позиции · повторное согласование маркетинга · назначение КМ · утверждение «В рекламу») with **role-based visibility** (§11.3.1), **date grouping** («Сегодня»/«Вчера»/дата), a **«Непрочитанные»** section over a muted **«Прочитано»** section, a **type filter**, **per-item + bulk «Ознакомлен»**, and quick links to the campaign/report; the shared AppShell bell «Показать все» navigates to `/notifications` (additive optional `notificationsHref`). Screens **S7–S8** are **pending**.

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
      routes.tsx                    # guest /login + protected layout (ProtectedLayout wraps AppShell in NotificationsProvider); S7–S8 placeholders
      role-context.tsx              # RoleProvider / useRole — 9 roles, sessionStorage-persisted
      shell-config.tsx              # createPromoShellConfig(role, unreadNotifications): nav, breadcrumbs, logos, badges (live «Согласование» + «Уведомления» counts)
      components/
        AppShell.tsx                # thin wrapper over @texnomart/shared AppShell + role switcher + command search; consumes useNotifications() → live bell items + unread count, passes notificationsHref
        ModulePlaceholder.tsx       # titled placeholder + demo FilterBar + in-progress empty state (S7–S8)
        short-calendar/             # S1 — Краткий промо-календарь
          ShortCalendarPage.tsx     #   PageHeader + mode Tabs + FilterBar + table / mobile list
          ShortCalendarTable.tsx    #   Pattern F split-pane grid (frozen identity + scrolling per-КМ pane)
          AggregatedIndicators.tsx  #   §4.6 four count-chips cluster
          PlanMode.tsx              #   «План акций» stepper + role-aware approval + create-row dialog
          ShortCalendarDetailPage.tsx #  Pattern D full page /short-calendar/:promoId
        full-calendar/              # S2 — Полный промо-календарь (complete; Phases 1–5) + S4 change-management (Phases 1–3: version drawer, edit-after-approval + re-approval/incremental send + period change; cancellation of campaign/line + «Скрыть отменённое» + deadline change)
          FullCalendarPage.tsx      #   shell: role gate + PageHeader + column chooser + FilterBar + editable line store (useReducer Map: edit/add/addMany/recheck1C/bulkAdv) + campaign state (visibleCampaigns: created/integrated campaigns appear) + bulk-select strip + non-blocking 1С «Ожидает проверки» banner (re-check) + live-validation fixed-footer action bar (draft/submit gated on validity AND no pending 1С; submit flips firstSendDone on unplanned); hosts the add/gift pickers, duplicate-confirm dialog, Excel-import dialog, create/edit-campaign dialog, the mobile per-line Sheet, the version-history drawer, and the period-change dialog. **S4 P2**: baseline/baselinePeriods/liveVersions/marketingReapproved state + changeSetFor/reapprovalStateFor/versionsFor + period-change (PeriodEditDialog) and Маркетинг re-approve / КД «Согласовать и отправить» handlers (КД send appends a live version + re-baselines). **S4 P3**: hideCancelled state (default ON) + displayLinesFor (removed lines drop when ON); reducer requestRemoval/approveRemoval/rejectRemoval; cancel-campaign / line-removal / deadline-change handlers (KD cancel appends «Отмена» version; KD approve-removal appends «Корректировка»; КД deadline request → ОД approve sets fillDeadlineOverride) + DeadlineChangeDialog; hosts the cancel + removal ReasonDialogs
          FullCalendarGrid.tsx      #   Pattern F split-pane grid (frozen select/№ промо/ФИО КМ/Номенклатура + scrolling 38-field block); editable КМ cells, editable «В рекламу» checkboxes, row/group select for bulk; per-band «+ Добавить номенклатуру» + «Изменить» (unplanned, not-yet-sent) + «История» (all roles) + «Изменить период» (КД, approved planned); empty-campaign band, mobile row-tap chevron (onLineTap); clickable gift-nomenclature cell; campaign group bands, amber tint + lock/required/rejected/duplicate(+info tooltip)/1С markers. **S4 P2**: amber changed-cell highlight (changedCells), «N изм. после согл.»/«Ожидает маркетинга» band badge (ChangeBadge), period bold + ✏️ (periodChanged). **S4 P3**: band «Отменить акцию» (КД) / «Изменить дедлайн» (КД) / «Утвердить дедлайн» (ОД) + DeadlineChip + «Отменена» badge + red/struck cancelled band; per-line LineRowActions (КМ «Исключить» hover / КД confirm·reject) + removal markers (ожидает исключения / исключена) + removed-row styling
          EditableCell.tsx          #   inline number/money/percent/text input — commit on blur/Enter, Esc cancels, required «не заполнено» marker + ✏️ manual pencil; fixed height keeps panes aligned (reused by the grid AND the per-line Sheet)
          AddNomenclatureDialog.tsx #   searchable 1С-reference Command picker in a Dialog (§8.2.1, no free-text); reused for adding a line AND picking gift nomenclature
          ExcelImportDialog.tsx     #   Excel/CSV bulk import (§8.2.1): campaign select + «Скачать шаблон» + drag-drop/«Вставить пример» + per-row validation preview (Готово/Дубль/Ошибка + reason); imports non-error rows as drafts (pending 1С); full-screen below sm
          CreateCampaignDialog.tsx  #   §10: two-tab Dialog «Новая внеплановая» (тип/название/период, system № промо, ≥3-cal-day deadline guard) / «Встроить в плановую» (existing planned campaign); also edit-mode (prefilled, no tabs) for an unplanned not-yet-sent campaign; full-screen below sm
          LineEditSheet.tsx         #   mobile full-screen «редактировать строку» Sheet — line fields stacked by group (Товар/Цены/Маркетинг) over a read-only context block; reuses EditableCell so edits hit the same store. S4 P3: «Участие в акции» section — КМ «Исключить позицию» / КД confirm·reject / removed·pending state
          WarehousePopover.tsx      #   per-warehouse остаток breakdown + total (§8.2.2, read-only from 1С); native-button trigger beside the editable остаток
          gridFields.ts             #   38-field column dictionary (Appendix C): groups, widths, source→lock (km editable incl. giftNomenclature; auto/1С/calc locked), required
          ColumnGroupToggle.tsx     #   «Колонки N из 5» popover with group checkboxes
        reports/                    # S5 — Отчёты для смежных подразделений (complete)
          ReportsPage.tsx           #   shell: role gate (getReportAccess) + PageHeader + department Tabs (sm+) / Select (mobile) + campaign picker; in-memory marketing-flag store (Map override over advSelectedMarketing) + acknowledge state (per campaign+department: ackAll Set + ackLines Map) + onlyChanged toggle; hosts the VersionHistoryDrawer (versions + buildCampaignReport)
          DepartmentReportView.tsx  #   header strip (получено/версия/17-кал.-дн. OverdueTag/«История версий»/«Только изменённые»/«Ознакомиться со всеми») + ознакомление≠согласование + §11.8 notes; desktop group-header table → Mode-B cards; amber changed-cell ring + emerald added-row tint cleared on acknowledge; marketing leading select column + bulk-select strip + «Согласовать выбор (маркетинг)»; editable «В рекламу (маркетинг)» checkbox for Сотрудник маркетинга, read-only check elsewhere
          reportFields.ts           #   per-department Appendix-C field dictionaries (M wide incl. installment block via installmentTerm/programMonthly; P/A narrow компенсация set) + value accessors; MARKETING_EDITABLE_FIELD
        notifications/              # S6 — Центр уведомлений (complete)
          NotificationsProvider.tsx #   read/unread store (useState seed + acknowledge/acknowledgeMany), useNotifications(); mounted ABOVE the AppShell (in ProtectedLayout) so the bell + nav badge + page share live state
          NotificationsPage.tsx     #   PageHeader (+ «Отметить все прочитанными») + type FilterBar + role-filtered «Непрочитанные» (date-grouped) over a muted «Прочитано» section; empty state
          NotificationItem.tsx      #   one notification row: type icon (tinted) + unread dot, type chip, «отчёт vN», campaign name, description, actor·role·RuDate, quick Link (buttonVariants), per-item «Ознакомлен»
        approvals/                  # S3 — Согласование и проверка (Phases 1–3, complete)
          ApprovalsProvider.tsx     #   review store (useReducer) ABOVE the queue + detail routes; actions approve/reject + requestNonParticipation (КМ→Старший КМ) + setNonParticipationByKd (КД direct, final); kind-aware approve; selectors getItem/queueFor (live-escalation aware)
          ApprovalsPage.tsx         #   role-aware: reviewers get the queue (PageHeader + FilterBar тип/КМ/«только просроченные»), КМ gets «Мои участия», others an explainer
          ReviewQueueTable.tsx      #   Pattern C table (№ промо/тип/название/КМ/отправлено/статус/SLA-таймер + OverdueTag + «Не участвует»/«Авто-передано» tags) → Mode-B MobileListCard list below md
          ApprovalDetailPage.tsx    #   /approvals/:id split view (DetailPageHero + SLA InfoRows; lg:grid-cols-[1fr_340px], sticky actions); effectiveReviewer/canAct via live escalation; «авто-передано» badge + red просрочка note; data vs «Не участвует» branch; КД direct «Не участвует»; hosts the unified ReasonDialog (reject-lines/reject-set/reject-nonpart/kd-set-nonpart) + VersionHistoryDrawer + mobile fixed action bar
          MyParticipationsPanel.tsx #   КМ self-service list of all (campaign, КМ) participations + «Заявить о неучастии» → required-reason ReasonDialog (§4.5.1)
          SubmittedLinesPanel.tsx   #   read-only submitted snapshot; selectable (row/select-all + per-line «Отклонить» X) in reviewer mode; rejection tint + comment tooltip
          ReviewActionsPanel.tsx    #   data vs «Не участвует» actions + КД «Установить Не участвует» + auto-escalation note + «Готовность кампании» advance gate + «Комментарии проверки» log; exports MobileReviewActionBar (fixed bottom, below lg)
        auth/                       # Login, 2FA, ForgotPassword, ResetPassword, AuthLayout, AuthContext (re-export), RequireAuth (re-export)
    components/                     # Promo-specific shared primitives (reused by every screen)
      PromoStatusBadge.tsx          # wraps shared StatusBadge; full status map (Appendix A)
      OverdueTag.tsx                # red «+N дн.» micro-tag, never blocking
      Money.tsx / RuDate.tsx        # wrappers over formatSum / formatDateFull
      ReasonDialog.tsx              # confirm Dialog with required reason Textarea
      VersionHistoryDrawer.tsx      # S4: three-view right Sheet — «Только изменения» (per-field diff + live «Черновик — не отправлено» edit-after-approval draft) / «Полный актуальный отчёт» (live snapshot, removed lines struck) / «История версий» (version list incl. «Отмена»/«Корректировка» from P3 + S3 comments/просрочка + P3 deadlineChange log); footer = re-approval status + Маркетинг/КД actions when a draft exists, else «Создать корректировку» hint. All props optional → backward-compatible with the S3 approvals usage
      DeadlineChips.tsx             # calendar-deadline chips (46/21/17 дн., «календарные»)
    lib/
      promo-mock-data.ts            # seed: 8 campaigns, 6 КМ, 30 SKUs, 7 promo types; S2 PromoLine model + 9 lines, warehouse breakdown, installment + full-calendar-access helpers, isGiftType / missingRequiredFields / isLineValid validators; Phase 3: createPromoLine factory, detectDuplicate (+DuplicateHit), LineHistoryEntry; Phase 4: IMPORT_COLUMNS, buildImportTemplateCsv/buildImportSampleCsv, parseImportCsv (+ParsedImportRow/ImportParseResult), createImportedLine; Phase 5: createUnplannedCampaign (+UnplannedCampaignInput), validateUnplannedInput, minUnplannedStartDate/addCalendarDays/MIN_UNPLANNED_LEAD_DAYS, PromoCampaign.firstSendDone, «Черновик» CampaignStatus; S3: working-days SLA (isWeekend/addWorkingDays/workingDaysBetween/reviewSla, REVIEW_SLA_WORKING_DAYS), ReviewItem (+ReviewComment/LineFeedback, kind data|non-participation), reviewerForKmStatus/buildReviewItems/reviewQueueFor/reviewItemId, approvedKmStatusFor(actor, kind)/REJECTED_KM_STATUS, line seeds L-0010…L-0014 (every pending review item has nomenclature); Phase 3: isAutoEscalated/effectiveReviewer (live SLA-breach escalation), isFinalKmDecision/campaignDecisionSummary (advance gate), participationsForKm/canRequestNonParticipation (КМ panel), one non-participation seed (PR-2026-006~km-6); S4 Phase 1: version model (VersionChangeType, VersionFieldChange, CampaignVersion, CampaignReportRow), getCampaignVersions (seeded chains for PR-2026-001/003 + single-version fallback), buildCampaignReport (live snapshot for «Полный актуальный отчёт»); S4 Phase 2: PromoCampaign.periodChanged, APPROVED_CAMPAIGN_STATUS/isApprovedCampaign, diffCampaignChanges (+CampaignChangeSet: changes/changedCells/hasValueChange/hasAddition/periodChanged), buildSentVersion, 2 seed lines for the approved PR-2026-003 (1+1, km-4) so edit-after-approval is demoable; S4 Phase 3: PromoLine.removed/removalPending/removalReason/removalRequestedBy, PromoCampaign.cancelReason/cancelledBy/cancelledAt/fillDeadlineOverride/deadlineChange, DeadlineChangeRequest, effectiveFillDeadline, canCancelCampaign/canRequestLineRemoval/canApproveLineRemoval/canManageDeadline/canApproveDeadline, buildCancellationVersion/buildLineRemovalVersion, buildCampaignReport removed-aware, seed lines on cancelled PR-2026-004 + approved UN-2026-015 (one removalPending); S5: ReportDepartment + DEPARTMENT_LABELS/DEPARTMENT_SHORT, getReportAccess (+ReportAccess, Appendix D «Отчёты»), getReportDeadline (start − 17 кал. дн.), getSentCampaigns, getReportSentAt/getReportVersionNo, ReportChangeSet + getReportChangeSet (seeded on UN-2026-015), a UN-2026-015 version chain (on-time first send + incremental correction), enriched lines on PR-2026-003 + UN-2026-015 (incl. new L-0021 «added») so the M/P/A subsets populate; S6: NotificationType (6 types) + NOTIFICATION_TYPE_META (label+tint), PromoNotification (+ optional visibleTo roles), buildNotifications (~8 seed, live relative timestamps), notificationsForRole (§11.3.1), groupNotificationsByDate (Сегодня/Вчера/дата)
    styles/                         # index/tailwind/theme/fonts/globals (copied from Dashboard)
```

## Routes

| Route | Component | Status |
|---|---|---|
| `/login` `/login/2fa` `/login/forgot-password` `/login/reset-password/:token` | auth pages | Done (shared mock auth) |
| `/` | → redirects to `/short-calendar` | Done |
| `/short-calendar` | ShortCalendarPage | **Done (S1)** — table + «План акций» mode |
| `/short-calendar/:promoId` | ShortCalendarDetailPage | **Done (S1)** — Pattern D full page |
| `/full-calendar` | FullCalendarPage | **Done (S2 — complete)** — editable Pattern F grid: inline editing, live validation, warehouse popover, bulk-select, functional action bar, nomenclature entry (1С Command picker) + duplicate check + gift picker, Excel/CSV import + 1С availability banner/re-check/submit gate, unplanned-campaign creation + integrate-into-planned + edit-until-first-send, mobile full-screen per-line edit Sheet; **S4 Phases 1–3**: per-campaign «История» button → three-view `VersionHistoryDrawer`; edit-after-approval (baseline diff, amber changed-cell highlight, «N изм. после согл.» badge, draft section, «Ожидает маркетинга» → Маркетинг re-approve → КД «Согласовать и отправить» = live version + incremental send), period change (bold + ✏️); cancellation of campaign (КД, «Отменена») + line exclusion (КМ→КД, «Исключена из акции») + «Скрыть отменённое» switch (ON) + deadline change (КД→ОД, «Изменить дедлайн») |
| `/approvals` | ApprovalsPage | **Done (S3 — Phases 1–3)** — reviewers: review queue (Pattern C / Mode-B) + SLA timer + «Не участвует»/«Авто-передано» tags; КМ: «Мои участия» panel |
| `/approvals/:id` | ApprovalDetailPage | **Done (S3 — Phases 1–3)** — split view: submitted snapshot + per-line/bulk approve·reject + «Не участвует» lifecycle + live auto-escalation + просрочка note + advance gate + comment log/history + mobile action bar |
| `/reports` | ReportsPage | **Done (S5)** — read-only versioned department reports: role-gated Маркетинг/Закуп/Аналитика tabs (Select on mobile) + campaign picker; M/P/A field subsets (table → Mode-B cards); «получено» + 17-кал.-дн. overdue marker + «История версий» drawer + «Только изменённые» highlight + ознакомление (≠ согласование); marketing-only editable «В рекламу» checkbox + bulk-select + «Согласовать выбор» |
| `/notifications` | NotificationsPage | **Done (S6)** — Центр уведомлений: live bell + nav badge + page share one read/unread store (provider above AppShell); 6 notification types, role-based visibility (§11.3.1), date grouping, «Непрочитанные»/«Прочитано» sections, type filter, per-item + bulk «Ознакомлен», quick links |
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
- `app-shell.tsx`: optional `roleSwitcher` prop → role pill + user-menu switcher; nav gating uses the active role (falls back to `config.user.role`). The Promo wrapper drives the existing `maxWidth` prop per-route (`100%` for `/full-calendar`, `1400px` elsewhere) via `useLocation`. **S6**: optional `notificationsHref` prop — when set, the bell popover's «Показать все» button (now a controlled Popover) closes + navigates there; Dashboard omits it → unchanged.
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
