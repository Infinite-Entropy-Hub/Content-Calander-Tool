# Content Calendar Tool - Complete Setup Guide

This document contains everything required to recreate the Content Calendar project from scratch. If you lose the original environment or need to deploy to a new server, follow these steps exactly.

## Tech Stack Overview
- **Framework**: Next.js 15 (App Router, React 19)
- **Styling**: Tailwind CSS, `shadcn/ui` components
- **Database & Auth**: Supabase (PostgreSQL)
- **Large File Storage**: Cloudflare R2
- **Notifications**: Telegram Bot API
- **Automation Triggers**: Vercel Cron or External Cron Service

## Step-by-Step Setup

### 1. Repository Setup
Clone the code to your local machine:
```bash
git clone <your-repo-url>
cd content-calendar-tool
npm install
```

### 2. Database & Authentication Setup
You must set up Supabase to handle user authentication, basic file storage, and data (posts, notes, platform configs).
- 👉 **[Read the Supabase Setup Guide](./supabase_setup.md)**

### 3. Large File Storage Setup
Supabase has strict upload limits via Next.js server actions. To bypass this for large videos, we use a hybrid approach that uploads directly to Cloudflare R2.
- 👉 **[Read the Cloudflare Setup Guide](./cloudflare_setup.md)**

### 4. Telegram Notifications
To receive instant updates when a post succeeds or fails, configure the Telegram bot.
- 👉 **[Read the Telegram Bot Setup Guide](./telegram_bot_setup.md)**

### 5. Automated Publishing Trigger
The application does not run 24/7 in the background like a traditional server. It relies on a "ping" every minute to check if any posts need to go live.
- 👉 **[Read the Cron Job Setup Guide](./cronjob_setup.md)**

### 6. Social Media APIs
To actually publish content, the app needs authorization from Twitter, Meta, and Google.
- 👉 **[Read the Social Media API Keys Guide](./social_media_keys.md)**

---

## Environment Variables Reference
Here is the complete `.env.local` template you must fill out before running the app.

```env
# 1. Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# 2. Cloudflare R2
R2_ACCOUNT_ID="your_account_id"
R2_ACCESS_KEY_ID="your_access_key"
R2_SECRET_ACCESS_KEY="your_secret_key"
R2_BUCKET_NAME="content-media"
R2_PUBLIC_URL="https://pub-your-url.r2.dev"

# 3. Telegram Bot
TELEGRAM_BOT_TOKEN="your-bot-token"
TELEGRAM_CHAT_ID="your-chat-id"

# 4. Security
CRON_SECRET="your-secure-random-string"
NEXTAUTH_SECRET="another-secure-random-string"

# 5. Social Platforms (Add as you acquire them)
META_CLIENT_ID=""
META_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
TWITTER_CLIENT_ID=""
TWITTER_CLIENT_SECRET=""
```

## Running the App
Once your `.env.local` is complete:

**Development:**
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

**Production Build:**
```bash
npm run build
npm start
```

## Critical Maintenance Notes
If you ever change your domain name (e.g., from `myapp.vercel.app` to `myapp.com`), you **MUST** update the following:
1. **Cloudflare CORS Policy:** Add the new domain to `AllowedOrigins`.
2. **Telegram Webhook:** Hit the API URL to reset the webhook to the new domain.
3. **Cron Job:** Update your external cron service to ping the new domain.
4. **Social Media OAuth:** Update the Authorized Redirect URIs in Google Cloud, Meta Developer, and X Developer portals.
