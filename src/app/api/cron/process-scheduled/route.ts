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
      .eq('kanban_status', 'scheduled')
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

        let destinations = post.destinations || [];
        let allSuccess = true;
        let anyProcessed = false;

        for (let i = 0; i < destinations.length; i++) {
          let dest = destinations[i];
          if (dest.status !== 'scheduled') {
             if (dest.status === 'failed') allSuccess = false;
             continue;
          }
          anyProcessed = true;

          try {
            if (post.auto_publish === false) {
              // HYBRID MANUAL WORKFLOW
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://postcal.vercel.app';
              const tgMsg = `🔔 <b>Time to Post! (Manual)</b>\n\n<b>Title:</b> ${post.title}\n<b>Platform:</b> ${dest.platform}\n<b>Format:</b> ${dest.post_format || 'Post'}\n\n👉 <a href="${appUrl}/dashboard">Open App to Download Media & Post</a>`;
              
              const inline_keyboard = [
                [ { text: '✅ Mark as Published', callback_data: `action_published_${post.id}` } ],
                [ { text: '⏰ Remind in 30m', callback_data: `action_remind_30_${post.id}` } ]
              ];
              await sendTelegram(tgMsg, { inline_keyboard });

              const emailHtml = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <div style="background-color: #6366f1; padding: 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">🔔 Time to Publish!</h1>
                  </div>
                  <div style="padding: 24px; background-color: #ffffff;">
                    <h2 style="color: #1f2937; margin-top: 0;">${post.title}</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">It's time to manually publish your post.</p>
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
                      <p style="margin: 0 0 8px 0;"><strong>Platform:</strong> ${dest.platform.toUpperCase()}</p>
                      <p style="margin: 0 0 8px 0;"><strong>Format:</strong> ${dest.post_format || 'Post'}</p>
                    </div>
                    <div style="text-align: center; margin-top: 32px;">
                      <a href="${appUrl}/dashboard" style="display: inline-block; padding: 14px 28px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Open Content Calendar</a>
                    </div>
                  </div>
                </div>
              `;
              await sendEmail(`Time to post: ${post.title}`, emailHtml);

              dest.status = 'notified';
              allSuccess = false; // Requires manual intervention, so kanban isn't fully published yet
              results.push({ id: post.id, platform: dest.platform, status: 'notified' });

            } else {
              // AUTOMATED WORKFLOW
              let platformId = null;
              switch (dest.platform) {
                case 'instagram': platformId = await publishToInstagram(post.id, post.user_id); break;
                case 'facebook': platformId = await publishToFacebook(post.id, post.user_id); break;
                case 'youtube': platformId = await publishToYouTube(post.id, post.user_id); break;
                case 'x':
                case 'twitter': platformId = await publishToTwitter(post.id, post.user_id); break;
                default: throw new Error(`Unsupported platform: ${dest.platform}`);
              }
              
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://postcal.vercel.app';
              await sendTelegram(`✅ <b>Auto-Publish Success</b>\n\n<b>Title:</b> ${post.title}\n<b>Platform:</b> ${dest.platform}\n\n👉 <a href="${appUrl}/dashboard">View in Dashboard</a>`);
              
              dest.status = 'published';
              dest.external_id = platformId;
              dest.error_log = null;
              results.push({ id: post.id, platform: dest.platform, status: 'success' });
            }
          } catch (err: any) {
            console.error(`Error publishing post ${post.id} to ${dest.platform}:`, err);
            const errorMessage = err.message || JSON.stringify(err);
            dest.status = 'failed';
            dest.error_log = errorMessage;
            allSuccess = false;

            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://postcal.vercel.app';
            await sendTelegram(`❌ <b>Auto-Publish Failed</b>\n\n<b>Title:</b> ${post.title}\n<b>Platform:</b> ${dest.platform}\n\n<b>Error:</b> ${errorMessage}\n\n👉 <a href="${appUrl}/dashboard">Fix in Dashboard</a>`);
            results.push({ id: post.id, platform: dest.platform, status: 'failed', error: errorMessage });
          }
        } // end loop

        if (anyProcessed) {
          let newKanban = post.kanban_status;
          if (allSuccess && post.auto_publish) {
             newKanban = 'published';
          }
          await supabaseAdmin.from('posts').update({ destinations, kanban_status: newKanban }).eq('id', post.id);
        }

      } catch (postError) {
        console.error("Error processing post", post.id, postError);
      }
    }

    return NextResponse.json({ message: "Processed scheduled posts.", results, count: posts.length });

  } catch (error: any) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
