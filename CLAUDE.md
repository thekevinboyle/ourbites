# OurBiteMarks - Content Management Dashboard

## Project Overview

Social media content management dashboard for Instagram and TikTok. Single-user, no authentication. Mock data with Buffer integration path.

## Tech Stack

- **Framework:** Next.js 15 (App Router) with TypeScript
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui (Radix UI primitives)
- **Charts:** Recharts
- **Tables:** TanStack Table
- **Server State:** TanStack Query
- **Client State:** Zustand
- **Database:** Supabase (Postgres)
- **Drag & Drop:** @dnd-kit
- **Package Manager:** pnpm
- **Deployment:** Vercel

## Conventions

- Use App Router file conventions (page.tsx, layout.tsx, loading.tsx, error.tsx)
- All components are TypeScript with explicit return types
- Use `"use client"` directive only when necessary (interactivity, hooks, browser APIs)
- Keep server components as the default
- Place shared types in `src/lib/data/types.ts`
- Use TanStack Query for all data fetching (no raw useEffect + fetch)
- Use Zustand for UI-only state (filters, modals, sidebar)
- All data access goes through the DataProvider interface in `src/lib/data/`
- shadcn/ui components live in `src/components/ui/`
- Feature components organized by domain: `posts/`, `analytics/`, `calendar/`, `layout/`

## Commands

- `pnpm dev` - Start development server
- `pnpm build` - Production build
- `pnpm db:seed` - Seed mock data into Supabase
- `pnpm lint` - Run ESLint

## Buffer Integration

- Posts with status "scheduled" are pushed to Buffer via `/api/schedule`
- Manual sync via "Sync Now" button calls `/api/sync`
- Buffer credentials: `BUFFER_API_TOKEN`, `BUFFER_ORGANIZATION_ID`
- Graceful degradation: if Buffer is not configured, scheduling saves to Supabase only
- Buffer client: `src/lib/buffer/client.ts`
- Sync logic: `src/lib/buffer/sync.ts`
- Buffer has no analytics API - analytics use mock data from Supabase
- DB columns `metricool_post_id` and `metricool_status` are reused for Buffer post IDs

## Key Architecture Decisions

- DataProvider abstraction enables swapping mock data for Buffer API via `NEXT_PUBLIC_USE_BUFFER` env var
- Single `posts` table serves both platforms, distinguished by `platform` column
- Database schema mirrors API response shapes for integration
- Calendar filters persist in URL search params
