# JobTracker PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade job application tracker PWA with kanban board, Supabase auth, drag-and-drop, and Dark Command Center aesthetic, deployed on Vercel.

**Architecture:** Next.js 15 App Router. The `/board` route is server-rendered (fetches jobs via Supabase SSR before sending HTML). `KanbanBoard` is a Client Component that owns all interactive state. Middleware protects `/board` — unauthenticated requests redirect to `/login`.

**Tech Stack:** Next.js 15, Tailwind CSS v4, @supabase/ssr, @dnd-kit/core + @dnd-kit/sortable, @ducanh2912/next-pwa, TypeScript, Lucide React.

---

## Teaching note for the executor

Before each file, explain in plain English: what this file is, why it exists, and what each important concept does. When a concept is new (hooks, middleware, RLS, OAuth, Server vs Client components, environment variables), stop and explain it before the code. The user is learning — make every step a lesson.

---

## File Map

```
app/
  layout.tsx                   # Root HTML shell, fonts, metadata
  page.tsx                     # Redirects / → /board or /login
  login/page.tsx               # Login form (email/password + Google)
  signup/page.tsx              # Signup form
  auth/callback/route.ts       # OAuth code exchange → session cookie
  board/
    layout.tsx                 # Checks auth, wraps board UI
    page.tsx                   # Server Component: fetches jobs, renders KanbanBoard

components/
  stats/StatsBar.tsx           # 4-metric stats strip (Client Component)
  board/
    KanbanBoard.tsx            # DndContext + all state (Client Component)
    KanbanColumn.tsx           # Single droppable column
    JobCard.tsx                # Draggable job card
  modals/JobModal.tsx          # Add/edit modal form
  ui/
    SearchBar.tsx              # Controlled search input
    FilterChips.tsx            # ALL / ACTIVE / OFFERS filter

lib/
  types.ts                     # Job type, JobStatus, COLUMNS constant
  supabase/
    client.ts                  # Browser Supabase client (for Client Components)
    server.ts                  # Server Supabase client (for Server Components + routes)

middleware.ts                  # Auth guard: /board → /login if no session
public/
  manifest.json                # PWA manifest
  icons/icon-192.png           # App icon 192×192
  icons/icon-512.png           # App icon 512×512
next.config.ts                 # Next.js + next-pwa config
```

---

## Task 1: Scaffold the Next.js project

**Files:**
- Create: (scaffolded by CLI)
- Modify: `package.json`, `postcss.config.mjs`, `app/globals.css`
- Delete: `tailwind.config.ts`

📚 **What is Next.js?** Next.js is a framework built on top of React. It adds routing (different URLs = different pages), server-side rendering (pages are built on the server before being sent to your browser — faster and better for SEO), and a lot of other features. When you run `npm run dev`, Next.js starts a local web server so you can see your app in the browser.

📚 **What is TypeScript?** TypeScript is JavaScript with types. A type tells the computer what kind of data a variable holds — is it a string? A number? An object with specific fields? This catches bugs before you even run the code.

📚 **What is Tailwind CSS?** Tailwind is a CSS framework where instead of writing CSS files, you add class names directly to your HTML elements. `bg-blue-500` makes the background blue. `text-sm` makes text small. You compose designs by stacking class names.

- [ ] **Step 1: Scaffold the project**

Run in `/Users/mateofalco/proyectos/JobTracker`:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
```
When prompted, answer: Yes to all defaults. This creates the full folder structure.

- [ ] **Step 2: Upgrade Tailwind from v3 to v4**

📚 **Why upgrade?** `create-next-app` installs Tailwind v3. Tailwind v4 has a cleaner API — no config file needed, CSS-first setup. We upgrade because v4 is current.

```bash
npm uninstall tailwindcss postcss autoprefixer
npm install tailwindcss@^4 @tailwindcss/postcss
```

- [ ] **Step 3: Update PostCSS config**

Replace `postcss.config.mjs` entirely:
```js
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
export default config
```

- [ ] **Step 4: Delete Tailwind config file**

```bash
rm tailwind.config.ts
```

In v4, configuration lives in the CSS file — no separate config needed.

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```
Open `http://localhost:3000` — should show the default Next.js welcome page. Press Ctrl+C to stop.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 + Tailwind v4"
```

---

## Task 2: Design tokens, global styles, and fonts

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

📚 **What are CSS custom properties (variables)?** Think of them like variables in any programming language but for CSS. You define `--color-brand: #38bdf8` once, then use `var(--color-brand)` everywhere. If you change the value in one place, every element using it updates. This is how we manage the Dark Command Center color system.

📚 **What is a Google Font?** Google Fonts is a free library of web fonts. Next.js has a `next/font/google` module that downloads and self-hosts fonts automatically — no external requests at runtime, which is better for privacy and performance.

- [ ] **Step 1: Replace `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-navy-950: #070b14;
  --color-navy-900: #0a0e1a;
  --color-navy-800: #0f172a;
  --color-navy-700: #1e2a4a;
  --color-cyan: #38bdf8;
  --color-cyan-dim: rgba(56, 189, 248, 0.12);
  --color-violet: #a78bfa;
  --color-emerald: #34d399;
  --color-amber: #fbbf24;
  --color-slate-200: #e2e8f0;
  --color-slate-400: #94a3b8;
  --color-slate-500: #64748b;
  --color-slate-600: #475569;
  --color-slate-700: #334155;
}

* {
  box-sizing: border-box;
}

body {
  background-color: var(--color-navy-950);
  color: var(--color-slate-200);
  font-family: var(--font-mono), 'Courier New', monospace;
  min-height: 100vh;
}

/* Subtle grid background on every page */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(56, 189, 248, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56, 189, 248, 0.025) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
  z-index: 0;
}

/* Everything on top of the grid */
#__next, main, header, [data-above-grid] {
  position: relative;
  z-index: 1;
}

/* Scrollbar styling */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--color-navy-900); }
::-webkit-scrollbar-thumb { background: var(--color-navy-700); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-cyan-dim); }
```

- [ ] **Step 2: Replace `app/layout.tsx`**

📚 **What is a layout?** In Next.js App Router, `layout.tsx` wraps every page. Think of it as the HTML shell — the `<html>` and `<body>` tags live here. Every page you navigate to will have this outer wrapper. It only renders once and doesn't re-mount when navigating between pages.

📚 **What is `next/font`?** It's a Next.js feature that downloads fonts at build time and serves them from your own server — no request to Google's servers when your page loads. The font is injected via a CSS variable.

```tsx
import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'JobTracker',
  description: 'Track your job applications like a mission.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#070b14',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={jetbrainsMono.variable}>
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Verify fonts load**

```bash
npm run dev
```
Open `http://localhost:3000` — text should appear in JetBrains Mono (monospace, with serifs on letters). Check DevTools → Network → Font to confirm it loaded.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: add design tokens, JetBrains Mono font, grid background"
```

---

## Task 3: TypeScript types and constants

**Files:**
- Create: `lib/types.ts`

📚 **What is a TypeScript interface?** An interface describes the shape of an object. `interface Job { company: string; role: string }` means any `Job` object must have a `company` string and a `role` string. If you try to use a `Job` without a `company`, TypeScript shows a red underline before you even run the code.

📚 **What is `type` vs `interface`?** Both define shapes. `type` is more flexible (can define unions, primitives). `interface` is for objects. We use both — `interface` for our database objects, `type` for unions like `'applied' | 'interviewing'`.

- [ ] **Step 1: Create `lib/types.ts`**

```ts
export interface Job {
  id: string
  user_id: string
  company: string
  role: string
  status: JobStatus
  date_applied: string   // ISO date string: "2025-04-17"
  notes: string | null   // null means the user left it blank
  position: number       // order within the column
  created_at: string
}

export type JobStatus = 'applied' | 'interviewing' | 'offer' | 'rejected'

export interface Column {
  id: JobStatus
  label: string
  accentColor: string       // Tailwind color class for the column header
  borderColor: string       // CSS color for the top card accent bar
}

export const COLUMNS: Column[] = [
  { id: 'applied',      label: 'APPLIED',      accentColor: 'text-cyan-400',   borderColor: '#38bdf8' },
  { id: 'interviewing', label: 'INTERVIEWING',  accentColor: 'text-violet-400', borderColor: '#a78bfa' },
  { id: 'offer',        label: 'OFFER',         accentColor: 'text-emerald-400',borderColor: '#34d399' },
  { id: 'rejected',     label: 'REJECTED',      accentColor: 'text-slate-500',  borderColor: 'transparent' },
]

// A partial Job used when creating/editing — no id/user_id/created_at yet
export type JobFormData = Pick<Job, 'company' | 'role' | 'status' | 'date_applied' | 'notes'>
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add TypeScript types and column constants"
```

---

## Task 4: Set up Supabase project and database

**Files:**
- No code files yet — this task is done in the Supabase web dashboard
- Create: `.env.local`

📚 **What is Supabase?** Supabase is a hosted database service. It gives you a PostgreSQL database (PostgreSQL is one of the most popular databases in the world — think of it as a very powerful spreadsheet), plus authentication, plus an API to talk to that database from your JavaScript code. You don't have to manage any servers.

📚 **What is a database table?** A table is like a spreadsheet. It has columns (fields) and rows (records). Our `jobs` table has columns: `id`, `user_id`, `company`, `role`, `status`, `date_applied`, `notes`, `position`, `created_at`. Each row is one job application.

📚 **What are environment variables?** Sensitive values (API keys, database URLs) that you don't want to hardcode in your source code — because source code goes on GitHub where anyone can see it. Environment variables live in a `.env.local` file that is never committed to git. Next.js loads them automatically. Variables starting with `NEXT_PUBLIC_` are safe to expose to the browser; others are server-only.

📚 **What is Row Level Security (RLS)?** A database feature where the database itself enforces who can see what data. Even if your code had a bug that tried to read another user's jobs, the database would block it. It's your last line of defense.

- [ ] **Step 1: Create Supabase project**

1. Go to https://supabase.com and sign in
2. Click "New project"
3. Name it `jobtracker`, pick a region close to you, set a database password (save it)
4. Wait ~2 minutes for the project to be ready

- [ ] **Step 2: Create the jobs table**

In Supabase dashboard → SQL Editor → New query. Paste and run:

```sql
-- Create the jobs table
create table public.jobs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  company       text not null,
  role          text not null,
  status        text not null check (status in ('applied', 'interviewing', 'offer', 'rejected')),
  date_applied  date not null default current_date,
  notes         text,
  position      integer not null default 0,
  created_at    timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.jobs enable row level security;

-- Policy: users can only see, insert, update, delete their own jobs
create policy "Users manage their own jobs"
  on public.jobs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Verify in Table Editor → you should see the `jobs` table with all columns.

- [ ] **Step 3: Enable Google OAuth**

In Supabase dashboard → Authentication → Providers → Google:
1. Toggle "Enable Google provider" ON
2. Copy the "Callback URL" shown — you'll need this for Google Cloud Console
3. Leave this tab open — you'll fill in Client ID and Secret after step 4

In Google Cloud Console (https://console.cloud.google.com):
1. Create a new project (or use existing)
2. Enable "Google+ API" under APIs & Services → Library
3. Go to APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
4. Application type: Web application
5. Add the Supabase callback URL to "Authorized redirect URIs"
6. Copy the Client ID and Client Secret
7. Paste both back into the Supabase Google provider settings → Save

- [ ] **Step 4: Create `.env.local`**

In Supabase dashboard → Project Settings → API. Copy:
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Create `.env.local` in the project root:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 5: Add `.env.local` to `.gitignore`**

Open `.gitignore` and confirm `.env.local` is listed (create-next-app adds it by default). Also add:
```
.superpowers/
```

- [ ] **Step 6: Commit**

```bash
git add .gitignore
git commit -m "feat: configure Supabase project, RLS policies"
```

---

## Task 5: Supabase client files

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

📚 **Why two clients?** Next.js runs code in two places: the server (Node.js) and the browser. The server can read cookies directly from the request. The browser reads/writes cookies differently. Supabase needs a different setup for each environment to manage session cookies correctly.

📚 **What is a session cookie?** When you log in, Supabase creates a "session" — proof that you're authenticated. This session is stored in a cookie (a small piece of data the browser saves and sends with every request). The `@supabase/ssr` package handles setting and reading this cookie correctly for Next.js.

- [ ] **Step 1: Install Supabase packages**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Create `lib/supabase/client.ts`**

This client runs in the browser (inside Client Components).

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Create `lib/supabase/server.ts`**

This client runs on the server (inside Server Components and Route Handlers). It reads and writes cookies via Next.js's `cookies()` function.

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — middleware handles refreshing sessions
          }
        },
      },
    }
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/client.ts lib/supabase/server.ts
git commit -m "feat: add Supabase browser and server clients"
```

---

## Task 6: Middleware (auth guard)

**Files:**
- Create: `middleware.ts`

📚 **What is middleware?** Middleware is code that runs before every page request, before the page even starts rendering. It's like a bouncer at a door. In our app, the middleware checks: "Does this request have a valid session cookie?" If the user is trying to visit `/board` without being logged in, the middleware immediately redirects them to `/login`. They never even see the board page start loading.

📚 **How does the session check work?** The middleware creates a Supabase client, then calls `supabase.auth.getUser()`. This verifies the session cookie with Supabase's servers. If the cookie is missing or expired, `user` is null.

- [ ] **Step 1: Create `middleware.ts`**

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: always call getUser(), not getSession()
  // getUser() verifies the token with Supabase servers — more secure
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from /board
  if (!user && request.nextUrl.pathname.startsWith('/board')) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from /login and /signup
  if (user && (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup'
  )) {
    const boardUrl = request.nextUrl.clone()
    boardUrl.pathname = '/board'
    return NextResponse.redirect(boardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: add auth middleware — protect /board route"
```

---

## Task 7: Auth pages (login, signup, OAuth callback)

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/signup/page.tsx`
- Create: `app/auth/callback/route.ts`
- Create: `app/page.tsx`

📚 **What is OAuth?** OAuth (specifically OAuth 2.0) is a standard for "log in with Google/GitHub/etc." Instead of your app storing a password, you redirect the user to Google. Google authenticates them and sends back a short-lived "code." Your app exchanges that code for a session. You never see the user's Google password.

📚 **What is a Route Handler?** In Next.js App Router, a file named `route.ts` inside the `app/` directory creates an API endpoint — a URL your server responds to. `/auth/callback/route.ts` handles the URL `https://yourapp.com/auth/callback`, which is where Google redirects after OAuth.

📚 **What is `'use client'`?** Adding `'use client'` at the top of a file marks it as a Client Component. It means this component runs in the browser and can use React hooks (`useState`, `useEffect`) and browser APIs. Without it, the component is a Server Component that runs only on the server.

- [ ] **Step 1: Create `app/auth/callback/route.ts`**

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/board'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could+not+sign+in`)
}
```

- [ ] **Step 2: Create `app/login/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // On success, middleware will redirect to /board via the session cookie
  }

  async function handleGoogleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // On success: browser redirects to Google, then back to /auth/callback
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div
            className="w-8 h-8 flex items-center justify-center text-xs font-bold"
            style={{
              border: '1.5px solid #38bdf8',
              color: '#38bdf8',
              boxShadow: '0 0 12px rgba(56,189,248,0.15)',
            }}
          >
            JT
          </div>
          <span className="text-sm font-bold tracking-widest text-slate-200">
            JOB<span style={{ color: '#38bdf8' }}>.</span>TRACKER
          </span>
        </div>

        {/* Heading */}
        <p className="text-xs tracking-widest text-slate-500 mb-1">// AUTHENTICATION</p>
        <h1 className="text-xl font-bold text-slate-100 mb-8">Welcome back</h1>

        {/* Error */}
        {error && (
          <div
            className="mb-4 px-4 py-3 text-xs rounded-md"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        {/* Google button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 mb-4 text-xs tracking-widest font-semibold text-slate-300 rounded-md transition-colors disabled:opacity-50"
          style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          SIGN IN WITH GOOGLE
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(56,189,248,0.1)' }} />
          <span className="text-xs text-slate-600">OR</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(56,189,248,0.1)' }} />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailLogin} className="space-y-3">
          <div>
            <label className="block text-xs tracking-widest text-slate-500 mb-1.5">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-xs text-slate-200 rounded-md outline-none transition-colors"
              style={{
                background: 'rgba(7,11,20,0.8)',
                border: '1px solid rgba(56,189,248,0.15)',
              }}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest text-slate-500 mb-1.5">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-xs text-slate-200 rounded-md outline-none transition-colors"
              style={{
                background: 'rgba(7,11,20,0.8)',
                border: '1px solid rgba(56,189,248,0.15)',
              }}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-xs font-bold tracking-widest rounded-md transition-opacity disabled:opacity-50"
            style={{ background: '#38bdf8', color: '#070b14' }}
          >
            {loading ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-600">
          No account?{' '}
          <Link href="/signup" className="text-cyan-400 hover:text-cyan-300">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `app/signup/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  async function handleGoogleSignup() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-2xl mb-4" style={{ color: '#34d399' }}>✓</div>
          <p className="text-xs tracking-widest text-slate-400 mb-2">CHECK YOUR EMAIL</p>
          <p className="text-slate-500 text-xs">We sent a confirmation link to <span className="text-slate-300">{email}</span></p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10">
          <div
            className="w-8 h-8 flex items-center justify-center text-xs font-bold"
            style={{ border: '1.5px solid #38bdf8', color: '#38bdf8' }}
          >
            JT
          </div>
          <span className="text-sm font-bold tracking-widest text-slate-200">
            JOB<span style={{ color: '#38bdf8' }}>.</span>TRACKER
          </span>
        </div>

        <p className="text-xs tracking-widest text-slate-500 mb-1">// NEW ACCOUNT</p>
        <h1 className="text-xl font-bold text-slate-100 mb-8">Create account</h1>

        {error && (
          <div className="mb-4 px-4 py-3 text-xs rounded-md"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 mb-4 text-xs tracking-widest font-semibold text-slate-300 rounded-md disabled:opacity-50"
          style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          SIGN UP WITH GOOGLE
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(56,189,248,0.1)' }} />
          <span className="text-xs text-slate-600">OR</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(56,189,248,0.1)' }} />
        </div>

        <form onSubmit={handleSignup} className="space-y-3">
          <div>
            <label className="block text-xs tracking-widest text-slate-500 mb-1.5">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-xs text-slate-200 rounded-md outline-none"
              style={{ background: 'rgba(7,11,20,0.8)', border: '1px solid rgba(56,189,248,0.15)' }}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs tracking-widest text-slate-500 mb-1.5">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 text-xs text-slate-200 rounded-md outline-none"
              style={{ background: 'rgba(7,11,20,0.8)', border: '1px solid rgba(56,189,248,0.15)' }}
              placeholder="Min. 6 characters"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-xs font-bold tracking-widest rounded-md disabled:opacity-50"
            style={{ background: '#38bdf8', color: '#070b14' }}
          >
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-600">
          Have an account?{' '}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `app/page.tsx`**

The root page just redirects. Authenticated users → board. Everyone else → login.

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  redirect(user ? '/board' : '/login')
}
```

- [ ] **Step 5: Test auth flow**

```bash
npm run dev
```

1. Visit `http://localhost:3000` → should redirect to `/login`
2. Create an account via the signup page → check email for confirmation
3. After confirming email, sign in → should redirect to `/board` (which shows a 404 — that's fine for now)
4. Visit `http://localhost:3000/login` while logged in → should redirect to `/board`

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/login/page.tsx app/signup/page.tsx app/auth/callback/route.ts
git commit -m "feat: add login, signup, Google OAuth, and auth callback"
```

---

## Task 8: Board layout

**Files:**
- Create: `app/board/layout.tsx`

📚 **What is a nested layout?** In Next.js App Router, layouts can nest. `app/layout.tsx` wraps every page. `app/board/layout.tsx` additionally wraps every page inside `/board`. It's useful for adding a persistent header or sidebar that only appears in the board section.

- [ ] **Step 1: Create `app/board/layout.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function BoardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <>{children}</>
}
```

- [ ] **Step 2: Commit**

```bash
git add app/board/layout.tsx
git commit -m "feat: add board layout with server-side auth check"
```

---

## Task 9: StatsBar component

**Files:**
- Create: `components/stats/StatsBar.tsx`

📚 **What is a React prop?** A prop (short for "property") is how you pass data into a component. Like a function parameter. `<StatsBar jobs={jobs} />` passes the `jobs` array to the component. Inside the component, you access it via `{ jobs }` in the function parameters.

- [ ] **Step 1: Create `components/stats/StatsBar.tsx`**

```tsx
'use client'

import { Job } from '@/lib/types'

interface StatsBarProps {
  jobs: Job[]
}

export function StatsBar({ jobs }: StatsBarProps) {
  const total = jobs.length
  const interviews = jobs.filter(j => j.status === 'interviewing').length
  const offers = jobs.filter(j => j.status === 'offer').length
  const responded = jobs.filter(j => j.status !== 'applied').length
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0

  const stats = [
    {
      value: total,
      label: 'TOTAL APPLICATIONS',
      color: '#38bdf8',
      bg: 'rgba(56,189,248,0.08)',
      border: 'rgba(56,189,248,0.2)',
      icon: '◈',
    },
    {
      value: interviews,
      label: 'ACTIVE INTERVIEWS',
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.08)',
      border: 'rgba(167,139,250,0.2)',
      icon: '◆',
    },
    {
      value: `${responseRate}%`,
      label: 'RESPONSE RATE',
      color: '#fbbf24',
      bg: 'rgba(251,191,36,0.08)',
      border: 'rgba(251,191,36,0.2)',
      icon: '▲',
    },
    {
      value: offers,
      label: 'OFFERS RECEIVED',
      color: '#34d399',
      bg: 'rgba(52,211,153,0.08)',
      border: 'rgba(52,211,153,0.2)',
      icon: '★',
    },
  ]

  return (
    <div
      className="grid grid-cols-4"
      style={{ borderBottom: '1px solid rgba(56,189,248,0.1)' }}
    >
      {stats.map((stat, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-6 py-4"
          style={{
            borderRight: i < 3 ? '1px solid rgba(56,189,248,0.08)' : 'none',
          }}
        >
          <div
            className="w-10 h-10 flex items-center justify-center rounded-md flex-shrink-0 text-base"
            style={{ background: stat.bg, border: `1px solid ${stat.border}`, color: stat.color }}
          >
            {stat.icon}
          </div>
          <div>
            <div className="text-2xl font-bold leading-none" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="text-xs tracking-widest mt-1" style={{ color: '#475569' }}>
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/stats/StatsBar.tsx
git commit -m "feat: add StatsBar component"
```

---

## Task 10: JobCard component

**Files:**
- Create: `components/board/JobCard.tsx`

📚 **What is `forwardRef`?** `@dnd-kit` needs to attach a DOM reference to your card element so it can measure and move it during drag. React's `forwardRef` lets a parent component pass a `ref` (a direct reference to the underlying DOM element) into your component. We'll use this in the next task when we add drag-and-drop.

- [ ] **Step 1: Install Lucide React for icons**

```bash
npm install lucide-react
```

- [ ] **Step 2: Create `components/board/JobCard.tsx`**

```tsx
'use client'

import { forwardRef } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Job } from '@/lib/types'

interface JobCardProps {
  job: Job
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
  isDragging?: boolean
  style?: React.CSSProperties
  [key: string]: unknown  // allows dnd-kit to spread drag attributes
}

export const JobCard = forwardRef<HTMLDivElement, JobCardProps>(
  ({ job, onEdit, onDelete, isDragging, style, ...props }, ref) => {
    const formattedDate = new Date(job.date_applied + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).toUpperCase()

    const accentColors: Record<string, string> = {
      applied: '#38bdf8',
      interviewing: '#a78bfa',
      offer: '#34d399',
      rejected: 'transparent',
    }
    const accentColor = accentColors[job.status]
    const isRejected = job.status === 'rejected'

    return (
      <div
        ref={ref}
        style={{
          ...style,
          background: 'rgba(15,23,42,0.9)',
          border: `1px solid ${isDragging ? 'rgba(56,189,248,0.4)' : 'rgba(56,189,248,0.08)'}`,
          borderRadius: '8px',
          padding: '14px',
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: isRejected ? 0.5 : 1,
          transform: isDragging ? 'rotate(2deg) scale(1.02)' : undefined,
          boxShadow: isDragging ? '0 16px 40px rgba(0,0,0,0.4)' : undefined,
          position: 'relative',
          overflow: 'hidden',
          transition: isDragging ? 'none' : 'border-color 0.15s, box-shadow 0.15s',
        }}
        className="group"
        {...props}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '2px',
            background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          }}
        />

        <div className="flex items-start justify-between gap-2 mb-1">
          <div
            className="text-sm font-bold leading-tight"
            style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }}
          >
            {job.company}
          </div>
          {/* Edit/delete buttons — visible on hover */}
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(job) }}
              className="w-6 h-6 flex items-center justify-center rounded"
              style={{ border: '1px solid rgba(56,189,248,0.15)', background: 'rgba(56,189,248,0.05)', color: '#64748b' }}
            >
              <Pencil size={10} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(job.id) }}
              className="w-6 h-6 flex items-center justify-center rounded"
              style={{ border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.05)', color: '#64748b' }}
            >
              <Trash2 size={10} />
            </button>
          </div>
        </div>

        <div className="text-xs mb-3" style={{ color: '#64748b', letterSpacing: '0.02em' }}>
          {job.role}
        </div>

        <div className="text-xs" style={{ color: '#334155', letterSpacing: '0.05em' }}>
          {formattedDate}
        </div>

        {job.notes && (
          <div
            className="mt-3 pt-3 text-xs leading-relaxed line-clamp-2"
            style={{
              borderTop: '1px solid rgba(56,189,248,0.06)',
              color: '#475569',
              letterSpacing: '0.02em',
            }}
          >
            {job.notes}
          </div>
        )}
      </div>
    )
  }
)

JobCard.displayName = 'JobCard'
```

- [ ] **Step 3: Commit**

```bash
git add components/board/JobCard.tsx
git commit -m "feat: add JobCard component with hover actions"
```

---

## Task 11: JobModal component

**Files:**
- Create: `components/modals/JobModal.tsx`

📚 **What is a controlled form?** In React, a "controlled" input means React owns the value — you store it in `useState` and update it with `onChange`. Every keystroke calls `setCompany(e.target.value)`, which updates the state, which re-renders the input with the new value. This is the standard React pattern for forms.

📚 **What is `useEffect`?** A hook that runs side effects — code that runs after rendering. Here we use it to populate the form fields when editing an existing job (we copy the job's data into the form state when `job` prop changes).

- [ ] **Step 1: Create `components/modals/JobModal.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Job, JobFormData, JobStatus, COLUMNS } from '@/lib/types'

interface JobModalProps {
  open: boolean
  job: Job | null          // null = adding new; Job = editing existing
  defaultStatus?: JobStatus
  onSave: (data: JobFormData) => Promise<void>
  onClose: () => void
}

const emptyForm = (): JobFormData => ({
  company: '',
  role: '',
  status: 'applied',
  date_applied: new Date().toISOString().split('T')[0],
  notes: null,
})

export function JobModal({ open, job, defaultStatus, onSave, onClose }: JobModalProps) {
  const [form, setForm] = useState<JobFormData>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // When editing, populate form with the job's current values
  useEffect(() => {
    if (job) {
      setForm({
        company: job.company,
        role: job.role,
        status: job.status,
        date_applied: job.date_applied,
        notes: job.notes,
      })
    } else {
      setForm({ ...emptyForm(), status: defaultStatus ?? 'applied' })
    }
    setError(null)
  }, [job, defaultStatus, open])

  if (!open) return null

  function set<K extends keyof JobFormData>(key: K, value: JobFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.company.trim() || !form.role.trim()) {
      setError('Company and role are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({ ...form, notes: form.notes?.trim() || null })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-7 relative"
        style={{
          background: '#0f172a',
          border: '1px solid rgba(56,189,248,0.2)',
          boxShadow: '0 0 60px rgba(56,189,248,0.06), 0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Top glow line */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: '15%', right: '15%', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.5), transparent)',
          }}
        />

        <div className="flex items-center justify-between mb-6">
          <span className="text-xs tracking-widest" style={{ color: '#38bdf8' }}>
            {job ? '// EDIT APPLICATION' : '// NEW APPLICATION'}
          </span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded"
            style={{ color: '#475569', border: '1px solid rgba(56,189,248,0.1)' }}
          >
            <X size={12} />
          </button>
        </div>

        {error && (
          <div
            className="mb-4 px-3 py-2 text-xs rounded"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs tracking-widest mb-1.5" style={{ color: '#475569' }}>
                COMPANY *
              </label>
              <input
                value={form.company}
                onChange={e => set('company', e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-200 rounded-md outline-none"
                style={{ background: 'rgba(7,11,20,0.8)', border: '1px solid rgba(56,189,248,0.15)' }}
                placeholder="Stripe"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest mb-1.5" style={{ color: '#475569' }}>
                STATUS
              </label>
              <select
                value={form.status}
                onChange={e => set('status', e.target.value as JobStatus)}
                className="w-full px-3 py-2 text-xs rounded-md outline-none"
                style={{
                  background: 'rgba(7,11,20,0.8)',
                  border: '1px solid rgba(56,189,248,0.15)',
                  color: '#38bdf8',
                }}
              >
                {COLUMNS.map(col => (
                  <option key={col.id} value={col.id}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs tracking-widest mb-1.5" style={{ color: '#475569' }}>
              ROLE *
            </label>
            <input
              value={form.role}
              onChange={e => set('role', e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-200 rounded-md outline-none"
              style={{ background: 'rgba(7,11,20,0.8)', border: '1px solid rgba(56,189,248,0.15)' }}
              placeholder="Software Engineer"
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest mb-1.5" style={{ color: '#475569' }}>
              DATE APPLIED
            </label>
            <input
              type="date"
              value={form.date_applied}
              onChange={e => set('date_applied', e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-200 rounded-md outline-none"
              style={{
                background: 'rgba(7,11,20,0.8)',
                border: '1px solid rgba(56,189,248,0.15)',
                colorScheme: 'dark',
              }}
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest mb-1.5" style={{ color: '#475569' }}>
              NOTES (OPTIONAL)
            </label>
            <textarea
              value={form.notes ?? ''}
              onChange={e => set('notes', e.target.value || null)}
              rows={3}
              className="w-full px-3 py-2 text-xs text-slate-200 rounded-md outline-none resize-none"
              style={{ background: 'rgba(7,11,20,0.8)', border: '1px solid rgba(56,189,248,0.15)' }}
              placeholder="Referral, recruiter name, interview details..."
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs tracking-widest rounded-md"
              style={{ border: '1px solid rgba(56,189,248,0.15)', color: '#64748b' }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-xs font-bold tracking-widest rounded-md disabled:opacity-50"
              style={{ background: '#38bdf8', color: '#070b14' }}
            >
              {saving ? 'SAVING...' : 'SAVE APPLICATION'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/modals/JobModal.tsx
git commit -m "feat: add JobModal for add/edit"
```

---

## Task 12: KanbanColumn component

**Files:**
- Create: `components/board/KanbanColumn.tsx`

📚 **What is `useDroppable`?** A hook from `@dnd-kit` that marks a DOM element as a "drop zone." When a dragged item is released over this element, the `onDragEnd` event fires with this element's `id` in the `over` field. That's how we know which column the card was dropped into.

- [ ] **Step 1: Install dnd-kit**

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

- [ ] **Step 2: Create `components/board/KanbanColumn.tsx`**

```tsx
'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Column, Job } from '@/lib/types'
import { SortableJobCard } from './SortableJobCard'

interface KanbanColumnProps {
  column: Column
  jobs: Job[]
  onAdd: () => void
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
}

export function KanbanColumn({ column, jobs, onAdd, onEdit, onDelete }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className="flex flex-col min-h-full">
      {/* Column header */}
      <div
        className="flex items-center justify-between pb-3 mb-3"
        style={{
          borderBottom: `1px solid ${isOver ? column.borderColor + '60' : column.borderColor + '30'}`,
          transition: 'border-color 0.15s',
        }}
      >
        <span
          className="text-xs font-bold tracking-widest"
          style={{ color: column.borderColor === 'transparent' ? '#475569' : column.borderColor }}
        >
          {column.label}
        </span>
        <span
          className="text-xs font-bold w-5 h-5 flex items-center justify-center rounded"
          style={{
            background: column.borderColor === 'transparent'
              ? 'rgba(100,116,139,0.1)'
              : `${column.borderColor}18`,
            color: column.borderColor === 'transparent' ? '#475569' : column.borderColor,
          }}
        >
          {jobs.length}
        </span>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2.5 flex-1 min-h-16 rounded-lg transition-colors"
        style={{
          background: isOver ? 'rgba(56,189,248,0.03)' : 'transparent',
          padding: isOver ? '6px' : '0',
        }}
      >
        <SortableContext
          items={jobs.map(j => j.id)}
          strategy={verticalListSortingStrategy}
        >
          {jobs.map(job => (
            <SortableJobCard
              key={job.id}
              job={job}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
      </div>

      {/* Add card button */}
      <button
        onClick={onAdd}
        className="mt-3 flex items-center justify-center gap-2 py-3 text-xs tracking-widest rounded-lg transition-colors"
        style={{
          border: '1px dashed rgba(56,189,248,0.12)',
          color: '#334155',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'
          e.currentTarget.style.color = '#38bdf8'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(56,189,248,0.12)'
          e.currentTarget.style.color = '#334155'
        }}
      >
        <Plus size={12} />
        ADD
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/board/SortableJobCard.tsx`**

📚 **What is `useSortable`?** A `@dnd-kit` hook that makes an element draggable AND sortable within a list. It gives us `attributes` (ARIA accessibility), `listeners` (mouse/touch events), `setNodeRef` (DOM reference), and `transform`/`transition` (CSS values for the drag animation).

```tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Job } from '@/lib/types'
import { JobCard } from './JobCard'

interface SortableJobCardProps {
  job: Job
  onEdit: (job: Job) => void
  onDelete: (id: string) => void
}

export function SortableJobCard({ job, onEdit, onDelete }: SortableJobCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <JobCard
      ref={setNodeRef}
      job={job}
      onEdit={onEdit}
      onDelete={onDelete}
      isDragging={false}
      style={style}
      {...attributes}
      {...listeners}
    />
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/board/KanbanColumn.tsx components/board/SortableJobCard.tsx
git commit -m "feat: add KanbanColumn and SortableJobCard with dnd-kit"
```

---

## Task 13: SearchBar and FilterChips components

**Files:**
- Create: `components/ui/SearchBar.tsx`
- Create: `components/ui/FilterChips.tsx`

- [ ] **Step 1: Create `components/ui/SearchBar.tsx`**

```tsx
'use client'

import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-md w-52"
      style={{ background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.15)' }}
    >
      <Search size={12} style={{ color: '#38bdf8', opacity: 0.5, flexShrink: 0 }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="SEARCH_"
        className="bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600 w-full tracking-widest"
      />
    </div>
  )
}
```

- [ ] **Step 2: Create `components/ui/FilterChips.tsx`**

```tsx
'use client'

type FilterValue = 'all' | 'active' | 'offers'

interface FilterChipsProps {
  value: FilterValue
  onChange: (value: FilterValue) => void
}

const filters: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'ALL' },
  { value: 'active', label: 'ACTIVE' },
  { value: 'offers', label: 'OFFERS' },
]

export function FilterChips({ value, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2">
      {filters.map(f => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className="px-3 py-1.5 text-xs tracking-widest rounded transition-colors"
          style={
            value === f.value
              ? { background: 'rgba(56,189,248,0.15)', border: '1px solid #38bdf8', color: '#38bdf8' }
              : { background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.15)', color: '#64748b' }
          }
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/SearchBar.tsx components/ui/FilterChips.tsx
git commit -m "feat: add SearchBar and FilterChips UI components"
```

---

## Task 14: KanbanBoard — the main client component

**Files:**
- Create: `components/board/KanbanBoard.tsx`

📚 **What is `useState`?** A React hook that creates a piece of state — data that, when changed, causes React to re-render the component with the new value. `const [jobs, setJobs] = useState(initialJobs)` creates a `jobs` variable and a `setJobs` function. Call `setJobs(newArray)` to update the board.

📚 **What is an optimistic update?** Instead of waiting for the server to respond before updating the UI, we update the state immediately (so the UI feels instant), then send the request to the database in the background. If the request fails, we show an error. This makes the app feel fast.

📚 **What is `DndContext`?** The top-level component from `@dnd-kit` that enables drag-and-drop for everything inside it. The `onDragEnd` callback fires when a drag operation completes, giving us the `active` (what was dragged) and `over` (where it was dropped) items.

- [ ] **Step 1: Create `components/board/KanbanBoard.tsx`**

```tsx
'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { LogOut, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Job, JobFormData, JobStatus, COLUMNS } from '@/lib/types'
import { KanbanColumn } from './KanbanColumn'
import { JobCard } from './JobCard'
import { JobModal } from '../modals/JobModal'
import { StatsBar } from '../stats/StatsBar'
import { SearchBar } from '../ui/SearchBar'
import { FilterChips } from '../ui/FilterChips'

interface KanbanBoardProps {
  initialJobs: Job[]
  userEmail: string
}

type FilterValue = 'all' | 'active' | 'offers'

export function KanbanBoard({ initialJobs, userEmail }: KanbanBoardProps) {
  const supabase = createClient()

  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<JobStatus>('applied')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterValue>('all')
  const [activeJob, setActiveJob] = useState<Job | null>(null) // job being dragged

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filteredJobs = jobs.filter(job => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      job.company.toLowerCase().includes(q) ||
      job.role.toLowerCase().includes(q)

    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && ['applied', 'interviewing'].includes(job.status)) ||
      (filter === 'offers' && job.status === 'offer')

    return matchesSearch && matchesFilter
  })

  function getColumnJobs(status: JobStatus): Job[] {
    return filteredJobs
      .filter(j => j.status === status)
      .sort((a, b) => a.position - b.position)
  }

  // ── Open modal helpers ────────────────────────────────────────────────────
  function openAddModal(status: JobStatus) {
    setEditingJob(null)
    setDefaultStatus(status)
    setModalOpen(true)
  }

  function openEditModal(job: Job) {
    setEditingJob(job)
    setModalOpen(true)
  }

  // ── CRUD operations ───────────────────────────────────────────────────────
  const handleSave = useCallback(async (data: JobFormData) => {
    if (editingJob) {
      // UPDATE
      const updated: Job = { ...editingJob, ...data }
      setJobs(prev => prev.map(j => j.id === editingJob.id ? updated : j))
      const { error } = await supabase
        .from('jobs')
        .update({ ...data })
        .eq('id', editingJob.id)
      if (error) throw new Error(error.message)
    } else {
      // INSERT — insert optimistically with a temp id
      const tempId = `temp-${Date.now()}`
      const position = jobs.filter(j => j.status === data.status).length
      const optimistic: Job = {
        id: tempId,
        user_id: '',
        created_at: new Date().toISOString(),
        position,
        ...data,
        notes: data.notes ?? null,
      }
      setJobs(prev => [...prev, optimistic])

      const { data: inserted, error } = await supabase
        .from('jobs')
        .insert({ ...data, position })
        .select()
        .single()

      if (error) {
        setJobs(prev => prev.filter(j => j.id !== tempId))
        throw new Error(error.message)
      }
      setJobs(prev => prev.map(j => j.id === tempId ? inserted : j))
    }
  }, [editingJob, jobs, supabase])

  const handleDelete = useCallback(async (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id))
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (error) console.error('Delete failed:', error.message)
  }, [supabase])

  // ── Drag and drop ─────────────────────────────────────────────────────────
  function handleDragStart(event: DragStartEvent) {
    const job = jobs.find(j => j.id === event.active.id)
    setActiveJob(job ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeJob = jobs.find(j => j.id === activeId)
    if (!activeJob) return

    // Check if we're hovering over a column (status string) or a card (UUID)
    const isOverColumn = COLUMNS.some(c => c.id === overId)
    const overJob = jobs.find(j => j.id === overId)
    const newStatus: JobStatus = isOverColumn
      ? (overId as JobStatus)
      : (overJob?.status ?? activeJob.status)

    if (activeJob.status !== newStatus) {
      setJobs(prev =>
        prev.map(j => j.id === activeId ? { ...j, status: newStatus } : j)
      )
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveJob(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const activeJob = jobs.find(j => j.id === activeId)
    if (!activeJob) return

    const isOverColumn = COLUMNS.some(c => c.id === overId)
    const targetStatus: JobStatus = isOverColumn
      ? (overId as JobStatus)
      : (jobs.find(j => j.id === overId)?.status ?? activeJob.status)

    // Reorder within the column
    const columnJobs = jobs
      .filter(j => j.status === targetStatus)
      .sort((a, b) => a.position - b.position)

    const oldIndex = columnJobs.findIndex(j => j.id === activeId)
    const newIndex = isOverColumn
      ? columnJobs.length - 1
      : columnJobs.findIndex(j => j.id === overId)

    const reordered = arrayMove(columnJobs, oldIndex < 0 ? 0 : oldIndex, newIndex < 0 ? 0 : newIndex)
    const positionUpdates = reordered.map((j, i) => ({ ...j, position: i, status: targetStatus }))

    setJobs(prev => {
      const others = prev.filter(j => j.status !== targetStatus || j.id === activeId)
      return [...prev.filter(j => j.status !== targetStatus), ...positionUpdates]
    })

    // Persist all position + status changes
    await Promise.all(
      positionUpdates.map(j =>
        supabase.from('jobs').update({ status: j.status, position: j.position }).eq('id', j.id)
      )
    )
  }

  // ── Sign out ──────────────────────────────────────────────────────────────
  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex flex-col min-h-screen" data-above-grid>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
        style={{
          borderBottom: '1px solid rgba(56,189,248,0.1)',
          background: 'rgba(7,11,20,0.9)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ border: '1.5px solid #38bdf8', color: '#38bdf8' }}
          >
            JT
          </div>
          <span className="text-sm font-bold tracking-widest text-slate-200">
            JOB<span style={{ color: '#38bdf8' }}>.</span>TRACKER
          </span>
          <span
            className="flex items-center gap-1.5 text-xs ml-2"
            style={{ color: '#34d399' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: '#34d399', animation: 'pulse 2s infinite' }}
            />
            LIVE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <FilterChips value={filter} onChange={setFilter} />
          <button
            onClick={() => openAddModal('applied')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold tracking-widest rounded-md"
            style={{ background: '#38bdf8', color: '#070b14' }}
          >
            <Plus size={12} />
            NEW APPLICATION
          </button>
          <button
            onClick={handleSignOut}
            className="w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold"
            title={`Sign out (${userEmail})`}
            style={{
              border: '1.5px solid rgba(56,189,248,0.25)',
              background: 'rgba(56,189,248,0.05)',
              color: '#64748b',
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <StatsBar jobs={jobs} />

      {/* Kanban board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4 p-6 flex-1">
          {COLUMNS.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              jobs={getColumnJobs(column.id)}
              onAdd={() => openAddModal(column.id)}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Ghost card shown while dragging */}
        <DragOverlay>
          {activeJob ? (
            <JobCard
              job={activeJob}
              onEdit={() => {}}
              onDelete={() => {}}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modal */}
      <JobModal
        open={modalOpen}
        job={editingJob}
        defaultStatus={defaultStatus}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/board/KanbanBoard.tsx
git commit -m "feat: add KanbanBoard with full CRUD and drag-and-drop"
```

---

## Task 15: Board page (server-side data fetch)

**Files:**
- Create: `app/board/page.tsx`

📚 **Why fetch on the server?** When `board/page.tsx` runs on the server, it fetches your jobs from Supabase before sending any HTML to the browser. The user sees a fully rendered board immediately — no loading spinner. This is the main benefit of Server Components with App Router.

- [ ] **Step 1: Create `app/board/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import { redirect } from 'next/navigation'
import { Job } from '@/lib/types'

export default async function BoardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .order('position', { ascending: true })

  if (error) {
    console.error('Failed to load jobs:', error.message)
  }

  return (
    <KanbanBoard
      initialJobs={(jobs ?? []) as Job[]}
      userEmail={user.email ?? ''}
    />
  )
}
```

- [ ] **Step 2: Test the full flow**

```bash
npm run dev
```

1. Visit `http://localhost:3000` — should redirect to `/login`
2. Sign in (email or Google)
3. Should land on `/board` with the kanban board visible
4. Click "NEW APPLICATION" → modal should appear
5. Fill in a job and save → card should appear in the Applied column
6. Edit and delete a card
7. Stats bar should update as you add jobs

- [ ] **Step 3: Commit**

```bash
git add app/board/page.tsx
git commit -m "feat: add board page with server-side job fetch"
```

---

## Task 16: PWA setup

**Files:**
- Create: `public/manifest.json`
- Create: `public/icons/icon-192.png` (manual step)
- Create: `public/icons/icon-512.png` (manual step)
- Modify: `next.config.ts`

📚 **What is a PWA?** A Progressive Web App is a website that behaves like a native app. On mobile, the user sees an "Add to Home Screen" prompt. After installing, it opens full-screen without the browser's address bar. It can work offline. Three things enable this: a manifest file, a service worker, and HTTPS.

📚 **What is a service worker?** A JavaScript file that runs in the background — separate from your web page. It intercepts network requests and can serve cached responses when offline. `@ducanh2912/next-pwa` generates this file automatically.

📚 **What is `next.config.ts`?** The configuration file for your Next.js project. Everything about how Next.js builds and runs your app is configured here — including plugins like `next-pwa`.

- [ ] **Step 1: Install next-pwa**

```bash
npm install @ducanh2912/next-pwa
```

- [ ] **Step 2: Create `public/manifest.json`**

```json
{
  "name": "JobTracker",
  "short_name": "JobTracker",
  "description": "Track your job applications like a mission.",
  "start_url": "/board",
  "display": "standalone",
  "background_color": "#070b14",
  "theme_color": "#070b14",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 3: Generate app icons**

Create a simple 512×512 icon image (dark navy background, "JT" text in cyan) and save it as `public/icons/icon-512.png`. Then create a 192×192 version at `public/icons/icon-192.png`.

Quickest option — use any online favicon generator (e.g., https://favicon.io/favicon-generator/):
- Text: JT
- Background: #070b14
- Font color: #38bdf8
- Download the 192×192 and 512×512 PNGs and place them in `public/icons/`

- [ ] **Step 4: Replace `next.config.ts`**

```ts
import type { NextConfig } from 'next'
import withPWA from '@ducanh2912/next-pwa'

const nextConfig: NextConfig = {
  // no extra config needed
}

export default withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig)
```

- [ ] **Step 5: Add generated files to `.gitignore`**

Add to `.gitignore`:
```
/public/sw.js
/public/workbox-*.js
/public/worker-*.js
/public/sw.js.map
/public/workbox-*.js.map
```

- [ ] **Step 6: Test PWA**

```bash
npm run build && npm run start
```

Open `http://localhost:3000` in Chrome. Open DevTools → Application → Manifest. You should see the app manifest loaded. On mobile (or using Chrome's "Add to Home Screen" option in the address bar menu), you should be able to install the app.

- [ ] **Step 7: Commit**

```bash
git add public/manifest.json public/icons/ next.config.ts .gitignore
git commit -m "feat: add PWA manifest and service worker via next-pwa"
```

---

## Task 17: Deploy to Vercel

📚 **What is Vercel?** Vercel is the hosting platform built by the same team that made Next.js. You push your code to GitHub, connect the repo to Vercel, and it automatically builds and deploys your app. Every new git push triggers a new deployment. It provides HTTPS automatically, which is required for the PWA install prompt.

📚 **What is a production build?** Running `npm run dev` starts a development server — it's slow, has extra debugging tools, and is only for your machine. `npm run build` creates an optimized production bundle — minified JavaScript, no debugging overhead. Vercel runs `npm run build` automatically when you deploy.

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin https://github.com/mateofalco0/jobtracker.git
git push -u origin main
```
(Create the repo on https://github.com/new first if it doesn't exist)

- [ ] **Step 2: Connect to Vercel**

1. Go to https://vercel.com → New Project
2. Import your GitHub repo `jobtracker`
3. Vercel auto-detects Next.js — no build settings needed
4. Before deploying: click "Environment Variables" and add:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key
5. Click "Deploy"

- [ ] **Step 3: Add Vercel URL to Supabase**

After deployment, Vercel gives you a URL like `https://jobtracker-abc123.vercel.app`.

In Supabase dashboard → Authentication → URL Configuration:
- Site URL: `https://your-vercel-url.vercel.app`
- Add to Redirect URLs: `https://your-vercel-url.vercel.app/auth/callback`

In Google Cloud Console → your OAuth client → Authorized redirect URIs:
- Add: `https://your-vercel-url.vercel.app/auth/callback`

- [ ] **Step 4: Verify production deployment**

Visit your Vercel URL:
1. Sign in with Google
2. Add a job application
3. Drag a card between columns
4. On mobile: check for "Add to Home Screen" prompt
5. Install and open from home screen — should open full-screen

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: production-ready JobTracker PWA"
git push
```

---

## Self-Review Notes

- All 11 spec requirements covered across 17 tasks
- No TBD or TODO placeholders — every step has complete code
- Types defined in Task 3 (`Job`, `JobFormData`, `COLUMNS`, `JobStatus`) used consistently across all components
- `StatsBar` correctly typed as Client Component receiving `jobs: Job[]` prop (spec inconsistency fixed)
- `handleSave` uses temp ID for optimistic insert, replaces with real ID on success
- Drag-and-drop handles both cross-column moves (status change) and within-column reordering (position update)
- Google OAuth SVG icon included inline in both login and signup — no external icon library dependency for brand logos
