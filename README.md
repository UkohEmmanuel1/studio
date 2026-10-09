# PosterStudio

A browser-based social design studio built with Next.js App Router, TypeScript, Fabric.js and Supabase.

## Features

- Create designs from common canvas presets or custom dimensions.
- Interactive canvas with editable text, shapes, image uploads, zoom, object properties, undo/redo and PNG/JPEG export.
- Browser-local draft recovery for anonymous use.
- Supabase email/password authentication and a cloud project dashboard.
- Project create, read, update and delete endpoints with per-user ownership checks.
- Private Supabase Storage for image assets, per-user storage policies, and short-lived signed URLs.
- Row-level security (RLS) policies for projects and stored assets.
- GitHub Actions CI for TypeScript and production builds.

## Requirements

- Node.js 20+
- npm
- A Supabase project for cloud accounts, projects and cross-device image access (optional for local editor use)

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
3. Run `supabase/migrations/202610090001_initial_schema.sql` in the Supabase SQL Editor. It creates the projects table, RLS policies, a private `design-assets` bucket, and per-user storage policies.
4. In Authentication > URL Configuration, set your Site URL to the deployed site and add `http://localhost:3000/auth/callback` and your deployed `/auth/callback` URL to the redirect allow list.
5. Configure the same public environment variables in Vercel. Never expose a service-role key in client code or a `NEXT_PUBLIC_*` variable. This app does not require a service-role key.

Without Supabase environment variables, the editor remains usable with browser-local drafts and the dashboard explains how to enable cloud storage. Cloud API routes return explicit configuration errors rather than pretending to save.

## Cloud routes

- `GET /api/projects`: list the signed-in user's projects.
- `POST /api/projects`: create a project.
- `GET /api/projects/:id`: load one owned project including its JSON document.
- `PATCH /api/projects/:id`: update an owned project.
- `DELETE /api/projects/:id`: delete an owned project.
- `POST /api/assets`: validate and upload an image to the user's private storage folder.
- `GET /api/assets?path=...`: issue a short-lived signed URL only for an asset under the signed-in user's folder.

All handlers validate input, require a Supabase-authenticated user, and scope operations to that user. Database and Storage RLS policies provide a second authorization layer. Image files are restricted to PNG, JPEG and WebP, up to 8 MB.

## Deployment

Import this repository into Vercel and set the Supabase environment variables. Vercel detects Next.js automatically. GitHub Actions runs TypeScript checking and a production build on pushes and pull requests to `main`. A successful CI build does not replace smoke tests against a configured Supabase project.

## Important limitations

This is a SaaS foundation, not a full Canva replacement. The editor has a single-page document model today; multiple artboards/pages, reusable template creation, billing, team workspaces, real-time collaboration, and a full brand-kit manager are not implemented. Cloud saves are user-triggered from the editor's Save button; ordinary editing continues to use the existing local draft autosave. Anonymous image uploads remain local, while signed-in uploads can be stored privately and restored when the project is reopened.

Before launch, test email confirmation and password recovery, storage limits, database backups, deployment environment variables, abuse/rate limits, privacy terms, and the entire flow in a real Supabase project.
