# Social Media API Keys Guide

To enable automated posting, you need to acquire developer credentials for each platform.

## 1. Meta (Instagram & Facebook)
1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Create an App (Type: Business).
3. Add the **Instagram Graph API** and **Facebook Login for Business** products to your app.
4. **App Settings > Basic:** Get your `App ID` and `App Secret`.
5. **Permissions needed:** `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`.
6. Use the Graph API Explorer to generate a long-lived Page Access Token.

**Environment Variables:**
```env
META_CLIENT_ID="your-app-id"
META_CLIENT_SECRET="your-app-secret"
# Save user tokens in the Supabase platforms_config table
```

## 2. YouTube (Google Cloud Console)
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new Project.
3. Go to **APIs & Services > Library** and enable the **YouTube Data API v3**.
4. Go to **Credentials** and click **Create Credentials > OAuth client ID**.
5. Set Application Type to "Web application".
6. Add your Authorized Redirect URIs (e.g., `https://your-domain.com/api/auth/callback/google`).
7. **Permissions needed:** `https://www.googleapis.com/auth/youtube.upload`.

**Environment Variables:**
```env
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

## 3. X (Twitter)
1. Go to the [X Developer Portal](https://developer.twitter.com/en/portal/dashboard).
2. Create a Project and an App.
3. Under User Authentication Settings, enable OAuth 2.0.
4. Set App permissions to **Read and Write**.
5. Add your Callback URI.
6. Generate your Client ID and Client Secret.

**Environment Variables:**
```env
TWITTER_CLIENT_ID="your-client-id"
TWITTER_CLIENT_SECRET="your-client-secret"
```

## General Note on Callbacks
For all platforms using OAuth 2.0, whenever you deploy to a new domain, you **must** go back into the developer portals for Meta, Google, and X, and update the "Authorized Redirect URIs" to include your new domain. If you forget this, authentication will fail with a "redirect_uri mismatch" error.
