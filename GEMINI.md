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

## 🎨 Design System: "The Glass Standard"

The "Genesis" aesthetic is defined by elements that levitate and interact with light.

### Glassmorphism Utility (Tailwind)

```bash
# Light Mode
bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl rounded-3xl

# Dark Mode
dark:bg-zinc-900/60 dark:border-zinc-800/50 dark:shadow-2xl
```

### UX Principles

1. **High Density**: Prefer `p-4` or `p-6` over `p-10`. Content should be visible without excessive scrolling.
2. **Stable Layouts**: Use fixed-height skeletons during loading. Avoid "jumping" UI elements.
3. **Interactive Feedback**: All calculations should be traceable (clickable cards with detail modals).

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