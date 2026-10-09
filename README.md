# PosterStudio

PosterStudio is a browser-based social poster design studio built with Next.js App Router, React, TypeScript, Tailwind CSS, and Fabric.js.

## Current implementation

- Responsive marketing page with template examples, feature overview, pricing preview, FAQs, and legal starter pages.
- Interactive Fabric.js canvas editor with editable text, rectangles, circles, lines, image upload, selection, movement, resize/rotation handles, object colour/opacity/font controls, and canvas-size presets.
- PNG and JPEG exports at the canvas document dimensions.
- Browser-local draft saving and restore on reload.
- Keyboard shortcuts: Delete/Backspace removes the selected object, Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z redo, and Ctrl/Cmd+D duplicate.
- Image uploads accept PNG, JPEG, and WebP, up to 8 MB.

## Requirements

- Node.js 20 or newer recommended
- npm

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000. Open the editor at http://localhost:3000/editor.

## Scripts

- `npm run dev` — start the development server.
- `npm run build` — production build.
- `npm start` — run the production server after building.
- `npm run typecheck` — TypeScript check.
- `npm run lint` — Next.js lint command (depends on the installed Next.js CLI version).

## Environment variables

Copy `.env.example` to `.env.local` if you are preparing the future cloud integration. The current app does not read these values: Supabase authentication, PostgreSQL project storage, and Supabase Storage have not been integrated. Never put a service-role key in a `NEXT_PUBLIC_*` variable.

## Persistence and privacy

Drafts are saved in local storage in the current browser only. They do not synchronise between devices or accounts. Clearing browser storage will remove the local draft. Do not use this starter to store sensitive content. The privacy and terms pages are starter text and require legal review before public launch.

## Product and deployment status

This is a functional editor starter, not yet the complete multi-tenant SaaS described in the product specification. Cloud authentication, server-side project ownership, database migrations/RLS, cloud asset storage, real billing, team collaboration, brand kits, and AI generation are not implemented. Pro and Team pricing cards are informational previews only; no payments are collected.

For deployment, connect the repository to Vercel, configure the project with the Node.js runtime, install dependencies, and use `npm run build` as the build command. Run the type-check and production build in CI before treating the deployment as production-ready.

## Security notes

- Uploaded images are checked against a MIME allowlist and an 8 MB size limit in the browser. A production cloud upload endpoint must independently inspect file content and enforce quotas server-side.
- Browser local storage is not an account-based backup.
- Do not add real credentials to Git. Keep local secrets in `.env.local` and configure deployment secrets in the hosting provider.
