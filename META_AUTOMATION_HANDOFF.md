# Meta Instagram Comment Automation — Complete Handoff

## Purpose of this document

This document is a complete handoff for continuing the Instagram comment automation setup and debugging in another ChatGPT conversation.

The application is a Next.js 16.2.7 content calendar deployed at:

```text
https://postcal.vercel.app
```

The desired automation is:

```text
Instagram user comments a configured keyword on a selected Reel/post
→ Public reply is posted under the comment
→ One private reply is sent to the commenter
→ The commenter replies with a confirmation word such as FOLLOWED
→ A final Instagram message containing a clickable resource button is sent
```

The current test automation uses the keyword:

```text
MQTT
```

## Important security warning

Several Meta access tokens were accidentally shown in screenshots/chat during setup. Those tokens must be considered compromised.

Before continuing:

1. Revoke every exposed System User/Page access token.
2. Generate a fresh System User token.
3. Never paste a token into ChatGPT, screenshots, source code, or this document.
4. Crop the entire Access Token panel from future screenshots.

No access tokens or secrets are included in this handoff.

## Repository instructions

The repository contains an `AGENTS.md` instruction stating that this installed Next.js version has breaking changes. Before changing Next.js code, read the relevant local documentation under:

```text
node_modules/next/dist/docs/
```

## What has been implemented

### Automation interface

A new **Automations** item was added below Dashboard in the left sidebar.

The page allows the user to:

- Select a specific Instagram post or Reel fetched from Meta.
- Configure one or more comment keywords.
- Choose matching mode: contains, exact, or whole word.
- Configure the public reply.
- Configure the first private reply.
- Configure a confirmation word such as `FOLLOWED`.
- Configure the final message, final URL, and button text.
- Enable/disable an automation.
- Optionally scan existing comments.
- Use supplied message presets.

Main UI file:

```text
src/components/AutomationsView.tsx
```

Sidebar/workspace integration:

```text
src/components/SidebarLayout.tsx
src/components/PremiumWorkspace.tsx
```

### Supabase migration

The migration is:

```text
supabase_queries/18_add_comment_automations.sql
```

It creates:

```text
comment_automations
comment_automation_events
```

The migration has already been run in the production Supabase project.

The `comment_automations` table contains the MQTT automation. The row includes:

- Platform: `instagram`
- Automation type: `keyword_comment_dm`
- Instagram account ID: present
- Selected media ID: present
- Enabled/live: yes
- Backfill: enabled

The `comment_automation_events` table is still empty after real MQTT comments.

### Meta credential storage

Meta credentials are user-specific and saved in the authenticated user's Supabase `profiles.api_keys` JSON.

The Instagram/Facebook Profile popup now stores:

```text
Meta App ID
Meta App Secret
System User Access Token
```

Saving either Instagram or Facebook synchronizes the same Meta connection across both platform entries.

Backward compatibility exists for the previous token-only string format.

Relevant files:

```text
src/lib/metaCredentials.ts
src/app/profile/page.tsx
src/lib/publishInstagram.ts
src/lib/publishFacebook.ts
```

Only shared infrastructure values belong in deployment environment variables:

```env
META_WEBHOOK_VERIFY_TOKEN=<shared random verification value>
META_GRAPH_API_VERSION=v25.0
CRON_SECRET=<existing cron secret>
SUPABASE_SERVICE_ROLE_KEY=<Supabase service role key>
```

Do not put user Meta App IDs, App Secrets, or access tokens in environment variables.

### Meta media picker

The app fetches the connected Page, Instagram Professional account, and Instagram media through:

```text
GET /api/meta/media
```

Relevant route:

```text
src/app/api/meta/media/route.ts
```

Production Vercel logs show this route returning HTTP 200, so the stored Meta token can read the connected Page/account/media.

### Webhook route

Meta uses:

```text
GET  /api/webhooks/meta   — webhook verification challenge
POST /api/webhooks/meta   — comment/message event delivery
```

Relevant file:

```text
src/app/api/webhooks/meta/route.ts
```

The route:

- Verifies Meta's `x-hub-signature-256` using the user's saved Meta App Secret.
- Handles `comments`, `live_comments`, and compatible `feed` changes.
- Handles message replies/postbacks.
- Matches automations using the globally unique media ID.
- Logs verified deliveries, entry IDs, media IDs, comment IDs, and matching automation counts.
- Calls the automation engine.

Important recent correction:

The original webhook lookup required both `entry.id` and `media_id` to match. That could silently discard a Facebook Login webhook when Meta used a different Page/account context. It now matches enabled automations by globally unique `media_id`.

Expected Vercel logs after a real comment:

```text
[meta-webhook] verified delivery
[meta-webhook] comment received
```

### Reply engine

Relevant file:

```text
src/lib/metaAutomation.ts
```

The engine:

- Performs case-insensitive keyword matching.
- Creates an event row before attempting the Meta reply calls.
- Prevents duplicate processing with a unique automation/comment constraint.
- Resolves the correct Facebook Page access token through `/me/accounts` instead of incorrectly using the raw System User token for replies.
- Posts the public comment reply.
- Sends one permitted private reply within Meta's seven-day limit.
- Waits for the exact configured confirmation word.
- Sends a final button-template message containing the configured URL.
- Records `awaiting_response`, `completed`, or `failed` and stores Meta's error message.

Meta's documented private-reply constraints:

- Only one private reply can be sent from the original comment.
- It must be sent within seven days.
- Additional messages are allowed only after the recipient responds and within the permitted messaging window.
- Meta does not provide a reliable general-purpose way for this workflow to enforce a follow requirement before the first reply. The user reply `FOLLOWED` is treated as confirmation.

### Legal pages

Public pages were created for Meta's Live-mode requirements:

```text
https://postcal.vercel.app/privacy
https://postcal.vercel.app/terms
https://postcal.vercel.app/data-deletion
```

Files:

```text
src/components/LegalPage.tsx
src/app/privacy/page.tsx
src/app/terms/page.tsx
src/app/data-deletion/page.tsx
```

### Interactive Meta setup guide

The info button on the Instagram/Facebook Profile cards opens a Next/Back setup wizard.

File:

```text
src/components/MetaSetupGuide.tsx
```

The guide includes credentials, System User assets, permissions, webhooks, Live mode, legal pages, security warnings, and testing.

## Cron clarification

New comments are supposed to be processed by Meta webhooks immediately.

The existing cron route is:

```text
/api/cron/process-scheduled
```

It is used for the existing scheduled publishing/Telegram reminder workflow.

Do not treat cron as the primary comment automation engine. A separate optional comment scanning route exists, but the main debugging target is real webhook delivery.

Files associated with optional scanning:

```text
src/app/api/cron/process-comment-automations/route.ts
src/lib/scanCommentAutomations.ts
```

The scheduled/Telegram cron was restored so it is not responsible for the real-time comment automation.

## Confirmed Meta setup

The Meta app is named `Automation`.

Confirmed:

- App is set to **Live**.
- Callback URL is `https://postcal.vercel.app/api/webhooks/meta`.
- Webhook API version is `v25.0`.
- `comments` is subscribed and its dashboard sample test succeeded.
- `messages` is subscribed and its dashboard sample test succeeded.
- `messaging_postbacks` is subscribed and its dashboard sample test succeeded.
- The System User can call `/me/accounts` and see the Thinking Robot Page plus the linked Instagram Professional account.
- The Instagram media picker works in production.
- The connected Meta app/Page/Instagram account IDs are present in Supabase.

Meta permission/access screenshots confirmed:

```text
instagram_manage_comments — Standard Access, Ready to use (0)
instagram_manage_messages — Standard Access, Ready to use (0)
pages_read_engagement      — Standard Access, Active
```

`Ready to use (0)` means Meta has not recorded successful calls for that capability; it is not itself an error.

For an Instagram Professional account owned/managed by the app owner and added to the App Dashboard, Meta documentation says Standard Access should be sufficient. Advanced Access is required when serving accounts that the app owner does not own/manage.

The generated System User token was requested with these permissions:

```text
instagram_basic
instagram_content_publish
instagram_manage_comments
instagram_manage_messages
pages_show_list
pages_read_engagement
pages_manage_posts
pages_manage_engagement
pages_manage_metadata
publish_video
```

## Failed or misleading setup paths

### Manual Instagram `/subscribed_apps` call

An attempted request was made to:

```text
POST /INSTAGRAM_ACCOUNT_ID/subscribed_apps
```

Meta returned:

```text
(#3) Application does not have the capability to make this API call.
```

The Graph API Explorer also automatically added:

```text
domain = FB
```

That `domain=FB` parameter is an Explorer implementation detail, not the root error.

The in-app guide was corrected so this incompatible account-level subscription call is not treated as mandatory for the current Facebook Login for Business flow. The Instagram fields are configured in App Dashboard → Webhooks → Instagram.

### Cron confusion

There was an incorrect attempt to fold comment scanning into the scheduled/Telegram cron. That change was removed. Real comments remain webhook-driven.

## Most important current evidence

Vercel production logs show:

```text
POST /api/webhooks/meta 200
```

at approximately 10:05. This was the Meta dashboard sample test.

The logs do **not** show a later `POST /api/webhooks/meta` corresponding to the real MQTT comment.

The Supabase event table remains empty.

Therefore:

```text
Meta did not deliver the real production comment webhook to the application.
```

This conclusion is supported by all three observations:

1. Sample webhook reaches Vercel and returns 200.
2. Real comment does not produce a Vercel webhook POST.
3. No event row is created.

The current blocker is upstream Meta production delivery/access/account setup, not keyword matching, Supabase insertion, or cron.

## Exact next troubleshooting sequence

Proceed one step at a time. Do not regenerate or expose tokens unless a step specifically proves it is necessary.

### Step 1 — Verify the Instagram account is added to the app

In Meta App Dashboard:

```text
Instagram Graph API
→ API Setup / Getting Started / account setup section
```

Confirm the `Thinking Robot` Instagram Professional account is visibly connected/added to the app.

Look for labels such as:

```text
Add Instagram account
Connect account
Generate access tokens
Instagram testers
```

If Meta requires an Instagram Tester:

1. Open App Roles → Roles.
2. Add the Instagram account as an Instagram Tester.
3. Log into that Instagram account.
4. Open Instagram Settings → Website permissions → Apps and websites → Tester invites.
5. Accept the invitation.

Do not proceed until the professional account is visibly connected to the app.

### Step 2 — Verify Business asset assignments

In Meta Business Settings:

```text
Users → System users → select the automation System User
```

Confirm it has:

```text
Automation app             — Full control
Thinking Robot Page        — Content/manage access
Thinking Robot Instagram   — Content/manage access
```

### Step 3 — Verify the fresh token

Use Meta Access Token Debugger privately.

Confirm:

- Token is valid.
- Token belongs to the Automation app.
- Required scopes are present.
- The token is not one previously exposed in chat/screenshots.

Do not share the debugger screen if it contains the token.

### Step 4 — Verify Webhook field subscriptions

In App Dashboard → Webhooks → Instagram:

```text
comments               — Subscribed, v25.0
messages               — Subscribed, v25.0
messaging_postbacks    — Subscribed, v25.0
```

App mode must remain Live.

### Step 5 — Verify deployment version

Deploy the latest repository version containing the webhook matching and Page token fixes.

In Vercel, ensure the production deployment was created after those code changes.

The environment must include:

```text
META_WEBHOOK_VERIFY_TOKEN
META_GRAPH_API_VERSION=v25.0
SUPABASE_SERVICE_ROLE_KEY
```

### Step 6 — Perform one clean real test

1. Use a different Instagram account.
2. Comment a fresh exact `MQTT` on the selected Reel/post.
3. Do not edit or reuse an earlier comment.
4. Immediately watch Vercel logs for:

```text
POST /api/webhooks/meta
[meta-webhook] verified delivery
[meta-webhook] comment received
```

### Step 7 — Interpret the result

#### No POST request appears

Meta is still not delivering production events. The remaining blocker is Meta account/app access configuration or an App Review/Advanced Access requirement.

#### POST appears but no `comment received` log

Inspect the log body/error. Possible causes:

- Signature verification rejected.
- Meta used an unexpected payload shape.
- The deployed code is stale.

#### `comment received` shows `matchingAutomations: 0`

Compare the logged media ID with `comment_automations.media_id`. The automation points to a different post/Reel.

#### An event row appears as `failed`

Run:

```sql
SELECT
  created_at,
  status,
  comment_text,
  commenter_username,
  error_message
FROM comment_automation_events
ORDER BY created_at DESC
LIMIT 20;
```

Use the exact `error_message` to correct the Meta reply/DM capability.

#### Event row is `awaiting_response`

The initial public/private reply succeeded. Reply with the exact configured confirmation word, normally:

```text
FOLLOWED
```

The final button message should then be sent.

## Relevant source files

```text
src/app/api/webhooks/meta/route.ts
src/lib/metaAutomation.ts
src/lib/metaCredentials.ts
src/lib/serverSupabase.ts
src/app/api/meta/media/route.ts
src/components/AutomationsView.tsx
src/components/MetaSetupGuide.tsx
src/app/profile/page.tsx
src/lib/publishInstagram.ts
src/lib/publishFacebook.ts
supabase_queries/18_add_comment_automations.sql
docs/social_media_keys.md
```

## Validation performed

The latest webhook/automation changes passed:

```text
TypeScript: tsc --noEmit
Targeted ESLint: passed
```

An earlier full Next production build was blocked only because the restricted local environment could not download the existing Google `Outfit` font. The automation TypeScript/lint checks passed.

## Instructions for the next assistant

1. Do not suggest another cronjob as the fix for new comments.
2. Treat the Meta webhook as the primary trigger.
3. Work one setup step at a time because the user is understandably frustrated.
4. Do not ask the user to share tokens or screenshots containing tokens.
5. Start with Step 1: verify the Instagram Professional account is visibly added to the Meta app.
6. Use the existing evidence before proposing code changes.
7. If a real webhook POST arrives, use the new structured Vercel logs and Supabase event row to diagnose the exact downstream failure.

