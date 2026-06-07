import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.callback_query) {
      const callbackQueryId = body.callback_query.id;
      const data = body.callback_query.data; // e.g. "action_remind_30_uuid"
      const messageId = body.callback_query.message.message_id;
      const chatId = body.callback_query.message.chat.id;

      if (data.startsWith('action_')) {
        const parts = data.replace('action_', '').split('_');
        let action = parts[0];
        let value = null;
        let postId = null;

        if (action === 'remind') {
          value = parseInt(parts[1]); // 30 or 120
          postId = parts.slice(2).join('_');
        } else if (action === 'published') {
          postId = parts.slice(1).join('_');
        }

        const tgBotToken = process.env.TELEGRAM_BOT_TOKEN;

        if (postId) {
          if (action === 'remind' && value) {
            // Update post to scheduled_for + value minutes, and status = 'scheduled'
            const futureDate = new Date(Date.now() + value * 60000).toISOString();
            await supabaseAdmin.from('posts').update({ 
              status: 'scheduled', 
              scheduled_for: futureDate,
              notification_sent: false
            }).eq('id', postId);

            // Edit message to remove buttons and confirm
            if (tgBotToken) {
              await fetch(`https://api.telegram.org/bot${tgBotToken}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  message_id: messageId,
                  text: `⏰ <b>Snoozed!</b>\nI will remind you again in ${value} minutes.`,
                  parse_mode: 'HTML'
                })
              });
            }
          } else if (action === 'published') {
            await supabaseAdmin.from('posts').update({ 
              status: 'published',
              error_log: '[User manually marked as published via Telegram]'
            }).eq('id', postId);

            // Edit message to remove buttons and confirm
            if (tgBotToken) {
              await fetch(`https://api.telegram.org/bot${tgBotToken}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  message_id: messageId,
                  text: `✅ <b>Awesome!</b>\nMarked as published in your Content Calendar.`,
                  parse_mode: 'HTML'
                })
              });
            }
          }
        }

        // Always answer callback query to stop loading spinner on the button
        if (tgBotToken) {
          await fetch(`https://api.telegram.org/bot${tgBotToken}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQueryId })
          });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    // Always return 200 to Telegram so it stops retrying the webhook
    return NextResponse.json({ ok: true });
  }
}
