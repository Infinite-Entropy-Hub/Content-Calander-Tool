# AI Internal Log & State

**DO NOT DELETE - THIS FILE IS FOR AI CONTEXT RETENTION**

This file tracks the architecture, active features, and manual fixes applied to this project so that I don't lose context between sessions.

## 🏗️ Architecture Pivot Log
- **Initially**: Used mock data.
- **Then**: Switched to Prisma + SQLite (Local Dev).
- **Current**: Scrapped Prisma. Using **Supabase v2** exclusively for DB, Auth, and Storage. 

## 🚨 CRITICAL CONTEXT (READ THIS EVERY TIME)
- **Supabase Over Prisma**: DO NOT try to import `@prisma/client` or `src/lib/prisma.ts`. It has been uninstalled. Always use `supabase.from()` from `src/lib/supabase.ts`.
- **Auth**: We use `supabase.auth`. Users login via email. The user has explicitly **disabled email confirmations** in their Supabase dashboard so `signInWithPassword` works immediately after `signUp`.
- **Database setup**: The database SQL migrations are kept manually in the `supabase_queries/` folder. If we add new features, we must add a new `3_xxx.sql` file in there so the user can run it in their Supabase SQL editor!
- **Storage**: We use a public Supabase Storage bucket named `media`.
- **Styling**: `shadcn/ui` with `Tailwind CSS`. Do NOT use `asChild` on `SidebarMenuButton` because the updated radix/base-ui components throw a React warning (`React does not recognize the asChild prop on a DOM element`).

## 🛠️ Current Features
- `ContentCalendar` fetches posts from `posts` table using RLS.
- `NewPostDialog` uploads directly to `media` bucket (or accepts raw URL) and inserts into `posts` table.
- `ProfilePage` (`/profile`) allows selecting 15+ icon avatars saved to the `profiles` table.
- `SidebarLayout` dynamically loads the selected icon avatar in the bottom left.

## 🐛 Known Fixes & Gotchas
- **RLS Issues**: If the user gets `Error saving post: new row violates row-level security policy`, it means they didn't run the `INSERT` or `SELECT` policies correctly in the Supabase Dashboard SQL Editor. Check `supabase_queries/2_fix_rls_and_recreate.sql`.
- **Hydration Errors**: Removed `asChild` from `SheetTrigger` and `SidebarMenuButton` to prevent nested button rendering errors.

*(Append new architectural decisions or persistent bugs here so context is never lost.)*
