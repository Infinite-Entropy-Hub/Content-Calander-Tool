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
        const tgBotToken = process.env.TELEGRAM_BOT_TOKEN;
        
        let replyText = "";

        if (data.startsWith('action_remind_')) {
          // Old remind (for posting)
          const parts = data.replace('action_remind_', '').split('_');
          const value = parseInt(parts[0]);
          const postId = parts.slice(1).join('_');
          
          if (postId && value) {
            const futureDate = new Date(Date.now() + value * 60000).toISOString();
            await supabaseAdmin.from('posts').update({ 
              kanban_status: 'scheduled', 
              scheduled_for: futureDate,
              notification_sent: false
            }).eq('id', postId);
            replyText = `⏰ <b>Snoozed!</b>\nI will remind you again to post in ${value} minutes.`;
          }
        } 
        else if (data.startsWith('action_published_')) {
          const postId = data.replace('action_published_', '');
          if (postId) {
            await supabaseAdmin.from('posts').update({ 
              kanban_status: 'published'
            }).eq('id', postId);
            replyText = `✅ <b>Awesome!</b>\nMarked as published in your Content Calendar.`;
          }
        }
        else if (data.startsWith('action_work_remind_')) {
          const parts = data.replace('action_work_remind_', '').split('_');
          const value = parseInt(parts[0]);
          const postId = parts.slice(1).join('_');
          
          if (postId && value) {
            const futureDate = new Date(Date.now() + value * 60000).toISOString();
            await supabaseAdmin.from('posts').update({ 
              work_reminder_for: futureDate,
              work_reminder_sent: false
            }).eq('id', postId);
            replyText = `⏰ <b>Work Reminder Snoozed!</b>\nI will remind you to work on this post in ${value} minutes.`;
          }
        }

        // Always answer callback query FIRST to stop loading spinner on the button
        if (tgBotToken) {
          await fetch(`https://api.telegram.org/bot${tgBotToken}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: callbackQueryId })
          });
        }

        if (replyText && tgBotToken) {
          // Send a new message to confirm the action, and edit the old message to remove buttons
          await fetch(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: replyText,
              parse_mode: 'HTML'
            })
          });
          
          // Optionally clear the buttons on the old message so they can't be clicked again
          await fetch(`https://api.telegram.org/bot${tgBotToken}/editMessageReplyMarkup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              reply_markup: { inline_keyboard: [] }
            })
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
