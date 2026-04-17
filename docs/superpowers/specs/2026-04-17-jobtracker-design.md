# JobTracker PWA — Design Spec
*Date: 2026-04-17*

## What We're Building

A Progressive Web App (PWA) for tracking job applications through a kanban board. Each user sees only their own data (authenticated via Supabase). The app is installable on mobile. Design direction: **Dark Command Center** — deep navy background, electric cyan accents, monospace typography, subtle grid lines.

---

## 1. Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Modern React framework, handles routing, server rendering, and API |
| Styling | Tailwind CSS v4 | Utility-class CSS — fast to write, consistent design |
| Database + Auth | Supabase | PostgreSQL database + built-in auth + Google OAuth |
| Drag and Drop | `@dnd-kit/core` | Accessible, modern, works with React |
| Deployment | Vercel | Zero-config Next.js hosting |

---

## 2. Folder Structure

```
jobtracker/
├── app/                        # Next.js App Router (all pages live here)
│   ├── layout.tsx              # Root layout — wraps every page
│   ├── page.tsx                # Home (redirects to /board or /login)
│   ├── login/page.tsx          # Login page
│   ├── signup/page.tsx         # Signup page
│   ├── auth/callback/route.ts  # OAuth callback handler (Google)
│   └── board/
│       ├── layout.tsx          # Board layout (checks auth)
│       └── page.tsx            # Main kanban board page
├── components/
│   ├── board/
│   │   ├── KanbanBoard.tsx     # Full board with all columns
│   │   ├── KanbanColumn.tsx    # Single column (Applied, Interviewing, etc.)
│   │   └── JobCard.tsx         # Individual job application card
│   ├── modals/
│   │   └── JobModal.tsx        # Add / edit modal
│   ├── stats/
│   │   └── StatsBar.tsx        # Stats bar (4 metrics)
│   └── ui/
│       ├── SearchBar.tsx       # Search input
│       └── FilterChips.tsx     # Status filter buttons
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser-side Supabase client
│   │   └── server.ts           # Server-side Supabase client
│   └── types.ts                # TypeScript types (Job, Column, etc.)
├── middleware.ts               # Protects /board route — redirects to login if not authenticated
├── public/
│   ├── manifest.json           # PWA manifest (name, icons, colors)
│   └── icons/                  # App icons (192x192, 512x512)
└── next.config.ts              # Next.js configuration
```

---

## 3. Database Schema (Supabase / PostgreSQL)

One table: `jobs`

```sql
create table jobs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  company     text not null,
  role        text not null,
  status      text not null check (status in ('applied','interviewing','offer','rejected')),
  date_applied date not null default current_date,
  notes       text,
  position    integer not null default 0,   -- order within the column
  created_at  timestamptz default now()
);

-- Row Level Security: each user only sees their own rows
alter table jobs enable row level security;

create policy "Users see own jobs" on jobs
  for all using (auth.uid() = user_id);
```

**What is Row Level Security (RLS)?** It's a database feature that automatically filters every query so users can only access their own rows — even if a bug in the code tried to fetch someone else's data, the database would block it.

---

## 4. Architecture — Server vs. Client Components

Next.js App Router has two kinds of components:

- **Server Components** (default): Run on the server. Can fetch data from the database directly. Never sent as JavaScript to the browser — they become pure HTML. Faster initial load.
- **Client Components** (marked with `'use client'`): Run in the browser. Required for anything interactive — click handlers, drag-and-drop, modals, state (`useState`, `useEffect`).

In this app:
- `board/page.tsx` is a **Server Component** — it fetches the user's jobs from Supabase on the server before sending the page
- `KanbanBoard.tsx` is a **Client Component** — it handles drag-and-drop, opening modals, and live updates
- `StatsBar.tsx` is a **Client Component** — it receives the live `jobs` array as a prop from `KanbanBoard` so stats update instantly when you add, drag, or delete a card

---

## 5. Authentication Flow

1. User visits `/board`
2. **Middleware** (`middleware.ts`) checks for a valid session cookie
3. If no session → redirect to `/login`
4. On `/login`: user can enter email/password or click "Sign in with Google"
5. Google OAuth: browser → Google → Supabase → `/auth/callback` → `/board`
6. Session is stored in a cookie managed by `@supabase/ssr`

**What is OAuth?** Instead of your app storing a password, you tell Google "this user wants to log in." Google authenticates them and sends back a token saying "yes, this is mateofalsar21@gmail.com." Your app trusts Google's answer. No password stored = less security risk.

---

## 6. Components Design

### `KanbanBoard.tsx` (Client Component)
- Wraps all columns in a `DndContext` from `@dnd-kit`
- Manages local state: `jobs` array, `modalOpen`, `editingJob`, `searchQuery`, `filterStatus`
- On drag end: updates `status` and `position` of the moved job, calls Supabase to persist
- Filters cards before rendering based on search/filter state

### `KanbanColumn.tsx` (Client Component)
- Receives its list of filtered cards
- Uses `useDroppable` from `@dnd-kit` so cards can be dropped into it
- Renders `JobCard` components inside a `SortableContext`

### `JobCard.tsx` (Client Component)
- Uses `useSortable` from `@dnd-kit` for drag handle
- Shows: company name, role, date applied, optional note preview
- On hover: reveals edit (✏) and delete (🗑) icon buttons

### `JobModal.tsx` (Client Component)
- Controlled form with: company, role, status (dropdown), date applied, notes
- In "add" mode: calls `INSERT` on Supabase
- In "edit" mode: calls `UPDATE` on Supabase
- On submit: updates local state immediately (optimistic update) then syncs with DB

### `StatsBar.tsx` (Client Component)
- Receives `jobs` array as a prop from `KanbanBoard` — updates live as cards are added/moved/deleted
- Computes from the jobs array:
  - Total applications: `jobs.length`
  - Active interviews: `jobs.filter(j => j.status === 'interviewing').length`
  - Response rate: `(interviews + offers + rejected) / total * 100`
  - Offers: `jobs.filter(j => j.status === 'offer').length`

---

## 7. Data Flow

```
Supabase DB
    ↓ (server fetch on page load)
board/page.tsx  →  passes initialJobs prop
    ↓
KanbanBoard.tsx (useState with initialJobs)
    ├── renders KanbanColumn × 4
    │       └── renders JobCard × N
    ├── handles drag-end → Supabase UPDATE
    ├── handles add/edit → JobModal → Supabase INSERT/UPDATE
    └── handles delete → Supabase DELETE
```

On every mutation (add/edit/delete/drag), the local state updates immediately (so the UI feels instant), and a Supabase call runs in the background to persist the change.

---

## 8. Drag and Drop

Library: `@dnd-kit/core` + `@dnd-kit/sortable`

- Each card is a `SortableItem` with a unique `id`
- Each column is a `Droppable` container identified by its status string
- On `onDragEnd`: check if the card moved to a different column — if yes, update `status`; always update `position` based on new index
- Persist to Supabase: `UPDATE jobs SET status = $1, position = $2 WHERE id = $3`

---

## 9. Search & Filter

- Search: `jobs.filter(j => j.company.toLowerCase().includes(query) || j.role.toLowerCase().includes(query))`
- Filter chips: "ALL" | "ACTIVE" (applied + interviewing) | "OFFERS"
- Both are purely client-side — no extra DB calls needed since all jobs are already loaded

---

## 10. PWA Setup

Three things make a PWA:
1. **`manifest.json`**: tells the browser the app name, icons, and theme color
2. **Service Worker**: caches assets so the app works offline (Next.js handles this via `next-pwa` package)
3. **HTTPS**: required for install prompts — Vercel provides this automatically

After setup, visiting the app on mobile shows an "Add to Home Screen" prompt.

---

## 11. Error Handling

- Auth errors (wrong password, email not confirmed): show inline error message on the form
- Supabase mutation errors: show a toast notification ("Failed to save — please try again")
- Loading states: skeleton cards while initial data loads
- No data state: empty column shows a prompt to add the first application

---

## 12. Build Order

1. Scaffold Next.js project + explain folder structure
2. Install and configure Tailwind CSS v4
3. Set up Supabase project + create `jobs` table + enable RLS
4. Build auth pages (login, signup, Google OAuth) + middleware
5. Build kanban board UI (KanbanBoard, KanbanColumn, JobCard, StatsBar)
6. Connect board to Supabase (load data, add/edit/delete)
7. Add drag and drop with `@dnd-kit`
8. Add stats bar
9. Add search and filter
10. Add PWA manifest + service worker
11. Deploy to Vercel
