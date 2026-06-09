# Supabase Database Setup Guide

This project relies on Supabase for its PostgreSQL database, Authentication, and initial Storage.

## Step 1: Create a Supabase Project
1. Go to [Supabase](https://supabase.com/) and create an account.
2. Click **New Project**, select an organization, and provide a name and secure database password.
3. Choose a region closest to your users.
4. Click **Create new project** and wait a few minutes for the database to provision.

## Step 2: Get API Keys
1. In your Supabase dashboard, go to **Project Settings** (gear icon) > **API**.
2. Copy the **Project URL** and the **anon `public` API Key**.
3. Add these to your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

## Step 3: Run the Schema Setup
1. In your Supabase dashboard, go to the **SQL Editor** on the left menu.
2. Click **New query**.
3. Open the `supabase_queries/` folder in your project directory.
4. You will see a list of SQL files numbered sequentially (e.g., `1_initial_setup.sql`, `2_fix_rls_and_recreate.sql`, ..., `17_add_notes_table.sql`).
5. Copy the contents of each file one by one, paste them into the Supabase SQL Editor, and click **Run**. It is crucial to run them in numerical order so that tables and policies are created in the correct sequence.

## Step 4: Authentication
By default, the application uses Email/Password authentication.
1. Go to **Authentication** > **Providers**.
2. Ensure **Email** is enabled.
3. If you want, disable "Confirm email" in the settings to allow instant login during development.
