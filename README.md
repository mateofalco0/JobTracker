# JobTracker

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Gemini](https://img.shields.io/badge/Google-Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)

I built this because I was applying to jobs and tracking everything in a spreadsheet, which quickly became a mess. I wanted something visual that shows the full picture at a glance — where each application stands, how many interviews I have active, what my response rate looks like. I also wanted AI built into the workflow, not bolted on as an afterthought. The result is a Kanban board for job searching with four Gemini-powered features that cover the most time-consuming parts: filling in application details, preparing for interviews, and making sense of the search as a whole.

**Live demo: [job-tracker-mf.vercel.app](https://job-tracker-mf.vercel.app)**

---

## Features

**Kanban board with drag and drop.** There are four columns — Applied, Interviewing, Offer, and Rejected — matching the stages of a real job search. You can drag cards between columns to update their status, and reorder cards within a column to prioritize what you're following up on. The position of every card is saved to the database so the board looks the same when you come back.

**Stats bar.** At the top of the board there's a row showing total applications, active interviews, number of offers, and response rate (calculated as the percentage of applications that turned into an interview or offer). It updates as you move cards around.

**Search and filters.** You can search by company name or role title. There are also three filter buttons — All, Active (just the applied and interviewing columns), and Offers — so you can quickly focus on what matters at any point in the search.

**Add, edit, and delete applications.** Clicking the add button opens a modal where you fill in the company, role, status, date applied, and an optional notes field. You can go back and edit any card, or delete it if the application is no longer relevant.

**Authentication.** The app supports Google OAuth and email/password sign-in. Every user's data is completely separate — you only ever see your own applications.

**Installable on mobile.** The app is a Progressive Web App, which means on iOS and Android you can add it to your home screen and it opens full-screen like a native app. The service worker caches assets so it loads fast on repeat visits.

---

## AI Features

All four AI features call the Google Gemini 2.5 Flash model. Gemini is fast and cheap, which matters for a personal project, and the 2.5 Flash model handles structured extraction from messy text reliably.

**Auto-fill from job description.** When adding a new application, there's a "Paste job description" button in the modal header. You paste the full job posting — however long, however formatted — and the app sends it to Gemini, which extracts the company name, job title, and a two or three sentence summary of the role and requirements. Those get dropped directly into the form fields. This saves the copy-pasting that happens with every application and gives you a usable notes entry without having to write one yourself.

**AI application tips.** Each job card has a lightbulb icon that appears on hover. Clicking it opens a modal that shows five specific tips for improving your chances at that particular role and company. The tips are scoped to what you're actually applying for, not generic advice. For a senior backend role at a fintech startup you get different tips than for a junior frontend role at an agency.

**Interview prep.** Cards in the Interviewing column have a second AI button — a chat icon — that generates eight likely interview questions for that specific role and company, each with a short hint about how to approach the answer. This takes maybe thirty seconds and gives you a solid starting point before an interview.

**Job search summary.** There's an "AI Summary" button in the navbar that looks at all your applications — every company, role, and status — and returns an analysis with four sections: an overall assessment of where the search stands, what's going well, what could be improved, and three concrete next steps. It's useful when you're deep in the search and need an outside perspective on the data.

---

## Tech Stack

**Next.js 16 with the App Router.** The App Router introduced Server Components, which let you fetch data on the server before sending any HTML to the browser. The board page fetches all the user's jobs server-side, so when the page loads, it's already populated — no loading spinner, no layout shift. I chose the App Router over the Pages Router specifically for this: first-load performance is noticeably better when the data is already there.

**TypeScript.** The job data flows through a lot of places — the database, API responses, component props, form state. Having a `Job` type that's shared across all of them means if I change the shape of the data, TypeScript tells me everywhere that breaks. It's slower to write at first but it catches a category of bugs that are otherwise invisible until runtime.

**Supabase.** Supabase is a hosted Postgres database with built-in authentication and a JavaScript client. I chose it over Firebase because Postgres is a real relational database with proper constraints, foreign keys, and Row Level Security. Firebase is a document store that requires you to write security rules in a separate config file. With Supabase, I can enforce that users only see their own data directly in the database, which is a stronger guarantee than anything at the application level.

**Tailwind CSS.** Utility classes co-located with the JSX. I find it faster to work with than writing separate CSS files — you see the styles and the structure in the same place. The tradeoff is that class strings get long, but for a project this size that's fine.

**@dnd-kit.** The drag-and-drop library. `react-beautiful-dnd`, which was the standard choice for years, is no longer maintained and doesn't work properly with React 18 and 19. @dnd-kit is actively maintained, works with the latest React, and is headless — it handles the drag logic but doesn't impose any styles, so the cards look exactly how I want them to.

**Vercel.** Zero-config deployment for Next.js. Push to main, it deploys. The free tier is enough for a personal project and it handles the HTTPS that PWAs require.

---

## Architecture

### How the board works

The board page is a Server Component that runs on the server, fetches all the user's jobs from Supabase, and passes them as a prop to `KanbanBoard` — a Client Component that owns all the interactive state. From that point on, everything is client-side: search filtering, drag-and-drop, opening modals. When you make a change — drag a card, add a job, delete one — the local state updates immediately so the UI responds instantly, and then the database call runs in the background. If the database call fails, the state rolls back and an error appears. This pattern (optimistic updates) is what makes the app feel fast despite round-trips to a hosted database.

The stats bar and search both read from the same `jobs` array in memory, so they update in real time without any extra network requests.

### Authentication

Supabase Auth handles both Google OAuth and email/password. For Google OAuth, the flow is: the user clicks "Sign in with Google", gets redirected to Google's consent screen, then back to Supabase, then to `/auth/callback` in the app. That route exchanges the temporary code for a session and writes it as a cookie. The `@supabase/ssr` package handles the cookie mechanics — it's built specifically for Next.js App Router and keeps the session token refreshed automatically.

Every request to `/board` passes through `proxy.ts` (Next.js 16's equivalent of `middleware.ts`), which checks for a valid session before the page even starts rendering. If there's no session, you get redirected to the login page before any board HTML is generated.

### AI integration

The Gemini API key lives only on the server. The four AI routes (`/api/ai/parse-job`, `/api/ai/tips`, `/api/ai/interview-prep`, `/api/ai/summary`) are Next.js API routes that run server-side. The browser never sees the API key — it sends a request to `/api/ai/tips`, the server makes the Gemini call with the key from `process.env`, and the browser gets back the result. Putting AI calls in a client component would mean the API key ends up in the browser, which means anyone who opens the network tab can steal it.

The Gemini calls use the REST API directly rather than the official SDK. After running into version and model routing issues with the SDK, I switched to plain `fetch` calls to `generativelanguage.googleapis.com`. The behavior is explicit and there's one fewer dependency. There's also a retry mechanism in `lib/gemini.ts` — if Gemini returns a 429 rate limit error, it waits two seconds and tries once more.

---

## Database Schema

The `jobs` table has nine columns:

- `id` — a UUID generated by the database. Used as the primary key and the drag-and-drop item ID.
- `user_id` — a foreign key to Supabase's internal users table. Every job belongs to one user. If the user account is deleted, their jobs are deleted too (`ON DELETE CASCADE`).
- `company` — the company name. Required.
- `role` — the job title. Required.
- `status` — one of `applied`, `interviewing`, `offer`, or `rejected`. Enforced as a CHECK constraint in the database, not just in TypeScript.
- `date_applied` — the date the application was submitted. Defaults to today.
- `notes` — optional free text. Used for the AI-generated summary or anything the user wants to write.
- `position` — an integer that stores sort order within a column. When you drag a card, every card in the affected column gets its position updated in a batch.
- `created_at` — timestamp, set automatically by the database.

Row Level Security is enabled on the table with a single policy: `auth.uid() = user_id`. This applies to all operations — SELECT, INSERT, UPDATE, DELETE. It means even if application code had a bug that forgot to filter by user, the database would still only return the current user's rows. The isolation is at the infrastructure level, not the application level.

---

## What I Learned

The hardest part of this project was the drag-and-drop across columns. When you drag a card from one column to another, two events fire: `onDragOver` (continuously, while you're holding the card) and `onDragEnd` (once, when you let go). `onDragOver` updates the card's status in state so it visually jumps to the new column while you're still holding it. The problem is that `onDragEnd` has a stale closure — by the time it runs, the React state hasn't necessarily reflected the last `onDragOver` update yet. The fix was to not trust the state inside `onDragEnd` and instead derive the target status fresh from the drag event's own data. That took me a while to track down.

I also spent more time than expected on the AI integration. The official `@google/generative-ai` SDK kept routing to the wrong model versions, so I scrapped it and called the REST API directly. Once I did that, the behavior was completely predictable. The lesson was that an abstraction layer isn't always worth it — sometimes a direct `fetch` call is simpler and easier to reason about.

The thing I got most out of this project was understanding Server Components properly. I'd read about them but building something with real data requirements forced me to actually think about what runs where, and why it matters. The board page rendering with data already in it — no loading state, no skeleton — is a small thing but it's noticeably better, and it comes entirely from moving the data fetch to the server.
