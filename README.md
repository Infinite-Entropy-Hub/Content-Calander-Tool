# Content Calendar Tool - Migration & Setup Guide

This document outlines the entire architecture of the Content Calendar Tool and provides a step-by-step guide to migrate, deploy, and set up the project on a completely new domain, database, and environment.

## 🏗️ Architecture Overview

The tool is built on a modern, serverless stack:
- **Frontend/Backend:** Next.js (App Router) hosted on Vercel.
- **Database & Auth:** Supabase (PostgreSQL).
- **File Storage:** Supabase Storage.
- **Email Notifications:** Resend API.
- **Telegram Automation:** Telegram Bot API via Webhooks.
- **Cron Jobs:** A scheduled worker that hits `/api/cron/process-scheduled` to publish posts and send notifications.

---

## 🚀 Step-by-Step Migration Guide

If you are copying this repository to create a brand new Content Calendar Tool for a different brand/domain, follow these steps exactly in order:

### Step 1: Database Setup (Supabase)
1. Go to [Supabase](https://supabase.com/) and create a **New Project**.
2. Go to the **SQL Editor** in the Supabase dashboard.
3. You must run the setup queries located in the `supabase_queries/` folder of this repository. **Run them in numerical order** (from `1_initial_setup.sql` up to `14_...sql`). This creates all tables (`profiles`, `posts`, `integrations`), Row Level Security (RLS) policies, and handles the schema updates.
4. Go to **Storage** and ensure you have a bucket created (e.g., `media`). Note that the SQL scripts in `supabase_queries` (like `4_storage_policies.sql`) might already do this for you, but verify it exists and is public.
5. Go to **Project Settings -> API** and copy:
   - `Project URL` -> this becomes your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` -> this becomes your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` -> this becomes your `SUPABASE_SERVICE_ROLE_KEY` (Required for backend admin tasks like cron jobs!)

### Step 2: Vercel Deployment & Environment Variables
1. Push this code to a new GitHub repository.
2. Go to [Vercel](https://vercel.com/) and click **Add New -> Project**.
3. Import your new GitHub repository.
4. Before clicking Deploy, expand **Environment Variables** and add the following:

```env
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# You will fill these out in the next steps:
RESEND_API_KEY=""
TELEGRAM_BOT_TOKEN=""
NEXT_PUBLIC_APP_URL="https://your-new-domain.com"
```
5. Click **Deploy**.
6. Once deployed, if you have a custom domain (e.g., `brand-calendar.com`), add it to Vercel under **Settings -> Domains**. Ensure `NEXT_PUBLIC_APP_URL` perfectly matches this live domain!

### Step 3: Email Notifications (Resend)
To send emails from your new domain (e.g., `notifications@your-new-domain.com`):
1. Create a [Resend](https://resend.com) account.
2. Go to **Domains** -> **Add Domain**.
3. Enter your new domain. Resend will give you a list of DNS records (TXT, MX).
4. Go back to Vercel -> **Domains** -> Click your domain -> **DNS Records**. Add all the records Resend gave you.
5. Once Resend shows the domain as "Verified", go to **API Keys** and generate a new key.
6. Paste this key into Vercel as `RESEND_API_KEY`.
7. **Important Code Change:** In `src/app/api/cron/process-scheduled/route.ts` and `src/app/api/test-notifications/route.ts`, locate the `from: 'Content Calendar <...>'` line and ensure the email address matches your newly verified domain!

### Step 4: Telegram Bot & Interactive Webhooks
To have a Telegram bot send notifications and accept interactive button clicks (like "Snooze" or "Publish"):
1. Open Telegram and search for `@BotFather`.
2. Type `/newbot` and follow the instructions to create a new bot.
3. BotFather will give you a **Bot Token** (looks like `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`).
4. Add this token to Vercel as `TELEGRAM_BOT_TOKEN`.
5. **CRITICAL - SET THE WEBHOOK**: To make the interactive buttons work, you must tell Telegram where to send the button clicks. Open a web browser and visit this exact URL (replacing the placeholders):
   `https://api.telegram.org/bot<YOUR_NEW_BOT_TOKEN>/setWebhook?url=https://<YOUR_NEW_DOMAIN.COM>/api/telegram-webhook`
6. You should see `{"ok":true,"result":true,"description":"Webhook was set"}`. Your bot is now fully interactive!

### Step 5: The Cron Job (Automation Engine)
The system relies on a cron job to check the database every few minutes for posts that are due.
- The endpoint is `https://<YOUR_NEW_DOMAIN.COM>/api/cron/process-scheduled`.
- **Option A (Vercel Cron):** Add a `vercel.json` to the root of your project:
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/process-scheduled",
        "schedule": "*/5 * * * *"
      }
    ]
  }
  ```
  *(Note: Vercel Free Tier limits cron frequency. If you need it to run every 1-5 minutes reliably, use Option B).*
- **Option B (External Cron - Recommended for Free):** Go to [cron-job.org](https://cron-job.org/) (free), create an account, and set up a new job to send an HTTP GET request to `https://<YOUR_NEW_DOMAIN.COM>/api/cron/process-scheduled` every 2 to 5 minutes.

---

## 🎉 You're Done!
Once all environment variables are set and the Vercel deployment has finished building, your completely independent clone of the Content Calendar Tool is fully operational! You can log in, link your Telegram Chat ID via the Profile Setup Guide, and start scheduling.
