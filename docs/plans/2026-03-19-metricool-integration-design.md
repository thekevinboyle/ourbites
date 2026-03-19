# Metricool Integration Design - Real Posting & Scheduling

**Date:** 2026-03-19
**Status:** Approved

---

## Overview

Connect OurBites to Metricool's API for real posting and scheduling to Instagram and TikTok. OurBites remains the source of truth for content (ideas, drafts stay in Supabase). Only "scheduled" posts get pushed to Metricool, which handles actual publishing. A sync mechanism pulls back published status and analytics data.

---

## Data Flow

```
OurBites (Supabase)          Metricool              Platforms
┌──────────────┐     push    ┌──────────┐   auto    ┌───────────┐
│ Post created │────────────→│ Scheduled│──────────→│ Instagram │
│ as "idea"    │  schedule   │ post     │  publish  │ TikTok    │
│ → "draft"    │             └──────────┘           └───────────┘
│ → "scheduled"│                  │
│ → "published"│←─────────────────┘
└──────────────┘    sync back (status + analytics)
```

1. Posts start as ideas/drafts in Supabase only
2. Setting status to "scheduled" with a date pushes to Metricool via `post_schedule_post`
3. Metricool publishes to Instagram/TikTok at the scheduled time
4. Sync job pulls back status updates and analytics into Supabase

---

## Database Changes

New columns on `posts` table:

```sql
ALTER TABLE posts ADD COLUMN metricool_post_id text;
ALTER TABLE posts ADD COLUMN metricool_status text CHECK (metricool_status IN ('pending', 'published', 'failed'));
CREATE INDEX idx_posts_metricool_post_id ON posts(metricool_post_id);
```

- `metricool_post_id` - ID returned by Metricool after scheduling (links the two systems)
- `metricool_status` - Metricool's status for the post

---

## New Files

### Metricool Client Layer

```
src/lib/metricool/
├── client.ts          # Metricool API client (HTTP wrapper)
├── types.ts           # Metricool API request/response types
└── sync.ts            # Sync logic (pull status + analytics back)
```

**`client.ts`** - REST API wrapper:
- Auth via `X-Mc-Auth` header + `userId`/`blogId` query params
- Base URL: `https://app.metricool.com/api`
- Methods:
  - `schedulePost(post)` - Push a post for scheduling
  - `updateScheduledPost(metricoolId, updates)` - Modify a scheduled post
  - `getScheduledPosts()` - List all scheduled posts
  - `getBrands()` - Get available brands/workspaces
  - `getInstagramPosts(dateRange)` - Pull published Instagram data
  - `getTikTokVideos(dateRange)` - Pull published TikTok data
  - `getMetrics(dateRange)` - Pull analytics snapshots

**`sync.ts`** - Sync back logic:
- Pulls published posts from Metricool, matches by `metricool_post_id`
- Updates Supabase: status → "published", fills in `published_at`, writes analytics
- Refreshes `analytics_snapshots` with real Metricool data

### API Route

**`src/app/api/sync/route.ts`** - `POST /api/sync`:
- Triggers full sync from Metricool
- Updates post statuses and analytics
- Returns summary: `{ postsUpdated: N, analyticsUpdated: N }`

---

## Environment Variables

```
METRICOOL_USER_TOKEN=your-token     # From Metricool Account Settings > API
METRICOOL_USER_ID=your-user-id      # User account identifier
METRICOOL_BLOG_ID=your-blog-id      # Brand/workspace identifier
```

---

## UI Changes

### Post Form
- Scheduling a post triggers Metricool push after Supabase save
- Success toast: "Post scheduled and pushed to Metricool"
- Failure toast: shows error, post stays in Supabase as "scheduled" without metricool_post_id
- Graceful degradation: if no Metricool credentials, scheduling only saves to Supabase

### Post Table
- Posts with `metricool_post_id` show a "Synced" indicator
- Posts with `metricool_status: 'failed'` show a warning indicator

### Sync Button
- Manual "Sync Now" button in the sidebar or header
- Loading spinner during sync
- Toast with results: "Synced: N posts updated, analytics refreshed"

---

## Provider Integration

- `SupabaseMockProvider` unchanged (mock data, no Metricool) - used when `METRICOOL_USER_TOKEN` is not set
- When Metricool credentials exist:
  - Post scheduling calls go through Metricool client
  - Analytics data comes from Metricool instead of mock snapshots
  - Post management (CRUD for ideas/drafts) stays in Supabase

---

## Scope

**In scope:**
- Caption + metadata scheduling (no media upload)
- Status sync back from Metricool
- Analytics sync for real metrics
- Manual sync trigger

**Out of scope (future):**
- Media upload (images/videos)
- Automatic periodic sync (cron)
- Bidirectional sync (importing posts created in Metricool)
- Best time to post suggestions
