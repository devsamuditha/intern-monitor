<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# InternTrack

A light, satisfying progress monitoring dashboard for software engineering interns, tech leads, and managers with real-time logging, reviews, tasks, and analytics.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Motion
- **Backend**: Express 4, TypeScript (tsx for dev, esbuild for prod)
- **Database**: PostgreSQL via Supabase, Prisma ORM
- **Auth**: Supabase Authentication (email-based)
- **Storage**: Supabase Storage (screenshots)
- **AI**: Google Gemini API (for smart reviews)
- **Realtime**: Supabase Realtime (live dashboard updates)

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials
2. Install dependencies: `npm install`
3. Run database migrations: `npx prisma migrate dev`
4. Seed the database: `npx prisma db seed`
5. Start dev server: `npm run dev`
6. Open http://localhost:3000

## Production

```powershell
npm run build
npm start
```

## Roles

- **Intern** — Dashboard, daily logs, projects, tasks, discussions
- **Tech Lead** — Team overview, review queue, intern detail, discussions
- **Manager** — Analytics overview, user management, all projects, discussions
