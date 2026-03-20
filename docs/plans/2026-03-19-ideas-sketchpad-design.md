# Ideas Sketchpad Design

**Date:** 2026-03-19
**Status:** Approved

---

## Overview

A global scratch pad for capturing freeform ideas - links, photos, quick thoughts, inspiration. Not tied to any platform. Ideas can be converted to posts when ready. Exists as its own page at `/ideas`.

---

## Data Model

### `ideas` table

```sql
id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4()
title           text
content         text
links           text[]      DEFAULT '{}'
created_at      timestamptz DEFAULT now() NOT NULL
updated_at      timestamptz DEFAULT now() NOT NULL
converted_to    uuid        REFERENCES posts(id)
```

### `idea_images` table

```sql
id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4()
idea_id         uuid        NOT NULL REFERENCES ideas(id) ON DELETE CASCADE
storage_path    text        NOT NULL
file_name       text        NOT NULL
created_at      timestamptz DEFAULT now() NOT NULL
```

### Supabase Storage

- Bucket: `idea-images`
- Stores uploaded files from the idea cards

---

## UI Layout

### Page: `/ideas`

**Quick-add bar** at the top:
- Full-width text input, placeholder "Jot down an idea..."
- Enter to submit, instantly creates a card with that text as the title
- Zero friction capture

**Cards grid** below:
- Responsive: 1 col mobile, 2 cols tablet, 3 cols desktop
- Newest first

**Each card shows:**
- Title/text (first line)
- Image thumbnail (first image if any)
- Link count badge
- Relative timestamp (date-fns formatDistanceToNow)
- "Converted" badge if converted to a post
- Click to open detail view

**Card detail view** (Sheet slide-out):
- Editable title field
- Editable content textarea
- Image gallery with upload button (grid of thumbnails, X to remove)
- Links section (add/remove URLs as clickable chips)
- "Convert to Post" button
- Delete button (destructive)

---

## Convert to Post Flow

1. Click "Convert to Post" on idea card
2. PostFormSheet opens pre-filled:
   - Caption = title + content combined
   - Platform = Instagram (default)
   - Status = Draft
   - Notes = links as text
3. User adjusts and saves
4. Post created in Supabase
5. Idea's `converted_to` set to new post ID
6. Card shows "Converted" badge, slightly dimmed
7. Idea stays in sketchpad for reference

Images do NOT transfer to posts - they stay as reference on the idea card.

---

## Design Decisions

1. Global scratch pad, not platform-specific
2. Quick-add bar for zero-friction capture
3. Card-based layout for visual scanning
4. Upload images to Supabase Storage (no URL paste)
5. Convert creates a new post, doesn't delete the idea
6. Converted ideas stay visible but dimmed
