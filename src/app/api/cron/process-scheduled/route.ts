import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { publishToInstagram } from "@/lib/publishInstagram";
import { publishToFacebook } from "@/lib/publishFacebook";
import { publishToYouTube } from "@/lib/publishYouTube";
import { publishToTwitter } from "@/lib/publishTwitter";

// Initialize Supabase client with Service Role to bypass RLS for cron
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: Request) {
  try {
    // 1. Verify Authorization Header (Optional but recommended for Cron-job.org or GitHub Actions)
    const url = new URL(req.url);
    const authHeader = req.headers.get('authorization');
    const tokenQuery = url.searchParams.get('token');
    
    const cronSecret = process.env.CRON_SECRET;
    
    // Check if token matches via query param or Authorization header
    if (cronSecret) {
      if (tokenQuery !== cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // 2. Fetch all due posts
    const now = new Date().toISOString();
    const { data: posts, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('*')
      .eq('is_scheduled', true)
      .eq('status', 'scheduled')
      .lte('scheduled_for', now);

    if (fetchError) {
      throw fetchError;
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ message: "No posts due for publishing.", count: 0 });
    }

    const results = [];

    // 3. Process each post
    for (const post of posts) {
      try {
        // Fetch user profile for notification preferences
        const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', post.user_id).single();
        const tgBotToken = process.env.TELEGRAM_BOT_TOKEN;
        const tgChatId = profile?.telegram_chat_id;
        const tgEnabled = profile?.telegram_enabled;
        const resendKey = process.env.RESEND_API_KEY;
        const email = profile?.notification_email;

        const sendTelegram = async (msg: string, reply_markup?: any) => {
          if (!tgEnabled || !tgBotToken || !tgChatId) return;
          try {
            await fetch(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: tgChatId, text: msg, parse_mode: 'HTML', reply_markup })
            });
          } catch (e) { console.error("TG Error", e); }
        };

        const sendEmail = async (subject: string, html: string) => {
          if (!resendKey || !email) return;
          try {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
              body: JSON.stringify({
                from: 'Content Calendar <postremainder@skan.space>',
                to: [email],
                subject,
                html
              })
            });
          } catch (e) { console.error("Resend Error", e); }
        };

        if (post.auto_publish === false) {
          // HYBRID MANUAL WORKFLOW
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const tgMsg = `🔔 <b>Time to Post! (Manual)</b>\n\n<b>Title:</b> ${post.title}\n<b>Platform:</b> ${post.platform}\n\n<a href="${appUrl}/dashboard">Open App to Download Media</a>`;
          
          const inline_keyboard = [
            [
              { text: '✅ Mark as Published', callback_data: `action_published_${post.id}` }
            ],
            [
              { text: '⏰ Remind in 30m', callback_data: `action_remind_30_${post.id}` },
              { text: '⏰ Remind in 2h', callback_data: `action_remind_120_${post.id}` }
            ]
          ];
          
          await sendTelegram(tgMsg, { inline_keyboard });

          const emailHtml = `
            <h2>Time to post: ${post.title}</h2>
            <p>It's time to manually publish this post to <b>${post.platform}</b> so you can use native audio and stickers.</p>
            <a href="${appUrl}/dashboard" style="display:inline-block;padding:12px 24px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;">Open Content Calendar</a>
          `;
          await sendEmail(`Time to post: ${post.title}`, emailHtml);

          // Mark as notified so we don't spam them every 5 minutes
          await supabaseAdmin.from('posts').update({ status: 'notified', notification_sent: true }).eq('id', post.id);
          results.push({ id: post.id, status: 'notified' });
          continue;
        }

        // AUTOMATED WORKFLOW
        let platformId = null;
        switch (post.platform) {
          case 'instagram': platformId = await publishToInstagram(post.id, post.user_id); break;
          case 'facebook': platformId = await publishToFacebook(post.id, post.user_id); break;
          case 'youtube': platformId = await publishToYouTube(post.id, post.user_id); break;
          case 'x':
          case 'twitter': platformId = await publishToTwitter(post.id, post.user_id); break;
          default: throw new Error(`Unsupported platform: ${post.platform}`);
        }

        const successMsg = `[AUTO-PUBLISHED] Successfully executed at ${new Date().toISOString()}`;
        await supabaseAdmin.from('posts').update({ status: 'published', error_log: successMsg }).eq('id', post.id);
        
        await sendTelegram(`✅ <b>Auto-Publish Success</b>\n\n<b>Title:</b> ${post.title}\n<b>Platform:</b> ${post.platform}`);
        results.push({ id: post.id, status: 'success', platformId });
        
      } catch (err: any) {
        console.error(`Error publishing post ${post.id}:`, err);
        const errorMessage = err.message || JSON.stringify(err);
        const errorLogMsg = `[AUTO-PUBLISH FAILED] at ${new Date().toISOString()}:\n${errorMessage}`;
        
        await supabaseAdmin.from('posts').update({ status: 'failed', error_log: errorLogMsg }).eq('id', post.id);
        
        // Fetch profile again inside catch block in case it failed before fetching
        const { data: profile } = await supabaseAdmin.from('profiles').select('telegram_chat_id, telegram_enabled').eq('id', post.user_id).single();
        const tgBotToken = process.env.TELEGRAM_BOT_TOKEN;
        const tgChatId = profile?.telegram_chat_id;
        const tgEnabled = profile?.telegram_enabled;
        
        if (tgEnabled && tgBotToken && tgChatId) {
          await fetch(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              chat_id: tgChatId, 
              text: `❌ <b>Auto-Publish Failed</b>\n\n<b>Title:</b> ${post.title}\n<b>Platform:</b> ${post.platform}\n\n<b>Error:</b> ${errorMessage}`, 
              parse_mode: 'HTML' 
            })
          });
        }
          
        results.push({ id: post.id, status: 'failed', error: errorMessage });
      }
    }

    return NextResponse.json({ message: "Processed scheduled posts.", results, count: posts.length });

  } catch (error: any) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
