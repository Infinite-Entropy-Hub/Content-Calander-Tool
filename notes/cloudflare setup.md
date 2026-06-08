# Cloudflare R2 Hybrid Setup Guide

To bypass the 50MB Supabase limit and allow for massive file uploads (like 500MB+ videos), this application is designed to automatically detect large files and seamlessly switch to Cloudflare R2's direct-upload architecture.

To get this working, you must properly configure your Cloudflare account and link the keys to the application.

---

## Step 1: Create the Cloudflare R2 Bucket
1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. On the left navigation menu under "Storage & databases", click **R2 Object Storage**.
3. Click the blue **+ Create bucket** button.
4. Name the bucket (e.g., `content-media`) and click Create.

## Step 2: Enable Public Access (Crucial for Display)
Since the Media Library and your social media APIs need to be able to "see" and download the videos, the bucket must be publicly accessible.
1. Click on your newly created bucket to open its details.
2. At the top of the page, click the **Settings** tab.
3. Scroll down until you see the **Public Development URL** section.
4. Click the blue **Enable** button on the right side.
5. Cloudflare will generate a URL that looks like `https://pub-xxxxxxxxxx.r2.dev`. 
   - **Copy this URL** — this is your `R2_PUBLIC_URL` for your `.env.local` file.

## Step 3: Configure CORS Policy (Crucial for Uploads)
Because you are uploading files *directly* from your web browser to Cloudflare (to bypass Next.js server limits), Cloudflare needs to know that it is allowed to accept data from your domain.
1. Still on the **Settings** tab of your bucket, look at the left-side sub-menu under "General" and click **CORS Policy**.
2. Click **Add CORS Policy**.
3. Paste the following JSON exactly as written:
```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": [
      "PUT",
      "GET"
    ],
    "AllowedHeaders": [
      "*"
    ]
  }
]
```
*(Make sure to replace `https://your-production-domain.com` with your actual live URL).*
4. Click **Save**.

## Step 4: Get Your Account ID
1. Still on the **Settings** tab, scroll up to the very top.
2. Look for the **S3 API** URL. It will look like this:
   `https://7323395986262c9e8de49ffadb3aa9f6.r2.cloudflarestorage.com/content-media`
3. The long string of numbers and letters *before* `.r2.cloudflarestorage.com` is your Account ID.
   - **Copy this string** — this is your `R2_ACCOUNT_ID` for your `.env.local` file.

## Step 5: Generate API Tokens (Access & Secret Keys)
You need keys that give the backend permission to generate the secure upload links and to delete files.
1. Look at the far-left navigation menu (the main Cloudflare menu) under "Storage & databases", and click on **R2 Object Storage** to go back to the main overview page.
2. On the right side of the main page, under the Usage stats, look for the "Account Details" box. 
   *(Note: You may have to scroll down slightly on the right side if your screen is small).*
3. Inside the Account Details box, click **Manage R2 API Tokens**.
4. Click **Create API Token**.
5. Name it something memorable (e.g., "Content Calendar Uploader").
6. **CRITICAL STEP:** Change the Permissions dropdown from "Read" to **"Object Read & Write"**.
7. Click **Create API Token** at the bottom.
8. Cloudflare will display your **Access Key ID** and **Secret Access Key**.
   - **Copy BOTH of these immediately.** Cloudflare will only show you the Secret Key *once*. If you lose it, you have to generate a new token.

## Step 6: Update Environment Variables
Open your `.env.local` file (and your Vercel Environment Variables if deploying) and fill in the 5 R2 variables:

```env
R2_ACCOUNT_ID="your_account_id_from_step_4"
R2_ACCESS_KEY_ID="your_access_key_from_step_5"
R2_SECRET_ACCESS_KEY="your_secret_key_from_step_5"
R2_BUCKET_NAME="content-media"
R2_PUBLIC_URL="https://pub-xxxxxxxxxxxxx.r2.dev"
```

Restart your local dev server (`npm run dev`), and your hybrid storage system is completely active! Any file larger than 45MB will instantly and securely upload straight to Cloudflare.
