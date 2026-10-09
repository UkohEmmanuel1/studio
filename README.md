# PosterStudio

A browser-based social design studio built with Next.js App Router, TypeScript, Tailwind CSS and Fabric.js.

## Features

- Create designs from common canvas presets or custom dimensions.
- Interactive canvas with editable text, shapes, uploaded images, zoom, object properties, undo/redo and PNG/JPEG export.
- Browser-local draft recovery for anonymous use.
- Multi-account project persistence API and dashboard backed by Supabase Auth, Postgres and private Storage.
- Row-level security policies restrict projects and assets to their owner.
- GitHub Actions verifies TypeScript and the production build on pushes and pull requests.

## Requirements

- Node.js 20+
- npm
- A Supabase project for cloud accounts and cross-device saving (optional for local editor use)

## Local setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open http://localhost:3000. The editor is at /editor, design creation is at /create, sign-in is at /login and the cloud project dashboard is at /dashboard.

## Supabase setup

1. Create a project in the Supabase dashboard.
2. Copy the project URL and anon/publishable key into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Run `supabase/migrations/202610090001_initial_schema.sql` in the Supabase SQL Editor. It creates the projects table, RLS policies, private asset bucket, and per-user asset policies.
4. In Authentication > URL Configuration, set your Site URL to the deployed site and add `http://localhost:3000/auth/callback` and your deployed `/auth/callback` URL to the redirect allow list.
5. Configure the same public environment variables in Vercel. Never expose a service-role key in client code or a `NEXT_PUBLIC_*` variable.

Without Supabase environment variables, the editor remains usable with browser-local drafts and the dashboard explains how to enable cloud storage. Cloud APIs return an explicit configuration error rather than pretending to save.

## Cloud API

- `GET /api/projects`: list the signed-in user's projects.
- `POST /api/projects`: create a project.
- `GET /api/projects/:id`: load one owned project including its JSON document.
- `PATCH /api/projects/:id`: update a project.
- `DELETE /api/projects/:id`: delete an owned project.

All handlers validate input, require a Supabase-authenticated user, and additionally scope database operations to that user. RLS remains enabled as a second layer of authorization.

## Deployment

Import this repository into Vercel and set the Supabase environment variables. Vercel detects Next.js automatically. The GitHub Actions workflow runs type-checking and a production build. A successful CI build is necessary but does not replace smoke tests against a configured Supabase project.

## Current limitations

Cloud authentication, project CRUD endpoints, database migration, and dashboard are wired as an integration foundation. The editor still needs its canvas state fully connected to project IDs and cloud autosave; asset upload policies are prepared, but an end-to-end cloud asset upload flow is not yet implemented. Real-time collaborative editing, billing, team workspaces, and template marketplace are not included. The editor's existing local draft remains available.

Do not use the product for sensitive documents until your deployment, security rules, backups, and privacy terms have been reviewed.
