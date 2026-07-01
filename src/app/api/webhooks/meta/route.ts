import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/serverSupabase";
import { deliverFinalLink, processComment } from "@/lib/metaAutomation";
import { readMetaConnection } from "@/lib/metaCredentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge || "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

function validSignature(rawBody: string, signature: string | null, secrets: string[]) {
  if (!signature?.startsWith("sha256=")) return false;
  const b = Buffer.from(signature);
  return secrets.some((secret) => {
    const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
    const a = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  try {
    const body = JSON.parse(rawBody);
    const supabase = getServiceSupabase();
    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("api_keys");
    if (profilesError) throw profilesError;
    const secrets = (profiles || []).flatMap((profile) => {
      const instagram = readMetaConnection(profile.api_keys?.instagram)?.appSecret;
      const facebook = readMetaConnection(profile.api_keys?.facebook)?.appSecret;
      return [instagram, facebook].filter((value): value is string => Boolean(value));
    });
    if (!validSignature(rawBody, request.headers.get("x-hub-signature-256"), secrets)) {
      console.error("[meta-webhook] rejected invalid signature");
      return new Response("Invalid signature", { status: 401 });
    }

    console.log("[meta-webhook] verified delivery", { object: body.object, entries: body.entry?.length || 0 });
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (!["comments", "live_comments", "feed"].includes(change.field)) continue;
        const values = Array.isArray(change.value) ? change.value : [change.value];
        for (const comment of values) {
          const mediaId = comment.media?.id || comment.media_id || comment.post_id;
          if (!comment.id || !mediaId) continue;
          // Media IDs are globally unique. Match on the selected post rather than requiring
          // entry.id to equal the IG account ID, because Facebook Login webhook contexts vary.
          const { data: automations, error: automationsError } = await supabase.from("comment_automations").select("*")
            .eq("media_id", String(mediaId)).eq("is_enabled", true);
          if (automationsError) throw automationsError;
          console.log("[meta-webhook] comment received", {
            field: change.field,
            entryId: String(entry.id),
            mediaId: String(mediaId),
            commentId: String(comment.id),
            matchingAutomations: automations?.length || 0,
          });
          for (const automation of automations || []) {
            await processComment(automation, comment).catch((error) => console.error("Comment automation failed", error));
          }
        }
      }

      for (const messaging of entry.messaging || []) {
        if (messaging.message?.is_echo || !messaging.sender?.id) continue;
        const responseText = messaging.message?.quick_reply?.payload || messaging.message?.text || messaging.postback?.payload || "";
        await deliverFinalLink(String(messaging.sender.id), String(entry.id), responseText).catch((error) =>
          console.error("Final automation message failed", error),
        );
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Meta webhook error", error);
    return NextResponse.json({ received: false }, { status: 400 });
  }
}
