# 🍔 Fatbook

Small app to track calories for personal use.

https://fatbook.pages.dev/

ℹ️ _Use google account to login_

## ▶️ Running app locally

When running app locally, one will connect to my Supabase project (same as here https://fatbook.pages.dev/).

1. Copy `.env.production` to `.env.local`
1. Run `npm install`
1. Run `npm run dev`

## 🛠️ Development

Useful commands

- Prod build: `npm run build`
- Check bundle size: `npx vite-bundle-visualizer`

## 🏭 Infra

- **Cloudflare Pages** - web hosting
- **Supabase** - DB, Auth
- **Google** - Auth Provider

## 📚 History

- [v1](https://github.com/sketchyy/fatbook/tree/v1) - Angular + Firebase
- [v2](https://github.com/sketchyy/fatbook/tree/v2) - React + Firebase
- [v3](https://github.com/sketchyy/fatbook/tree/v3) - React + Supabase

## 🏗️ Creating your own Supabase project 

To use Fatbook with your own Supabase project you need following prerequisites:
- configured Google Cloud project with Oauth ClientID
- configured Supabase project with Fatbook schema (either local or cloud one)

### 1. Setup Google Cloud Project for Authentication

1. Go to the [Google Cloud Platform](https://console.cloud.google.com/home/dashboard) and create a new project if necessary.
1. Create Oauth ClientID
   - API&Services > Credentials > Create Credentials > Oauth ClientID
   - App type: Web
   - Add `http://localhost:3000` to authorized origins
   - Add `http://localhost:54321/auth/v1/callback` to authorized redirect URIs
1. Copy `.env.template`, save it as `.env.local` and fill folowing env variables:
   - Set `SUPABASE_AUTH_GOOGLE_CLIENT_ID` as "Client ID" from Google Cloud project
   - Set `SUPABASE_AUTH_GOOGLE_SECRET` as "Client Secret" from Google Cloud project

Details: https://supabase.com/docs/guides/auth/social-login/auth-google#prerequisites

### 2. Supabase

#### Local Supabase Project

It is possible to develop using locally run Supabase ([supabase/local-development](https://supabase.com/docs/guides/cli/local-development)),

1. Install docker (e.g. docker desktop or rancher desktop)
1. Install [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)
1. Launch Supabase: `supabase start`
1. Supabase will output URLs for resources
   1. Copy "API URL" to `.env.local` as `VITE_SUPABASE_URL`
   1. Copy "anon key" to `.env.local` as `VITE_SUPABASE_ANON_KEY`
1. Reset local DB (this will apply migrations and insert seed data): `supabase db reset --local`
   1. Go to [local Supabase console](http://127.0.0.1:54323) > Table Editor
   1. Make sure there are tables and date (e.g. `dishes` table)
1. Run `npm install`
1. Run `npm run dev`
1. Login with Google account

#### Cloud Project

1. Go to https://supabase.com/ and click "Start your project"
   1. Fill the form, save database password
1. Install [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)
1. Link your project to Fatbook: `supabase link --project-ref <project-id>`
1. Reset remote DB (this will apply migrations and insert seed data): `supabase db reset --linked`
   1. Go to Supabase console > Table Editor
   1. Make sure there are tables and date (e.g. `dishes` table)
1. Add following env variables to `.env.local`:
   1. Set `VITE_SUPABASE_URL` with "Project URL" value from Supabase project home page
   1. Set `VITE_SUPABASE_ANON_KEY` with "API Key" value from Supabase project home page
1. Enable Google Auth provider
   1. Go to Supabase > Authentication > Providers
   1. Enable Google provider
   1. Set Client ID and Client Secret (you can take them from `.env.local` or Google Cloud)
   1. Copy "Callback URL" and add it to Google Cloud to authorized redirect URIs
1. run `npm install`
1. run `npm run dev`
1. Login with Google account

## 🧪 E2E Testing

End-to-end tests use Playwright with real user authentication. Tests run against your actual Supabase instance using a
dedicated test user.

**ℹ️ Note:** A test login form appears on the login page in development mode for E2E authentication. Real users should
use Google authentication.

### Setup

1. Create a test user in your Supabase dashboard (Authentication > Users)
2. Copy `.env.template` to `.env.test` and add your test credentials:
   ```bash
   E2E_TEST_EMAIL=test@example.com
   E2E_TEST_PASSWORD=your_test_password
   ```
3. Install Playwright: `npm run test:e2e:install`

### Running Tests

```bash
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Interactive mode
```

