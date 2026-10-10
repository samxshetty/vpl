# Vista Premier League (VPL)

One Next.js app, live on Supabase:

| URL | What |
| --- | --- |
| `/` (and `/user`, which redirects to `/`) | Public site: live matches, standings, fixtures, sport pages |
| `/admin` | Admin: teams, players, fixtures, scores (sign-in required) |

Admin edits are saved to Supabase and pushed to every open browser in real time (Supabase Realtime).

## Setup

1. **Create a Supabase project** at supabase.com.
2. **Create the tables**: Dashboard -> SQL Editor -> paste all of `supabase/schema.sql` -> Run.
3. **Add your keys**: copy `.env.example` to `.env.local` and fill in the project URL and anon key
   (Project Settings -> API).
4. **Create your admin login**: Authentication -> Users -> Add user (email + password, tick *Auto confirm*).
   Then run this in the SQL Editor, with your email:
   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
   where email = 'you@example.com';
   ```
5. **Run it**:
   ```bash
   npm install
   npm run dev
   ```
6. Open `/admin`, sign in, and press **Load sample data** to try it out (only offered while the database is empty).

## How it fits together

- `src/lib/store.ts` is the single live store. `useLiveDB()` (public, read-only) and `useStore()` (admin, with write actions) both read from it.
  It loads everything once, then applies Realtime changes as they arrive. Writes are applied on screen first, then saved in order.
- **Security is the database's job**: anyone can read, but only users with `app_metadata.role = 'admin'` can write
  (Row Level Security in `schema.sql`). `src/proxy.ts` also keeps `/admin` behind the login page.
- The anon key in `.env.local` is meant to be public. Never put a `service_role` key in this app.
- Overall leaderboard: 3 points per win, 1 per draw, every discipline, grouped by section (individual players score for their class).

## Deploying

Add the same two `NEXT_PUBLIC_SUPABASE_*` variables in your host (e.g. Vercel). In Supabase, under
Authentication -> URL Configuration, set the Site URL to your deployed address.
Don't set `NEXT_PUBLIC_ENABLE_DEMO_RESET` in production: it exposes a button that wipes live data.
