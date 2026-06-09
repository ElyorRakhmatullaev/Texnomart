# Design Layer Rules — Texnomart Monorepo

## Figma Integration
- Use Figma MCP tools to get current design state when implementing new screens
- Figma source: `https://www.figma.com/design/23kqh6Bgib8vYPsQx50xPh/Texnomart-AI-Dashboard`

## Design Tokens (Unified)
- **Primary**: `#FFD60A` (yellow), foreground `#000000`
- **Font**: Inter (400, 500, 600, 700), base 16px
- **Card specs**: white bg, 10px radius (`--radius: 0.625rem`), shadow `0px 2px 4px rgba(204,204,204,0.25)`
- **Spacing scale**: 4/8/12/16/20/24/32/40/48px
- **Status colors**: defined as `--status-*` CSS variables in each project's `src/styles/theme.css`
- Yellow is **accent only** — never a large background fill. On-yellow text is always dark (`#000000`).
- See `styles-config.md` for full token reference.

## Component Conventions
- Use shadcn/ui components from `@texnomart/ui/` (packages/ui/) — DO NOT manually edit
- Use Lucide React for icons
- Charts use Recharts — follow existing patterns
- Numbers: `toLocaleString("ru-RU")` with `tabular-nums` class
- Currency: UZS, formatted as `4 200 000 UZS` or `1 299 000 сум`
- Colors in code: exact hex via `style={{}}`, never Tailwind arbitrary classes like `bg-[#FFDD2D]`

## Language
- All text in **Russian** (Русский)

## UI Patterns (Shared Across Projects)
- **Page title (H1)**: `text-2xl md:text-[32px] font-bold leading-tight text-gray-900`
- **Pattern A** — PageHeader: 64px, H1 + controls
- **Pattern B** — FilterBar: chips with popover filters
- **Pattern C** — DataTable: shadcn Table in Card, sticky header
- **Pattern D** — Detail Page: full route `/entity/:id` with back nav, hero band, tabs — NEVER side drawers
- **Pattern D2** — Config Drawer: side drawers only for settings/config panels
- **Pattern E** — Create/Edit Modal: Dialog 560-720px (full-screen Sheet on mobile)
- **Pattern F** — Frozen Columns: split-pane layout (two synced divs), NOT `position: sticky` on `<td>`
- **Pattern G** — Confirmation Dialog: AlertTriangle + typed confirmation
- **Pattern H** — Status Badge: consistent soft-tint styling per domain
- **Pattern I** — Unified States: skeleton loading, empty, error
- **Pattern J** — Detail Sub-components: InfoRow, Timeline, Tabs
- **Pattern K** — Mobile Responsive: sm/md/lg/xl breakpoints, tables→card lists, 44px touch targets

## Mobile Responsiveness (Pattern K)
- Breakpoints: sm(640)/md(768)/lg(1024)/xl(1280)
- Tables → card lists below md (3-4 most important fields per card)
- Modals → full-screen Sheets on mobile
- Touch targets minimum 44×44px
- Sidebar → hamburger Sheet below lg
- Charts resize to container, legends below

## Loading & States
- Loading: Skeleton blocks matching final shape, never spinners
- Empty states: Lucide icon 48px + heading + description + CTA button
- Error states: icon + message + "Повторить" button

## New Sub-Project Styling
- Copy `src/styles/` structure from an existing project (index.css, tailwind.css, theme.css, fonts.css)
- Include `@source` for `packages/ui/` in tailwind.css
- Reuse the same CSS variables and theme tokens
- All design rules in this file apply to every sub-project
