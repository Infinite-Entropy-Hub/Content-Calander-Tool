# Social Media API Keys Guide

To enable automated posting, you need to acquire developer credentials for each platform.

## 1. Meta (Instagram & Facebook)
1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Create an App (Type: Business).
3. Add the **Instagram Graph API** and **Facebook Login for Business** products to your app.
4. **App Settings > Basic:** Get your `App ID` and `App Secret`.
5. **Publishing permissions:** `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`.
6. **Comment automation permissions:** `instagram_manage_comments`, `instagram_manage_messages`, `pages_manage_engagement`, `pages_manage_metadata`.
7. Regenerate the System User token after adding permissions; old tokens do not inherit new scopes.
8. In the Webhooks product, configure `https://YOUR-DOMAIN.com/api/webhooks/meta` and subscribe Instagram to `comments`, `messages`, and `messaging_postbacks`.
6. Use the Graph API Explorer to generate a long-lived Page Access Token.

**Shared environment variables:**
```env
META_WEBHOOK_VERIFY_TOKEN="a-long-random-value-you-create"
META_GRAPH_API_VERSION="v25.0"
CRON_SECRET="a-different-long-random-value"
# Each user's Meta App ID, App Secret and token are saved from Profile → Platform Integrations.
```

## Comment Automation Cron

Create a second cron-job.org job. Keep the existing publishing cron unchanged.

- URL: `https://YOUR-DOMAIN.com/api/cron/process-comment-automations`
- Method: `GET`
- Schedule: every 5 minutes
- Header: `Authorization: Bearer YOUR_CRON_SECRET`

Meta webhooks process new comments immediately. This cron scans existing comments selected by an automation and acts as a recovery path. Instagram permits one private reply per comment within 7 days; older matches receive only the public reply.

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
