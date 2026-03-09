# FRONTEND GENESIS: High-Performance Glassmorphism Stack

This stack prioritizes aesthetics (Apple-inspired), developer experience (Indentify patterns and suggest refactors), and performance.

## Workflow

Do not run `npm run build` or `npm run lint`. 

## 🏗️ Core Technical Stack

- **Framework**: Next.js (Pages Router) - Proven stability and SEO.
- **Language**: TypeScript (Strict Mode) - Mandatory for reliable data flows.
- **Styling**: Tailwind CSS v4 - Optimized for high-density and modern CSS features.
- **Linter/Formatter**: Biome - Fast, unified tool for code quality.
- **Icons**: Lucide React - Minimalist and consistent.
- **Notifications**: Sileo - Object-based, beautiful toast system.
- **State**: React Context API + Custom Hooks - Single source of truth.
- **Data Fetching**: Use TanStack Query for complex caching and auto-retries.
- **Data Validation**: Use Zod for API response validation and type safety.
- **Backend Proxy**: Next.js API routes with a proxy layer for secure external API calls.
- **Supabase**: For authentication and real-time data needs, integrated via API routes. The user MUST ba authenticated in the supabase cli.

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
4. **Platform Native**: Sidebar for desktop, bottom-drawer or compact header for mobile.

## 🛠️ Advanced Development Patterns

### 1. Context-Driven Data Flow

- **Provider**: Wraps the layout to handle global fetch and caching.
- **Custom Hook**: `useData()` provides state, setters, and refetching.
- **Atomic Components**: Components should be independent and subscribe only to the data they need via the hook.

### 2. Proxy-Based Security (Next.js 16)

- Use `src/proxy.ts` for network boundary checks.
- Handle session via HTTP-only cookies.
- Protect both Pages and API routes in a single standard matcher.

## 📝 Best Practices for AI Agents

2. **Safety**: Implement "Null-Safe" rendering using `(value ?? 0).toLocaleString()`.
3. **Modularity**: If a file exceeds 150 lines, extract logical UI blocks to `/src/components`.
