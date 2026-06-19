# Candidate Screen — Architecture

## Recommendation: single Next.js app

For a full-platform greenfield build, one **Next.js 15 App Router** application is the right call:

- **Shared design system** across marketing, auth, recruiter console, and candidate recorder
- **One deployment** and one Postgres database to start
- **Route groups** keep concerns separated without monorepo overhead
- **Split later** if the candidate bundle needs isolation (e.g. separate subdomain)

A monorepo (`apps/web` + `apps/candidate` + `packages/ui`) adds coordination cost early. Revisit when traffic, team size, or bundle size justify it.

## Route map

| Route | Audience | Auth |
|-------|----------|------|
| `/` | Marketing landing | Public |
| `/contact` | Contact form | Public |
| `/login`, `/register`, `/reset` | Recruiter auth | Public |
| `/app/*` | Recruiter console | Session cookie |
| `/i/[token]` | Candidate recorder | Invite token |

## Stack

- **Framework:** Next.js 15 + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 + design tokens from handoff
- **Database:** PostgreSQL + Prisma
- **Auth (v1):** Email/password only — custom sessions in Postgres (no SSO yet)
- **Icons:** Lucide
- **Charts:** Recharts (analytics)

## Build phases

1. ✅ **Foundation** — tokens, UI primitives, layouts, routes, Prisma schema, email auth
2. ✅ **Candidate recorder** — MediaRecorder flow, error states, responsive layouts
3. ✅ **Recruiter console** — dashboard data, pipeline, review, build interview, interviews index
4. ✅ **Analytics + settings + billing** — charts, workspace settings, billing UI
5. ✅ **Marketing polish** — full landing sections, contact form backend
6. **Integrations** — video storage (S3/R2), transcription API, email delivery (Resend/Postmark), Stripe payments

## Deferred (per your decisions)

- Google / Microsoft SSO
- Practice / warm-up question screen
- ID check feature

## Getting started

```bash
cp .env.example .env
# Set DATABASE_URL and AUTH_SECRET

npm install
npx prisma generate
npx prisma db push

npm run dev
```

Open http://localhost:3000

## Design reference

Hi-fi mocks live in `design_handoff_candidate_screen/designs/`. See that folder's `README.md` for tokens, copy, and interaction specs.
