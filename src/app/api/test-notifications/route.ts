import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, telegramChatId } = await req.json();

    const resendKey = process.env.RESEND_API_KEY;
    const tgBotToken = process.env.TELEGRAM_BOT_TOKEN;

    const results = [];

    // 1. Send Test Email
    if (email && resendKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${resendKey}` 
          },
          body: JSON.stringify({
            from: 'Content Calendar <postremainder@skan.space>',
            to: [email],
            subject: 'Test Notification - Content Calendar',
            html: `
              <h2>Test Successful! 🎉</h2>
              <p>Your email is correctly configured for Hybrid Automation notifications.</p>
            `
          })
        });
        const data = await res.json();
        if (res.ok) {
          results.push({ type: 'email', status: 'success' });
        } else {
          console.error("Resend error:", data);
          results.push({ type: 'email', status: 'failed', error: data });
        }
      } catch (e: any) {
        results.push({ type: 'email', status: 'failed', error: e.message });
      }
    }

    // 2. Send Test Telegram
    if (telegramChatId && tgBotToken) {
      try {
        const tgMsg = `🔔 <b>Test Successful!</b>\n\nYour Telegram integration is correctly configured for Content Calendar notifications.`;
        const res = await fetch(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: telegramChatId, text: tgMsg, parse_mode: 'HTML' })
        });
        const data = await res.json();
        if (res.ok) {
          results.push({ type: 'telegram', status: 'success' });
        } else {
          console.error("Telegram error:", data);
          results.push({ type: 'telegram', status: 'failed', error: data });
        }
      } catch (e: any) {
        results.push({ type: 'telegram', status: 'failed', error: e.message });
      }
    }

    if (results.length === 0) {
      return NextResponse.json({ error: "Missing email/telegramChatId or API keys in .env.local" }, { status: 400 });
    }

    return NextResponse.json({ message: "Test processed", results });

  } catch (error: any) {
    console.error("Test Notification Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
