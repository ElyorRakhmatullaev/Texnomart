# Texnomart AI Dashboard — Consolidated Documentation

> Source: Figma Make prompts exported to `src/imports/pasted_text/`

## Design Specification Sources

| Document | Location | Contents |
|---|---|---|
| UI Patterns | `src/imports/pasted_text/ui-patterns.md` | Reusable patterns A-J (PageHeader, FilterBar, DataTable, Detail Page, Modal, Bulk Actions, Confirmation, Status Badges, Unified States, Detail Sub-components) |
| Prompt Pack Part 2 | `docs/dashboard_prompt_pack_part2.md` | Extended patterns A-K + 14 prompts for all remaining routes (includes Pattern D: Detail Page, Pattern D2: Config Drawer, Pattern K: Mobile Responsiveness) |
| Applications Module | `src/imports/pasted_text/applications-module.md` | Full spec for `/applications` list, kanban, detail page, mock data schema |
| Guidelines Template | `guidelines/Guidelines.md` | Empty template for custom design system guidelines |

## Business Domain

**Texnomart** is an Uzbekistan electronics retailer operating a **BNPL (Buy Now Pay Later) credit broker** platform. The dashboard manages:

- **Applications (Заявки)**: Installment plan requests from customers, routed to partner banks/fintech companies for scoring and approval
- **Partners (Партнёры)**: Financial institutions (Alif Nasiya, Uzum Nasiya, Anorbank, Kapitalbank, Ipoteka Bank) that provide credit decisions
- **Branches (Филиалы)**: Physical retail locations across Uzbekistan where applications originate
- **Clients (Клиенты)**: End customers applying for installment plans
- **Operators**: Staff members who process and manage applications

### Application Lifecycle (11 statuses)
```
Новая → На скоринге → [Одобрена | Частично одобрена | Отклонена]
                     → В работе у оператора → Ожидает документы
                     → Подписан договор → Завершена
                     → Отменена | Просрочена
```

### Key Metrics
- Total clients, applications per 24h/3h, conversion rate
- Total installment amount issued (in UZS billions)
- Average check amount
- Active clients count
- Average scoring time (seconds)

## Module Implementation Roadmap

### Done
- [x] Dashboard — KPIs (compare toggle shows/hides sparklines), charts with synced period filters, interactive partner donut, navigable recent applications, scrollable row-based layout, **KPI drill-down pages** (`/dashboard/:metricId`) with trend charts, breakdown tables, and related metrics
- [x] Applications — table, kanban, detail page
- [x] Auth — login, 2FA, forgot/reset password (fully routed with mock auth state + guards)
- [x] App Shell — sidebar, header, breadcrumbs, search command
- [x] Clients — list (table + mobile cards, search, filters, pagination, bulk actions) + detail page (5 tabs: Профиль, Финансы, Заявки, Активность, Комментарии и теги)
- [x] Partners — list (cards + table views, filters, status toggles) + detail page (6 tabs: Обзор, Условия, API, Финансы, Статистика, История)
- [x] Branches — list (table + map views, search, filters) + detail page (5 tabs: Общая информация, Сотрудники, Партнёры, Приоритеты with drag-and-drop, Статистика)
- [x] Users — list (table + mobile cards, filters, sync panel, invite modal) + detail page (5 tabs: Информация, Безопасность, Сессии, Активность, Статистика)
- [x] Analytics — dense data page (KPI grid with click-to-focus, main chart with line/bar/area toggle, control bar with period/grouping, grouping table with 8 dimensions, cohort heatmap, reports panel with generated/scheduled/templates, create report wizard)
- [x] Telegram Bot — 6-tab management page (settings with token/webhook/welcome message, 15 message templates with categories, broadcasts with 5-step wizard, 20 subscribers with filters, analytics with KPIs/charts/funnel/retention, FAQ + auto-replies)
- [x] Notifications — day-grouped notification list with filter bar (status/type/severity), settings drawer (quiet hours, channel matrix, digests), 30 mock notifications
- [x] Audit (`/audit`, `/audit/:id`) — 4-tab page (user actions, system logs, integration logs, security alerts) + detail with diff viewer, 50 mock entries
- [x] Settings (`/settings`) — 6-section Superadmin page (general, localization, integrations, security, API/webhooks, backup) with left-rail nav

- [x] Profile (`/profile`) — 5-tab personal profile page (info, security, notifications, sessions, interface) with left-rail nav, change password/2FA setup dialogs

### Not Started
- [ ] API integration layer
- [ ] Real-time WebSocket updates
- [ ] i18n (Uzbek language support)
- [ ] Yandex Maps integration for geography widget
- [ ] Export functionality (CSV, XLSX, PDF)
- [ ] Role-based access control (RBAC) beyond sidebar filtering
- [ ] Mobile responsiveness — nearly complete (Dashboard/AppShell, Profile, Applications detail, Clients, Partners, Branches, Users, Analytics, Telegram, Notifications, Audit, Settings have Pattern K; ApplicationsPage list pending)

## Design System Reference

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| `--primary` | `#FFD60A` | Brand yellow, CTAs, active states, sparkline accent |
| `--primary-foreground` | `#000000` | Text on primary surfaces |
| `--destructive` | `#d4183d` | Danger actions, error states |
| `--background` | `#ffffff` | Page background |
| `--muted` | `#ececf0` | Disabled, secondary surfaces |
| `--border` | `rgba(0,0,0,0.1)` | Subtle borders |

### Status Colors
See `src/styles/theme.css` for full `--status-*` variable definitions.
See `src/lib/applications-mock-data.ts` for `APPLICATION_STATUSES` badge styling (bg + text class pairs).

### Typography
- Font: Inter (Google Fonts)
- Weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- Base: 16px
- Scale follows Tailwind defaults (text-xs through text-4xl)

### Spacing
4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 px

### Shadows
- Card default: `0px 2px 4px rgba(204, 204, 204, 0.25)`
- Card hover: `shadow-md` (Tailwind)
- Floating toolbar: `shadow-2xl`

## Navigation Structure

```
Sidebar:
├── Дашборд          /
├── Аналитика        /analytics
├── Заявки [12]      /applications
├── Клиенты          /clients
├── Партнёры         /partners
├── Филиалы          /branches
├── Пользователи     /users
├── Telegram-бот     /telegram
├── Уведомления [3]  /notifications
├── ── Система ──
├── Аудит            /audit        (Admin+)
└── Настройки        /settings     (Superadmin)
```
