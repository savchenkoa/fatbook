# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git workflow

Commit directly to `main` — no feature branches, no PRs. The app is not yet published, so branch isolation is unnecessary overhead.

## Roadmap

The source of truth for the project roadmap is the Linear document **"Fatbook — Roadmap"** (team Sketchyy): https://linear.app/sketchyy/document/fatbook-roadmap-3acdfae71c0b — read and update it via the Linear MCP. There is no roadmap file in the repo.

## Commands

Run from repo root (via Turborepo):

```bash
npx turbo dev --filter=web       # Start web dev server on port 3000
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

Mobile app (`apps/mobile/`):

```bash
npm run dev      # expo start
npm run ios      # expo start --ios
npm run android  # expo start --android
```

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
│   ├── web/             # Vite/React web app
│   └── mobile/          # Expo/React Native app
├── packages/
│   ├── shared/          # domain types + utils (date, formatters, food-value)
│   └── api-client/      # Supabase client + all service files
└── supabase/            # migrations + local Supabase config
```

Inside `apps/web/`:

- `src/features/` — page-level feature modules: `eatings`, `dishes`, `dish`, `dish-portions-form`, `insights`, `account`, `auth`, `core`
- `src/components/` — shared components; `ui/` contains primitives (shadcn/ui pattern with Radix + Tailwind)
- `src/hooks/` — custom React hooks, typically wrapping TanStack Query or encapsulating complex state
- `src/actions/` and `src/features/dish/actions/` — form actions used with React's `useActionState`
- `src/context/` — `AuthProvider` (Supabase session) and `ThemeProvider`

Inside `packages/api-client/src/`:

- `supabase.ts` — Supabase client instance
- `*-service.ts` — all Supabase queries/mutations per domain (`eatings-service.ts`, `dishes-service.ts`, `ingredients-service.ts`, `trends-service.ts`, etc.)
- `supabase.types.ts` — generated types, do not edit manually

Inside `packages/shared/src/`:

- `types/` — domain types (`Dish`, `Eating`, `DishPortion`, `FoodValue`, `Meal`, `Settings`, etc.)
- `utils/` — `date-utils.ts`, `formatters.ts`, `food-value-utils.ts`, `is-nil.ts`

### Data flow

**Read path**: Service function (raw Supabase call in `packages/api-client/`) → TanStack Query `useQuery` in a page or custom hook → component render.

**Write path (eatings)**: TanStack Query `useMutation` with optimistic updates (see `use-eating-mutations.ts`), invalidates query cache on settlement.

**Write path (dishes)**: React `useActionState` + an action function in `src/features/dish/actions/` that calls the service directly. Pages use `use-enhanced-action-state.ts` to handle redirects after success.

### Authentication

Google OAuth via Supabase Auth. `AuthProvider` exposes `userId` and session state. `RequireAuth` wraps all authenticated routes. E2E tests use email/password auth with a dedicated test user (configured in `.env.test`).

### Routing

All routes are defined in `apps/web/src/main.tsx`. Authenticated pages are children of `RootLayout` under `RequireAuth`. The insights page uses React Router lazy loading. Routes: `/eatings/:day`, `/eatings/:day/:meal/add`, `/dishes`, `/dishes/:id`, `/dishes/:id/add-ingredients`, `/insights`, `/account`, `/account/goals`, `/account/about`.

### UI components

Follow the shadcn/ui convention: Radix UI primitives styled with Tailwind, assembled in `src/components/ui/`. The `cn()` helper (`src/lib/utils.ts`) merges class names with `clsx` + `tailwind-merge`.

### Supabase types

`packages/api-client/src/supabase.types.ts` is generated — do not edit manually. Run `npm run typegen` (cloud) or `npm run typegen:local` (local) from repo root after schema changes.

### Mobile app

`apps/mobile/` is an Expo (React Native) app that shares `@fatbook/api-client` and `@fatbook/shared` with the web app. Uses React Navigation (bottom tabs + native stack). Read the versioned Expo docs at https://docs.expo.dev/versions/v56.0.0/ before writing any mobile code.

## Before committing

Run from repo root before every commit:

```bash
npx turbo lint typecheck test --filter=web
```

Fix all errors before committing. Do not use `--no-verify`.

## E2E tests

E2E tests hit a real Supabase instance. Require `.env.test` with `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`. A dev-only email/password login form is rendered on the login page for test authentication. Run `npm run test:e2e:cleanup` to remove test data between runs.
