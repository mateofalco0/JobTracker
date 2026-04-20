# JobTracker

A Progressive Web App for tracking job applications through a kanban board. Built with Next.js 16, Tailwind CSS v4, and Supabase. Installable on mobile. Dark Command Center aesthetic.

---

## What it does

- **Kanban board** with four columns: Applied → Interviewing → Offer → Rejected
- **Drag and drop** cards between columns and reorder within a column
- **Add / Edit / Delete** job applications via a modal form
- **Stats bar** showing total applications, active interviews, response rate, and offers — updates live as you move cards
- **Search** by company name or role title (client-side, no extra DB call)
- **Filter chips**: ALL / ACTIVE (applied + interviewing) / OFFERS
- **Google OAuth + email/password authentication** via Supabase Auth
- **Per-user data isolation** via PostgreSQL Row Level Security — even a backend bug can't expose another user's data
- **PWA installable** — visiting on mobile shows "Add to Home Screen" prompt; the app opens full-screen without a browser bar

---

## Tech stack

| Layer | Tool | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| Styling | Tailwind CSS | v4 |
| Database + Auth | Supabase | latest |
| Auth SSR helpers | @supabase/ssr | latest |
| Drag and Drop | @dnd-kit/core + @dnd-kit/sortable | latest |
| PWA | @ducanh2912/next-pwa | latest |
| Icons | Lucide React | latest |
| Font | JetBrains Mono (via next/font/google) | — |
| Deployment | Vercel | — |

---

## Project structure

```
jobtracker/
├── app/
│   ├── layout.tsx              # Root HTML shell — sets font, metadata, manifest link
│   ├── page.tsx                # Root redirect: / → /board (if authed) or /login
│   ├── globals.css             # Tailwind v4 @theme tokens + body styles + grid background
│   ├── login/page.tsx          # Login page (email/password + Google OAuth)
│   ├── signup/page.tsx         # Signup page (email/password; success shows "check email")
│   ├── auth/callback/route.ts  # OAuth code exchange → session cookie → redirect to /board
│   └── board/
│       ├── layout.tsx          # Server-side auth guard — redirects to /login if no session
│       └── page.tsx            # Server Component: fetches jobs from Supabase, renders KanbanBoard
│
├── components/
│   ├── board/
│   │   ├── KanbanBoard.tsx     # Main client component — owns all state, DndContext, CRUD
│   │   ├── KanbanColumn.tsx    # One column (useDroppable, renders SortableJobCard list)
│   │   ├── JobCard.tsx         # Individual card (forwardRef for dnd-kit, hover edit/delete)
│   │   └── SortableJobCard.tsx # Thin wrapper: calls useSortable, passes transform to JobCard
│   ├── modals/
│   │   └── JobModal.tsx        # Add/edit modal — controlled form, optimistic insert
│   ├── stats/
│   │   └── StatsBar.tsx        # 4-metric strip — receives jobs[] prop, computes stats live
│   └── ui/
│       ├── SearchBar.tsx       # Controlled search input
│       └── FilterChips.tsx     # ALL / ACTIVE / OFFERS filter buttons
│
├── lib/
│   ├── types.ts                # Job, JobStatus, JobFormData, Column interfaces; COLUMNS constant
│   └── supabase/
│       ├── client.ts           # createBrowserClient — used inside Client Components
│       └── server.ts           # createServerClient — used in Server Components and route handlers
│
├── proxy.ts                    # Next.js 16 request interceptor (replaces middleware.ts)
│                               # Refreshes session cookie; redirects unauthenticated /board → /login
│
├── public/
│   ├── manifest.json           # PWA manifest (name, icons, theme_color, start_url)
│   └── icons/
│       ├── icon-192.png        # PWA icon 192×192
│       └── icon-512.png        # PWA icon 512×512
│
└── next.config.ts              # Next.js config — wraps withPWA (service worker generation)
```

---

## Architecture

### Server Components vs Client Components

Next.js App Router has two kinds of components:

**Server Components** (default — no `'use client'` directive):
- Run only on the server. Never sent as JavaScript to the browser.
- Can read from the database directly, access environment variables, use `cookies()`.
- Produce pure HTML — faster initial load, no hydration overhead.
- Cannot use `useState`, `useEffect`, event handlers, or browser APIs.

**Client Components** (marked with `'use client'` at the top of the file):
- Run in the browser (and also server-side during SSR for the initial HTML).
- Required for anything interactive: click handlers, drag-and-drop, modals, live state.
- Can use all React hooks.

In this app:
- `app/board/page.tsx` is a **Server Component** — fetches jobs from Supabase before sending the page, so the user sees a fully rendered board immediately with no loading spinner.
- `KanbanBoard.tsx` is a **Client Component** — owns all interactive state (`jobs`, `modalOpen`, `searchQuery`, etc.) and handles drag-and-drop and CRUD.
- `StatsBar.tsx` is a **Client Component** — receives the live `jobs` array as a prop from `KanbanBoard`, so stats update instantly when you add, drag, or delete a card without any extra network call.

### Data flow

```
Supabase DB (PostgreSQL)
    │
    │  SELECT * FROM jobs ORDER BY position   (server-side, before page render)
    ▼
app/board/page.tsx          ← Server Component
    │  initialJobs prop
    ▼
KanbanBoard.tsx             ← Client Component (useState with initialJobs)
    ├── renders KanbanColumn × 4
    │       └── renders SortableJobCard → JobCard × N
    ├── StatsBar (receives jobs[] prop, updates live)
    ├── SearchBar + FilterChips (client-side filter, no DB call)
    ├── drag-end → Supabase UPDATE (status + position)
    ├── add/edit → JobModal → Supabase INSERT/UPDATE
    └── delete → Supabase DELETE
```

Every mutation uses an **optimistic update**: local state changes immediately (so the UI feels instant), then the Supabase call runs in the background. If it fails, the UI rolls back and shows an error.

### Authentication flow

1. User visits `/board`
2. **proxy.ts** intercepts the request, calls `supabase.auth.getUser()`
3. No valid session → redirect to `/login`
4. On `/login`: email/password form or "Sign in with Google" button
5. Google OAuth path: browser → Google → Supabase → `/auth/callback` → `/board`
6. `/auth/callback/route.ts` exchanges the OAuth `code` for a session and writes it as a cookie via `@supabase/ssr`
7. All subsequent requests carry the cookie; `@supabase/ssr` refreshes it automatically before it expires

**Why `proxy.ts` instead of `middleware.ts`?** Next.js 16 renamed the request-interception file from `middleware.ts` to `proxy.ts`. The behavior and API are otherwise identical.

### Row Level Security (RLS)

The `jobs` table has RLS enabled with a single policy:

```sql
create policy "Users see own jobs" on jobs
  for all using (auth.uid() = user_id);
```

Every query — SELECT, INSERT, UPDATE, DELETE — is automatically filtered to the authenticated user's rows at the database level. Even if a bug in application code tried to fetch all users' jobs, the database would return only the current user's rows. No data leaks are possible through application-level mistakes.

---

## Database schema

```sql
create table jobs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  company     text not null,
  role        text not null,
  status      text not null check (status in ('applied','interviewing','offer','rejected')),
  date_applied date not null default current_date,
  notes       text,
  position    integer not null default 0,
  created_at  timestamptz default now()
);

alter table jobs enable row level security;

create policy "Users see own jobs" on jobs
  for all using (auth.uid() = user_id);
```

`position` stores the sort order within a column. When a card is dragged, all cards in the affected column get their `position` updated in a `Promise.all` batch.

---

## Drag and drop

Library: `@dnd-kit/core` + `@dnd-kit/sortable`

The drag system has three layers:

**`DndContext`** (in `KanbanBoard`) — coordinates all drag activity. `onDragStart` captures which job is being dragged (stored as `activeJob` for the `DragOverlay`). `onDragOver` fires continuously as the card moves and handles **cross-column status changes in real time** — the card visually jumps to the target column while still being held. `onDragEnd` finalizes the position and persists to Supabase.

**`useDroppable`** (in `KanbanColumn`) — marks each column div as a valid drop target. The `isOver` flag triggers a subtle cyan background highlight when a card hovers over the column.

**`useSortable`** (in `SortableJobCard`) — makes each card draggable and sortable within a list. Provides `transform` and `transition` CSS values for smooth animation, and passes `setNodeRef` down to `JobCard` via `forwardRef`.

**Why `forwardRef` on `JobCard`?** `useSortable` needs to attach its `ref` to the actual DOM element. React function components can't receive a `ref` by default — `forwardRef` enables this without changing the external API of `JobCard`.

**Why a separate `SortableJobCard` wrapper?** `JobCard` is used in two contexts: inside a `SortableContext` (with dnd-kit transforms applied) and inside `DragOverlay` (as the floating ghost card during a drag, without transforms). Separating the sortable logic into `SortableJobCard` keeps `JobCard` a pure presentational component that works in both contexts unchanged.

---

## Styling

**Tailwind CSS v4** changed the configuration model significantly from v3:
- No `tailwind.config.ts` file. All customization is in `app/globals.css`.
- The `@theme` directive defines CSS custom properties that Tailwind uses as design tokens.
- `@import "tailwindcss"` replaces the old `@tailwind base/components/utilities` directives.

Design tokens (defined in `app/globals.css` via `@theme`):

| Token | Value | Usage |
|---|---|---|
| `--color-navy-950` | `#070b14` | Page background |
| `--color-navy-900` | `#0a0e1a` | Card background |
| `--color-navy-800` | `#0f172a` | Modal background |
| `--color-navy-700` | `#1e2a4a` | Borders |
| `--color-cyan` | `#38bdf8` | Primary accent (Applied, buttons) |
| `--color-violet` | `#a78bfa` | Interviewing column accent |
| `--color-emerald` | `#34d399` | Offer column accent |
| `--color-amber` | `#fbbf24` | Response rate stat |

The grid background is a CSS-only effect on `body::before`: two overlapping `linear-gradient` patterns create a subtle cyan grid on the dark navy background. Font is **JetBrains Mono** loaded via `next/font/google` and applied globally via `--font-mono` CSS variable.

---

## PWA setup

Three things make this a Progressive Web App:

**`public/manifest.json`** — tells the browser the app name, icons, theme color, and `start_url=/board`. Browsers read this to decide whether to show the "Add to Home Screen" prompt.

**Service Worker** — generated automatically by `@ducanh2912/next-pwa` during `npm run build`. Caches assets so the app loads instantly on repeat visits. Disabled in development (`disable: process.env.NODE_ENV === 'development'`) because caching interferes with hot reload. Generated files (`sw.js`, `workbox-*.js`) are gitignored and regenerated on each build.

**HTTPS** — required for service workers and install prompts. Vercel provides this automatically.

---

## Environment variables

Create `.env.local` at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Both are prefixed `NEXT_PUBLIC_` so they're available in Client Components (browser-side). They are safe to expose — the anon key grants access only to rows that RLS policies allow for the authenticated user.

---

## Local development

```bash
npm install
# create .env.local with your Supabase credentials
npm run dev
```

Visit `http://localhost:3000`. The root page redirects to `/board` if you're logged in, or `/login` if not.

---

## Deployment (Vercel)

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → import the repo
3. Vercel auto-detects Next.js — no build settings needed
4. Add environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click Deploy

After deployment, update Supabase Auth settings:
- **URL Configuration → Site URL**: your Vercel URL
- **URL Configuration → Redirect URLs**: `https://your-app.vercel.app/auth/callback`

If using Google OAuth, also add the callback URL to your Google Cloud Console OAuth client's authorized redirect URIs.

---

## Key design decisions

**Optimistic updates** — Supabase calls take 100–500ms. Without optimistic updates the UI would freeze after every action. State changes immediately; the network call runs in the background. On failure the UI rolls back and shows an error toast.

**Server-side fetch on `board/page.tsx`** — The user sees a fully rendered board on first load with no skeleton state and no layout shift. Jobs are fetched on the server before any HTML is sent to the browser — the main benefit of Next.js Server Components.

**`SortableJobCard` + `JobCard` split** — `JobCard` is used inside `SortableContext` (with dnd-kit transforms) and inside `DragOverlay` (without transforms). The split keeps `JobCard` a pure presentational component that works unchanged in both contexts.

**`forwardRef` on `JobCard`** — `useSortable` must attach a ref to the DOM element. `forwardRef` enables this without changing the external API.

**`proxy.ts` instead of `middleware.ts`** — Next.js 16 renamed this file. Behavior is identical to `middleware.ts` in Next.js 15.

**RLS over application-level guards** — Application code can have bugs. RLS is enforced at the database level and cannot be bypassed through application mistakes. It guarantees data isolation as a separate layer of defense.
