import { getServiceSupabase } from "@/lib/serverSupabase";
import { getMetaConnection } from "@/lib/metaCredentials";

export const META_API_VERSION = process.env.META_GRAPH_API_VERSION || "v25.0";

type Automation = {
  id: string; user_id: string; platform: "instagram" | "facebook";
  platform_account_id: string; media_id: string; keywords: string[];
  match_type: "contains" | "exact" | "any_word"; public_reply: string;
  private_reply: string; confirmation_word: string; final_message: string;
  final_link_url: string; final_button_text: string;
};

type MetaComment = {
  id: string; text?: string; username?: string; from?: { id?: string; username?: string };
  user_id?: string; media?: { id?: string }; media_id?: string; timestamp?: string;
};

function render(template: string, values: Record<string, string>) {
  return template.replace(/\{\{(username|keyword)\}\}/g, (_, key) => values[key] || "");
}

function matches(text: string, keywords: string[], type: Automation["match_type"]) {
  const normalized = text.trim().toLocaleLowerCase();
  return keywords.some((raw) => {
    const keyword = raw.trim().toLocaleLowerCase();
    if (!keyword) return false;
    if (type === "exact") return normalized === keyword;
    if (type === "any_word") return normalized.split(/[^\p{L}\p{N}_]+/u).includes(keyword);
    return normalized.includes(keyword);
  });
}

async function metaPost(host: string, path: string, token: string, body: unknown) {
  const response = await fetch(`https://${host}/${META_API_VERSION}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Meta request failed (${response.status})`);
  return data;
}

export async function getMetaToken(userId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from("profiles").select("api_keys").eq("id", userId).single();
  if (error) throw error;
  const connection = getMetaConnection(data?.api_keys);
  if (!connection) throw new Error("Meta access token is not connected");
  return connection.token;
}

export async function processComment(automation: Automation, comment: MetaComment) {
  const text = comment.text || "";
  if (!matches(text, automation.keywords, automation.match_type)) return { matched: false };

  const supabase = getServiceSupabase();
  const username = comment.username || comment.from?.username || "there";
  const commenterId = comment.user_id || comment.from?.id || null;
  const keyword = automation.keywords.find((item) => text.toLowerCase().includes(item.toLowerCase())) || automation.keywords[0] || "";
  const eventBase = {
    automation_id: automation.id, user_id: automation.user_id, platform: automation.platform,
    platform_comment_id: comment.id, platform_media_id: automation.media_id,
    commenter_id: commenterId, commenter_username: username, comment_text: text,
    comment_created_at: comment.timestamp || null,
  };
  const { data: event, error: insertError } = await supabase
    .from("comment_automation_events")
    .upsert({ ...eventBase, status: "processing", attempt_count: 1 }, { onConflict: "automation_id,platform_comment_id", ignoreDuplicates: true })
    .select("id,status").maybeSingle();
  if (insertError) throw insertError;
  if (!event) return { matched: true, duplicate: true };

  try {
    const token = await getMetaToken(automation.user_id);
    const values = { username, keyword };
    const host = automation.platform === "instagram" ? "graph.facebook.com" : "graph.facebook.com";
    const publicData = await metaPost(host, `${comment.id}/replies`, token, {
      message: render(automation.public_reply, values),
    });

    let privateData: { message_id?: string; recipient_id?: string } | null = null;
    const commentAge = comment.timestamp ? Date.now() - new Date(comment.timestamp).getTime() : 0;
    const privateReplyEligible = !comment.timestamp || commentAge <= 7 * 24 * 60 * 60 * 1000;
    if (automation.platform === "instagram" && privateReplyEligible) {
      privateData = await metaPost(host, `${automation.platform_account_id}/messages`, token, {
        recipient: { comment_id: comment.id },
        message: { text: render(automation.private_reply, values) },
      });
    }

    await supabase.from("comment_automation_events").update({
      status: privateData ? "awaiting_response" : "completed",
      public_reply_id: publicData.id || null,
      private_message_id: privateData?.message_id || null,
      recipient_id: privateData?.recipient_id || commenterId,
      processed_at: new Date().toISOString(), updated_at: new Date().toISOString(), error_message: null,
    }).eq("id", event.id);
    return { matched: true, eventId: event.id };
  } catch (error) {
    await supabase.from("comment_automation_events").update({
      status: "failed", error_message: error instanceof Error ? error.message : "Unknown error",
      updated_at: new Date().toISOString(),
    }).eq("id", event.id);
    throw error;
  }
}

export async function deliverFinalLink(recipientId: string, accountId: string, responseText: string) {
  const supabase = getServiceSupabase();
  const { data: event } = await supabase.from("comment_automation_events")
    .select("id,user_id,automation_id,comment_automations(*)")
    .eq("recipient_id", recipientId).eq("status", "awaiting_response")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!event) return false;
  const automation = event.comment_automations as unknown as Automation;
  if (!automation || automation.platform_account_id !== accountId) return false;
  if (responseText.trim().toLocaleLowerCase() !== automation.confirmation_word.trim().toLocaleLowerCase()) return false;
  const token = await getMetaToken(event.user_id);
  const result = await metaPost("graph.facebook.com", `${accountId}/messages`, token, {
    recipient: { id: recipientId }, messaging_type: "RESPONSE",
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: automation.final_message,
          buttons: [{ type: "web_url", url: automation.final_link_url, title: automation.final_button_text }],
        },
      },
    },
  });
  await supabase.from("comment_automation_events").update({
    status: "completed", final_message_id: result.message_id || null,
    processed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq("id", event.id);
  return true;
}
