# AGENTS.md

Shared project instructions for Codex and Claude Code.

## Agent skills

Use Matt Pocock's skills for planning, implementation, debugging, and review.
Project instructions govern test scope and required checks when a skill's
defaults differ.

### Issue tracker

Track work in Linear (Fatbook team, Sketchyy workspace). Before reading,
creating, or updating issues, read `docs/agents/issue-tracker.md`.

### Triage labels

Use the five canonical triage labels. Before triaging issues, read
`docs/agents/triage-labels.md`.

### Domain docs

Use single-context domain docs: root `GLOSSARY.md` and `docs/adr/`.
Before exploring the codebase, read `docs/agents/domain.md`.

## Linear workflow

- Every feature/fix maps to a Linear issue (team **Fatbook**). Reference it in commit messages: `feat(FAT-29): ...`, `fix(FAT-27): ...`.
- Update issue status as work progresses — don't leave it stale in `Backlog`:
  - Move to **In Progress** when starting work on it.
  - Move to **In Review** when the PR is ready for the owner's review.
  - Move back to **In Progress** while addressing requested changes.
  - Move to **Done** after the PR is merged into `main` and the acceptance criteria and required checks are satisfied.
- Before starting a new task, or when asked for status, it's worth double-checking that no completed work is still sitting in `Backlog`/`In Progress` in Linear.

## Git workflow

1. Перед изменениями проверь ветку и состояние рабочего дерева. Для новой задачи создай отдельный worktree и ветку `codex/FAT-<id>-<slug>` от актуального `origin/main`. При продолжении той же задачи используй её существующие worktree и ветку. Сохраняй локальные изменения пользователя; перенос его изменений или коммитов требует явного указания.
2. Реализуй изменения в ветке задачи. Указание навыка «commit to the current branch» относится к этой ветке. Прямые коммиты в `main` запрещены.
3. Выполни обязательные проверки и ревью через `code-review`, исправь найденные проблемы, затем закоммить изменения в ветку задачи. Один PR должен содержать одно самостоятельное изменение, которое можно просмотреть и принять отдельно.
4. Открой PR в `main` по шаблону `.github/pull_request_template.md`. Укажи задачу Linear, что изменилось и почему, результаты проверок и 2–3 ключевых файла в порядке чтения (для меньшего изменения — столько, сколько нужно).
5. Передай пользователю ссылку на готовый PR и дождись его явного решения о merge. Разрешение реализовать задачу, создать коммит или открыть PR не разрешает merge или включение auto-merge. После разрешения проверь актуальные результаты CI и ревью перед merge.

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
npm run typecheck # Check mobile and its shared package imports
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
npx turbo typecheck --filter=@fatbook/mobile --filter=@fatbook/api-client --filter=@fatbook/shared
```

Fix all errors before committing. Do not use `--no-verify`.

## E2E tests

E2E tests hit a real Supabase instance. Require `.env.test` with `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY`. A dev-only email/password login form is rendered on the login page for test authentication. Run `npm run test:e2e:cleanup` to remove test data between runs.
