# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Roadmap

The source of truth for the project roadmap is the Linear document **"Fatbook — Roadmap"** (team Sketchyy): https://linear.app/sketchyy/document/fatbook-roadmap-3acdfae71c0b — read and update it via the Linear MCP. There is no roadmap file in the repo.

## Commands

Run from repo root (via Turborepo):

```bash
npx turbo dev --filter=web       # Start dev server on port 3000
npx turbo build --filter=web     # Type-check + Vite build (output: apps/web/build/)
npx turbo lint --filter=web      # ESLint
npx turbo typecheck --filter=web # TypeScript check only
npx turbo test --filter=web      # Vitest unit tests
npm run typegen                  # Regenerate Supabase types from cloud project
npm run typegen:local            # Regenerate Supabase types from local Supabase instance
```

Or from `apps/web/` directly:

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Type-check + Vite build
npm run test:e2e     # Playwright E2E tests (requires .env.test)
npm run test:e2e:cleanup  # Remove E2E test data
```

To run a single Vitest test file: `cd apps/web && npx vitest run src/path/to/file.test.ts`

Local Supabase (run from repo root):
```bash
supabase start              # Start local Supabase (requires Docker)
supabase db reset --local   # Apply migrations + seed data
```

## Architecture

**Stack**: React 19, TypeScript, Vite, Tailwind CSS v4, Supabase (Postgres + Auth), TanStack Query v5, React Router v6.
**Monorepo**: npm workspaces + Turborepo. Apps in `apps/`, shared packages in `packages/`.

**Path alias**: `@/` maps to `apps/web/src/`.

### Directory structure

```
fatbook/
├── apps/
│   └── web/             # Vite/React web app
├── packages/
│   ├── shared/          # shared types + utils (populated in SKE-20)
│   └── api-client/      # Supabase client + services (populated in SKE-21)
└── supabase/            # migrations + local Supabase config
```

Inside `apps/web/`:

- `src/features/` — page-level feature modules (eatings, dishes, dish, insights, account, auth, core)
- `src/components/` — shared components; `ui/` contains primitives (shadcn/ui pattern with Radix + Tailwind)
- `src/services/` — all Supabase queries/mutations; one file per domain (`eatings-service.ts`, `dishes-service.ts`, etc.)
- `src/hooks/` — custom React hooks, typically wrapping TanStack Query or encapsulating complex state
- `src/actions/` and `src/features/dish/actions/` — form actions used with React's `useActionState`
- `src/context/` — `AuthProvider` (Supabase session) and `ThemeProvider`
- `src/types/` — domain types (`Dish`, `Eating`, `DishPortion`, etc.) plus generated `supabase.types.ts`
- `supabase/migrations/` — SQL migration files applied via Supabase CLI (root level)

### Data flow

**Read path**: Service function (raw Supabase call) → TanStack Query `useQuery` in a page or custom hook → component render.

**Write path (eatings)**: TanStack Query `useMutation` with optimistic updates (see `use-eating-mutations.ts`), invalidates query cache on settlement.

**Write path (dishes)**: React `useActionState` + an action function in `src/features/dish/actions/` that calls the service directly. Pages use `use-enhanced-action-state.ts` to handle redirects after success.

### Authentication

Google OAuth via Supabase Auth. `AuthProvider` exposes `userId` and session state. `RequireAuth` wraps all authenticated routes. E2E tests use email/password auth with a dedicated test user (configured in `.env.test`).

### Routing

All authenticated pages are children of `RootLayout` under `RequireAuth`. The insights page uses React Router lazy loading (`lazy: () => import(...)`). Routes follow the pattern `/eatings/:day`, `/eatings/:day/:meal/add`, `/dishes/:id`, etc.

### UI components

Follow the shadcn/ui convention: Radix UI primitives styled with Tailwind, assembled in `src/components/ui/`. The `cn()` helper (`src/lib/utils.ts`) merges class names with `clsx` + `tailwind-merge`.

### Supabase types

`apps/web/src/types/supabase.types.ts` is generated — do not edit manually. Run `npm run typegen` (cloud) or `npm run typegen:local` (local) from repo root after schema changes.

## E2E tests

E2E tests hit a real Supabase instance. Require `.env.test` with `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`. A dev-only email/password login form is rendered on the login page for test authentication. Run `npm run test:e2e:cleanup` to remove test data between runs.
