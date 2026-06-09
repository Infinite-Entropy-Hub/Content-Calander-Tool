# Cron Job Setup Guide

In order for scheduled posts to be published automatically at their designated times, the application needs a trigger. This is done via a Cron Job that pings a specific API route.

## The API Route
Your application has a secure API route designed to execute the publishing logic:
`https://your-domain.com/api/cron/publish`

For security, this route should be protected by a Secret Key so random bots on the internet cannot trigger your publishing logic.

### Environment Variable setup
In your `.env.local` and production environment, add:
```env
CRON_SECRET="generate-a-secure-random-string-here"
```

## Option 1: Vercel Cron (Recommended if hosting on Vercel)
If you deploy this application on Vercel, cron jobs are built-in.
1. Create a file named `vercel.json` in the root of your project (if not already present).
2. Add the following configuration:
```json
{
  "crons": [
    {
      "path": "/api/cron/publish",
      "schedule": "* * * * *"
    }
  ]
}
```
*(The `* * * * *` schedule means it will run every minute).*
3. When Vercel pings this route, it automatically includes the `CRON_SECRET` if configured in the project settings.

## Option 2: External Cron Service (cron-job.org or AWS EventBridge)
If you are hosting elsewhere or want to use an external service:
1. Create an account at [cron-job.org](https://cron-job.org/) (Free).
2. Create a new cron job.
3. Set the URL to `https://your-domain.com/api/cron/publish`.
4. Set the schedule to run **Every 1 minute**.
5. **Crucial:** Under "Advanced", add a custom HTTP Header:
   - Header Name: `Authorization`
   - Header Value: `Bearer <YOUR_CRON_SECRET>`
6. Save and enable the job.

**IMPORTANT NOTE:** If you ever change your domain name, you must update the Cron Job URL to point to the new domain, otherwise scheduled posts will never publish!
