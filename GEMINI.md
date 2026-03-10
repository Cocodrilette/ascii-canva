# 🎨 ascii_canva

> Built on the **Frontend Genesis** stack — glassmorphism UI, type-safe data flows, and secure proxy architecture.

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (Pages Router) |
| Language | TypeScript (Strict) |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Notifications | Sileo |
| State | React Context + Custom Hooks |
| Data Fetching | TanStack Query |
| Validation | Zod |
| Auth & Realtime | Supabase |
| Linter | Biome |

---

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase CLI (authenticated)

```bash
supabase login
```

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── components/       # Atomic UI components (<150 lines each)
├── context/          # React Context providers
├── hooks/            # Custom hooks (useData, useAgent, etc.)
├── pages/
│   ├── api/          # Next.js API routes (proxy layer)
│   └── index.tsx     # Entry point
├── proxy.ts          # Network boundary + session handling
└── lib/
    ├── supabase.ts   # Supabase client
    └── schemas.ts    # Zod validation schemas
```

---

## Architecture

### Data Flow

```
UI Component
    └── useData() hook
            └── TanStack Query
                    └── /pages/api/* (proxy)
                            └── External API / Supabase
```

### Security

All external API calls go through `src/proxy.ts`. Sessions are managed via HTTP-only cookies. API keys are never exposed to the client.

### Design System

Components follow the **Retro OS Standard** — inspired by classic operating systems (Win95, Mac OS 8, early UNIX terminals).

#### Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--os-bg` | `#C0C0C0` | Window backgrounds |
| `--os-surface` | `#FFFFFF` | Input fields, content areas |
| `--os-titlebar` | `#000080` | Active window title bars |
| `--os-titlebar-text` | `#FFFFFF` | Title bar labels |
| `--os-border-light` | `#FFFFFF` | Raised bevel (top/left) |
| `--os-border-dark` | `#808080` | Sunken bevel (bottom/right) |
| `--os-accent` | `#000080` | Selected items, CTAs |
| `--os-terminal` | `#0D0D0D` | Terminal/log panels |
| `--os-green` | `#00FF41` | Terminal cursor, status indicators |

#### Window Chrome

```css
/* Raised panel (buttons, cards) */
border-top: 2px solid #FFFFFF;
border-left: 2px solid #FFFFFF;
border-right: 2px solid #808080;
border-bottom: 2px solid #808080;
background: #C0C0C0;

/* Sunken panel (inputs, wells) */
border-top: 2px solid #808080;
border-left: 2px solid #808080;
border-right: 2px solid #FFFFFF;
border-bottom: 2px solid #FFFFFF;
background: #FFFFFF;

/* Title bar */
background: #000080;
color: #FFFFFF;
font-family: 'VT323', 'Courier New', monospace;
font-size: 12px;
padding: 2px 4px;
```

#### Typography

| Role | Font | Size |
|------|------|------|
| UI Labels | `'MS Sans Serif', sans-serif` | 11px |
| Title bars | `'VT323', monospace` | 13px |
| Terminal output | `'Courier New', monospace` | 13px |
| Body text | `'Times New Roman', serif` | 14px |

#### UX Principles

1. **No blur, no transparency** — all surfaces are fully opaque with hard bevel borders.
2. **8px grid** — spacing in multiples of 8; no fractional values.
3. **Cursor** — use `cursor-default` everywhere except links (`cursor-pointer` with a classic arrow, not a hand on interactive widgets).
4. **Loading states** — use a blinking `█` cursor or a classic progress bar (segmented, not a smooth fill).
5. **Modals** — styled as draggable OS dialog boxes with a title bar, close button (`✕`), and raised content area.

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EXTERNAL_API_KEY=
```

---

## Development Guidelines

- **Files > 150 lines** → extract to `/src/components`
- **Null safety** → always use `(value ?? 0).toLocaleString()`
- **No `npm run build` or `npm run lint`** during development — Biome handles it on save
- **Loading states** → use fixed-height skeletons to prevent layout shift

---

## License

MIT