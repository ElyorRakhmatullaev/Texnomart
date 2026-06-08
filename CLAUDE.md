# Texnomart Monorepo

Monorepo containing Texnomart web applications. Both projects share a unified design system and component library.

**Figma source**: `https://www.figma.com/design/23kqh6Bgib8vYPsQx50xPh/Texnomart-AI-Dashboard`

## Projects

| Project | Path | Description |
|---|---|---|
| **Dashboard** | `Dashboard/` | BNPL credit broker admin panel (14 pages, React Router) |
| **Promo** | `Promo/` | Promotional campaign calendar system (8 modules) |
| **Shared UI** | `packages/ui/` | shadcn/ui component library (48 components) |

## Tech Stack

- **Runtime**: React 18 + TypeScript
- **Build**: Vite 6, pnpm workspace monorepo
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`, `@import` syntax — NO `tailwind.config.js`)
- **UI Kit**: shadcn/ui (Radix primitives) — shared via `@texnomart/ui` workspace package
- **Charts**: Recharts 2.x
- **Icons**: Lucide React
- **Font**: Inter (400, 500, 600, 700)
- **Primary Color**: `#FFD60A` (Texnomart yellow)

## Monorepo Structure

```
Texnomart/
├── .claude/                    # Shared Claude commands & rules
├── .git/
├── .gitignore
├── CLAUDE.md                   # This file
├── styles-config.md            # Unified design token reference
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # Workspace definition
├── packages/
│   └── ui/                     # @texnomart/ui — shared shadcn/ui components
│       ├── package.json
│       └── src/                # 48 component files + utils.ts
├── Dashboard/                  # Dashboard app
│   ├── CLAUDE.md               # Dashboard-specific context
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
└── Promo/                      # Promo app
    ├── CLAUDE.md               # Promo-specific context
    ├── package.json
    ├── vite.config.ts
    └── src/
```

## Commands

```bash
pnpm install                    # Install all dependencies
pnpm dev:dashboard              # Start Dashboard dev server
pnpm dev:promo                  # Start Promo dev server
pnpm dev                        # Start both dev servers
pnpm build:dashboard            # Build Dashboard
pnpm build:promo                # Build Promo
pnpm build                      # Build all projects
```

## Shared UI Package (`@texnomart/ui`)

48 shadcn/ui components in `packages/ui/src/`. Both apps import from `@texnomart/ui/`:

```typescript
import { Button } from "@texnomart/ui/button"
import { Card, CardContent } from "@texnomart/ui/card"
import { cn } from "@texnomart/ui/utils"
```

**DO NOT** manually edit files in `packages/ui/src/` — they are shadcn/ui auto-generated primitives.

### Path Aliases

Both apps configure in `vite.config.ts`:
- `@` → `./src` (project-local sources)
- `@texnomart/ui` → `../packages/ui/src` (shared components)

### Tailwind Content Scanning

Each app's `src/styles/tailwind.css` includes the shared package:
```css
@source '../../../packages/ui/src/**/*.{js,ts,jsx,tsx}';
```

## Design System

See `styles-config.md` for the complete design token reference.

Key values:
- **Primary**: `#FFD60A` (yellow), foreground `#000000`
- **Font**: Inter, base 16px
- **Border radius**: 0.625rem (10px)
- **Spacing**: 4/8/12/16/20/24/32/40/48px

## Language & Locale

- Dashboard: All UI text in **Russian** (Русский)
- Promo: **Bilingual** — Russian primary, English secondary (muted)
- Currency: UZS / сум
- Phone: `+998 XX XXX-XX-XX`
- Dates: `date-fns` with `ru` locale

## Project-Specific Docs

- `Dashboard/CLAUDE.md` — Dashboard routes, patterns, mock data
- `Promo/CLAUDE.md` — Promo modules, business entities, roles
- `Dashboard/docs/` — AI context, prompt pack specs
- `Promo/docs/` — AI context

## Custom Commands

| Command | Purpose |
|---|---|
| `/start_task` | Load context, review state, propose approach |
| `/doc_sync` | Scan project, update documentation |
| `/commit` | Group changes by topic, create commits |
| `/ux-analysis` | UX audit of Figma designs |
| `/ux-designer` | Expert UX analysis via subagent |
