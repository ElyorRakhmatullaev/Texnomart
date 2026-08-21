# Texnomart — Unified Design System

Global design token reference for all Texnomart sub-projects.
Source of truth for colors, typography, spacing, and component styling.

## Brand Colors

| Token | Value | Usage |
|---|---|---|
| **Primary** | `#FFD60A` | Texnomart yellow — buttons, accents, highlights |
| **Primary Foreground** | `#000000` | Text on yellow backgrounds |
| **Background** | `#ffffff` | Page/app background |
| **Foreground** | `oklch(0.145 0 0)` | Default text color |
| **Card** | `#ffffff` | Card backgrounds |
| **Muted** | `#ececf0` | Muted surfaces |
| **Muted Foreground** | `#717182` | Secondary text |
| **Accent** | `#e9ebef` | Accent surfaces |
| **Destructive** | `#d4183d` | Error/destructive actions |
| **Border** | `rgba(0, 0, 0, 0.1)` | Default borders |

> Yellow is **accent only** — never a large background fill. On-yellow text is always dark (`#000000`).

### Layout Surfaces

| Surface | Color | Notes |
|---|---|---|
| Sidebar | `#ffffff` (`--sidebar`) | White; divider via `--sidebar-border` (light gray) |
| Header / Breadcrumb | `#ffffff` (`bg-background`) | White, sticky top |
| Main content area | `bg-gray-50` (`#f9fafb`) | Subtly gray so white cards stand out (`dark:bg-background`) |

> `--background` (`#ffffff`) remains the base token (body, header, cards). The `<main>` content area overrides it with `bg-gray-50` in the shared AppShell.

## Dark Theme

Activated by the `.dark` class on `<html>`. **Promo** ships a full, QA'd dark theme (sub-project B): a `ThemeProvider` (`Promo/src/app/theme-context.tsx`) + an inline boot script in `index.html` persist `promo:pref-theme` and apply `.dark` before first paint (no FOUC); the header + Settings toggles share the provider via the shared `AppShell`'s optional controlled `theme` prop. **Dashboard** and **Broker** each carry a stock shadcn `.dark` block — note its `--primary` is the stock near-white (`oklch(0.985 0 0)`), NOT the brand yellow — and neither theme is built or verified; their light modes are the source of truth. Brandify `--primary`/`--primary-foreground` first if either is ever taken on.

The `.dark` palette (per project's `theme.css`) is a **layered neutral scale** — `--background` is darkest (the `<main>` area, via `dark:bg-background`), and `--card`/`--popover`/`--sidebar` sit a step lighter so cards read against the page (the inverse of light's white-cards-on-`gray-50`). **The brand yellow is preserved in dark** — never shadcn's stock near-white primary.

| Token | Light | Dark (Promo) |
|---|---|---|
| `--primary` / `--primary-foreground` | `#FFD60A` / `#000000` | **`#FFD60A` / `#000000`** (unchanged — brand) |
| `--background` | `#ffffff` | `oklch(0.16 0 0)` (darkest — main area) |
| `--card` / `--popover` | `#ffffff` | `oklch(0.215 0 0)` (elevated above bg) |
| `--sidebar` | `#ffffff` | `oklch(0.215 0 0)`; active item = brand yellow (`--sidebar-primary`) |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.97 0 0)` |
| `--muted` / `--muted-foreground` | `#ececf0` / `#717182` | `oklch(0.27 0 0)` / `oklch(0.72 0 0)` |
| `--border` | `rgba(0,0,0,0.1)` | `oklch(1 0 0 / 12%)` |
| `--status-*` | see below | same hues, lifted (e.g. `--status-approved` `#10B981` → `#34D399`) |

**Authoring for both themes (hybrid):** prefer semantic token classes that adapt automatically (`bg-card`, `bg-background`, `bg-muted`, `bg-accent`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`/`text-primary`). For a hardcoded light color, KEEP the light class and APPEND a `dark:` variant: `text-gray-900 dark:text-gray-100`, `bg-white dark:bg-card`, `border-gray-200 dark:border-border`. Soft status tints → `bg-X-50 dark:bg-X-500/15` + `text-X-700 dark:text-X-300`. Leave **solid** `-500` fills/dots/bars as-is (vivid on dark). The brand yellow is the `primary` token, not inline hex.

## Status Colors

### Application Lifecycle
| Status | CSS Variable | Hex |
|---|---|---|
| New | `--status-new` | `#3B82F6` |
| Scoring/Pending | `--status-pending` | `#F59E0B` |
| In Progress | `--status-in-progress` | `#8B5CF6` |
| Approved | `--status-approved` | `#10B981` |
| Rejected | `--status-rejected` | `#EF4444` |
| Cancelled | `--status-cancelled` | `#6B7280` |
| Completed | `--status-completed` | `#059669` |
| On Hold | `--status-on-hold` | `#F97316` |
| Returned | `--status-returned` | `#EC4899` |
| Expired | `--status-expired` | `#DC2626` |
| Archived | `--status-archived` | `#9CA3AF` |

## Typography

| Property | Value |
|---|---|
| **Font Family** | Inter (400, 500, 600, 700) |
| **Base Size** | 16px (`--font-size: 16px`) |
| **Font Source** | Google Fonts: `Inter:wght@400;500;600;700` |

### Type Scale
| Element | Size | Weight |
|---|---|---|
| H1 (page title) | `text-2xl` / 24px (md: 32px) | bold (700) |
| H2 (section title) | `text-xl` / 20px | medium (500) |
| H3 | `text-lg` / 18px | medium (500) |
| H4 / label / button | `text-base` / 16px | medium (500) |
| Body | `text-sm` / 14px | normal (400) |
| Caption | `text-xs` / 12px | normal (400) |

### Number Formatting
- Currency: `toLocaleString("ru-RU")` + `" UZS"` or `" сум"`
- Phone: `+998 XX XXX-XX-XX`
- Dates: `date-fns` with `ru` locale
- Tabular numbers: use `tabular-nums` CSS class

## Spacing Scale

```
4px  → gap-1, p-1
8px  → gap-2, p-2
12px → gap-3, p-3
16px → gap-4, p-4
20px → gap-5, p-5
24px → gap-6, p-6
32px → gap-8, p-8
40px → gap-10, p-10
48px → gap-12, p-12
```

- **Page gutters**: 24px (desktop), 16px (mobile)
- **Card padding**: 16-24px
- **Section gaps**: 24px

## Border Radius

| Token | Value |
|---|---|
| `--radius` (base) | `0.625rem` (10px) |
| `--radius-sm` | `calc(var(--radius) - 4px)` |
| `--radius-md` | `calc(var(--radius) - 2px)` |
| `--radius-lg` | `var(--radius)` |
| `--radius-xl` | `calc(var(--radius) + 4px)` |

## Card Styling

- **Background**: `#ffffff`
- **Border radius**: 10px (`--radius`)
- **Shadow**: `0px 2px 4px rgba(204, 204, 204, 0.25)`
- **Border**: `rgba(0, 0, 0, 0.1)`

## Chart Colors

| Token | Value |
|---|---|
| `--chart-1` | `oklch(0.646 0.222 41.116)` |
| `--chart-2` | `oklch(0.6 0.118 184.704)` |
| `--chart-3` | `oklch(0.398 0.07 227.392)` |
| `--chart-4` | `oklch(0.828 0.189 84.429)` |
| `--chart-5` | `oklch(0.769 0.188 70.08)` |

## Tech Stack (Shared)

| Layer | Technology |
|---|---|
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite` plugin, `@import` syntax) |
| **UI Kit** | shadcn/ui (Radix primitives) in `packages/ui/` |
| **Icons** | Lucide React |
| **Charts** | Recharts 2.x |
| **Animations** | tw-animate-css; Motion (Promo) |
| **Build** | Vite 6 + pnpm workspace monorepo |
| **Framework** | React 18 + TypeScript |
| **Routing** | React Router v7 (`createBrowserRouter`) |
| **Dates** | date-fns with the `ru` locale |
| **Toasts** | sonner (Promo adds `closeButton` + 5 s auto-close) |
| **Excel export** | SheetJS (`xlsx`) — Promo only; CSV exports are hand-written |
| **Font** | Inter 400/500/600/700 |

## CSS Architecture

Theme is defined via CSS custom properties in each project's `src/styles/theme.css`:

```css
:root {
  --primary: #FFD60A;
  --primary-foreground: #000000;
  /* ... */
}

@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* ... */
}
```

Tailwind v4 reads these via `@theme inline` — no `tailwind.config.js` needed.

## Responsive Breakpoints

| Breakpoint | Width | Usage |
|---|---|---|
| `sm` | 640px | Small phones |
| `md` | 768px | Tables → card lists transition |
| `lg` | 1024px | Sidebar collapse, modal → sheet |
| `xl` | 1280px | Full desktop layout |

- Touch targets: minimum 44x44px below md
- Tables become card lists below md
- Modals become full-screen Sheets on mobile
- Sidebar collapses to hamburger Sheet below lg

## UI Patterns (Shared)

| Pattern | Description |
|---|---|
| **A** | PageHeader — 64px, H1 + controls |
| **B** | FilterBar — chips with popover filters |
| **C** | DataTable — shadcn Table, sticky header |
| **D** | Detail Page — full route `/entity/:id`, NEVER side drawer |
| **D2** | Config Drawer — Sheet for settings only |
| **E** | Create/Edit Modal — Dialog (full-screen Sheet on mobile) |
| **F** | Frozen Columns — split-pane, NOT sticky on td |
| **G** | Confirmation Dialog — typed confirmation |
| **H** | Status Badge — consistent per domain |
| **I** | Unified States — skeleton, empty, error |
| **J** | Detail Sub-components — InfoRow, Timeline, Tabs |
| **K** | Mobile Responsive — sm/md/lg/xl breakpoints |

### Underline Tabs (Pattern J)

Detail-page tabs use an underline style, not pills:
- **TabsList**: `bg-transparent border-b border-gray-200 rounded-none p-0 h-12 justify-start gap-1 overflow-x-auto overflow-y-hidden`
- **TabsTrigger**: `flex-none` (content-width, NOT stretched), `px-4`, `-mb-px` so the active underline overlaps the list divider
- **Active**: `text-gray-900 dark:text-gray-100 font-semibold` + `border-b-2 border-primary` (the brand-yellow `primary` token, not `border-[#FFD60A]`); **inactive**: `text-gray-500 dark:text-gray-400` with `hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-accent`
- Scroll container holding tabbed content should use `[scrollbar-gutter:stable]` to avoid width shift between tabs.

### Fixed Footer / Action Bar (Detail Pages)

For an always-present bottom action bar that stays pinned (even on short content), use the flex-column pattern:
- Root: `h-full flex flex-col` → scroll area `flex-1 min-h-0 overflow-auto` → bar `shrink-0`
- Requires the AppShell content wrapper to pass `h-full` down (already configured)
- Bar breaks out of `<main>` padding with `-mx-3 -mb-3 md:-mx-4 md:-mb-4` (margins match `<main>`'s `p-3 md:p-4`)
- Buttons stack on mobile (`flex-col sm:flex-row`), 44px touch targets

## Conventions

- All UI text: **Russian** (Русский).
- Colors in component code: prefer **semantic token utility classes** that adapt to dark mode (`bg-primary`/`text-primary` for the brand yellow, `bg-card`/`text-foreground`/`border-border`/`text-muted-foreground`, etc.). Never use arbitrary Tailwind classes like `bg-[#FFDD2D]` or `bg-[#FFD60A]`. Reserve inline `style={{}}` hex for static values that are identical in both themes (e.g. a fixed brand accent, the card shadow); theme-variable colors must go through tokens or `dark:` variants so dark mode works.
- Status badges: soft-tint (light bg + colored text + 1px colored border)
- Loading: skeleton blocks, never spinners
- Empty states: Lucide icon 48px + heading + description + CTA
- shadcn/ui components from `packages/ui/` — DO NOT manually edit
