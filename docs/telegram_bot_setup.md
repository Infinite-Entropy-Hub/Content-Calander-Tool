# Telegram Bot Setup Guide

This application can send you notifications via Telegram (e.g., when a post successfully publishes or fails).

## Step 1: Create the Bot via BotFather
1. Open the Telegram app on your phone or desktop.
2. Search for `@BotFather` (the official Telegram bot creator with the blue checkmark).
3. Send the command `/newbot`.
4. Follow the instructions to give your bot a name and a unique username (ending in `bot`).
5. BotFather will reply with an API Token. It looks something like this: `123456789:ABCdefGHIjklMNOpqrSTUvwxYZ`.
   - **Copy this Token** and save it.

## Step 2: Get Your Chat ID
To ensure the bot only messages *you*, you need your personal Chat ID.
1. Search for `@userinfobot` in Telegram and start a chat with it.
2. It will reply with your `Id` (a string of numbers like `123456789`).
   - **Copy this Chat ID**.

## Step 3: Configure Environment Variables
Open your `.env.local` file (and production environment variables) and add:

```env
TELEGRAM_BOT_TOKEN="your-bot-token-from-step-1"
TELEGRAM_CHAT_ID="your-chat-id-from-step-2"
```

## Step 4: Set the Webhook URL (Optional for incoming messages)
If you want the bot to receive commands from you (e.g., replying "Cancel" to a scheduled post notification), you must set a Webhook.
1. Once your application is deployed to a public domain (e.g., `https://your-domain.com`), you need to tell Telegram where to send updates.
2. Open your web browser and navigate to the following URL, replacing the placeholders:

`https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-domain.com/api/telegram-webhook`

3. You should see a JSON response stating `"ok": true, "description": "Webhook was set"`.

Whenever you change domains, you **MUST** repeat Step 4 to point the webhook to the new domain!
