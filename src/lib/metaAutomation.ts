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

type MetaStep = "public_reply" | "private_reply" | "final_message";
type MetaCallContext = {
  step: MetaStep;
  commentId?: string;
  mediaId?: string;
  automationId: string;
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

async function metaPost(host: string, path: string, token: string, body: unknown, context: MetaCallContext) {
  const logContext = {
    step: context.step,
    endpoint: `https://${host}/${META_API_VERSION}/${path}`,
    graphApiVersion: META_API_VERSION,
    commentId: context.commentId || null,
    mediaId: context.mediaId || null,
    automationId: context.automationId,
  };
  console.log("[meta-automation] request", logContext);
  const response = await fetch(`https://${host}/${META_API_VERSION}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    console.error("[meta-automation] response error", { ...logContext, status: response.status, response: data });
    const error = new Error(data?.error?.message || `Meta request failed (${response.status})`);
    Object.assign(error, { metaResponse: data, metaStatus: response.status });
    throw error;
  }
  console.log("[meta-automation] response success", { ...logContext, status: response.status, response: data });
  return data;
}

export async function getMetaToken(userId: string, instagramAccountId?: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.from("profiles").select("api_keys").eq("id", userId).single();
  if (error) throw error;
  const connection = getMetaConnection(data?.api_keys);
  if (!connection) throw new Error("Meta access token is not connected");
  console.log("[meta-automation] request", {
    step: "resolve_page_token",
    endpoint: `https://graph.facebook.com/${META_API_VERSION}/me/accounts`,
    graphApiVersion: META_API_VERSION,
    instagramAccountId: instagramAccountId || null,
  });
  const pagesResponse = await fetch(
    `https://graph.facebook.com/${META_API_VERSION}/me/accounts?fields=id,access_token,instagram_business_account&access_token=${encodeURIComponent(connection.token)}`,
    { cache: "no-store" },
  );
  const pagesData = await pagesResponse.json();
  if (!pagesResponse.ok) throw new Error(pagesData?.error?.message || "Unable to resolve Meta Page token");
  const page = pagesData.data?.find((item: { instagram_business_account?: { id?: string } }) =>
    !instagramAccountId || String(item.instagram_business_account?.id) === String(instagramAccountId),
  ) || pagesData.data?.[0];
  if (!page?.access_token) throw new Error("No Page access token found for the connected Instagram account");
  console.log("[meta-automation] response success", {
    step: "resolve_page_token",
    graphApiVersion: META_API_VERSION,
    pageId: page.id,
    instagramAccountId: page.instagram_business_account?.id || null,
  });
  return page.access_token as string;
}

function metaError(error: unknown) {
  const value = error as Error & { metaResponse?: unknown };
  return {
    message: value instanceof Error ? value.message : "Unknown Meta error",
    response: value?.metaResponse || null,
  };
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

  let token: string;
  try {
    token = await getMetaToken(automation.user_id, automation.platform_account_id);
  } catch (error) {
    await supabase.from("comment_automation_events").update({
      status: "failed", error_message: metaError(error).message,
      updated_at: new Date().toISOString(),
    }).eq("id", event.id);
    throw error;
  }

  const values = { username, keyword };
  const host = "graph.facebook.com";
  const callContext = { commentId: comment.id, mediaId: automation.media_id, automationId: automation.id };
  let publicData: { id?: string };
  try {
    publicData = await metaPost(host, `${comment.id}/replies`, token, {
      message: render(automation.public_reply, values),
    }, { ...callContext, step: "public_reply" });
    await supabase.from("comment_automation_events").update({
      public_reply_status: "succeeded",
      public_reply_id: publicData.id || null,
      meta_response: { public_reply: publicData },
      updated_at: new Date().toISOString(),
    }).eq("id", event.id);
  } catch (error) {
    const detail = metaError(error);
    await supabase.from("comment_automation_events").update({
      status: "failed",
      public_reply_status: "failed",
      error_message: detail.message,
      meta_response: { public_reply_error: detail.response },
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", event.id);
    throw error;
  }

  const commentAge = comment.timestamp ? Date.now() - new Date(comment.timestamp).getTime() : 0;
  const privateReplyEligible = automation.platform === "instagram" && (!comment.timestamp || commentAge <= 7 * 24 * 60 * 60 * 1000);
  if (!privateReplyEligible) {
    await supabase.from("comment_automation_events").update({
      status: "partial_success", private_reply_status: "ineligible", final_status: "disabled",
      processed_at: new Date().toISOString(), updated_at: new Date().toISOString(), error_message: null,
    }).eq("id", event.id);
    return { matched: true, eventId: event.id, publicReply: "succeeded", privateReply: "ineligible" };
  }

  try {
    const privateData = await metaPost(host, `${automation.platform_account_id}/messages`, token, {
      recipient: { comment_id: comment.id },
      message: { text: render(automation.private_reply, values) },
    }, { ...callContext, step: "private_reply" });
    await supabase.from("comment_automation_events").update({
      status: "awaiting_response",
      private_reply_status: "succeeded",
      private_message_id: privateData.message_id || null,
      recipient_id: privateData.recipient_id || commenterId,
      final_status: "awaiting_response",
      meta_response: { public_reply: publicData, private_reply: privateData },
      processed_at: new Date().toISOString(), updated_at: new Date().toISOString(), error_message: null,
    }).eq("id", event.id);
    return { matched: true, eventId: event.id, publicReply: "succeeded", privateReply: "succeeded" };
  } catch (error) {
    const detail = metaError(error);
    await supabase.from("comment_automation_events").update({
      status: "partial_success",
      private_reply_status: "failed",
      private_reply_error: detail.message,
      final_status: "disabled",
      error_message: null,
      meta_response: { public_reply: publicData, private_reply_error: detail.response },
      processed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq("id", event.id);
    return { matched: true, eventId: event.id, publicReply: "succeeded", privateReply: "failed", privateReplyError: detail.message };
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
  const token = await getMetaToken(event.user_id, accountId);
  let result;
  try {
    result = await metaPost("graph.facebook.com", `${accountId}/messages`, token, {
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
    }, { step: "final_message", automationId: automation.id, mediaId: automation.media_id });
  } catch (error) {
    const detail = metaError(error);
    await supabase.from("comment_automation_events").update({
      final_status: "failed", error_message: detail.message,
      meta_response: { final_message_error: detail.response }, updated_at: new Date().toISOString(),
    }).eq("id", event.id);
    throw error;
  }
  await supabase.from("comment_automation_events").update({
    status: "completed", final_message_id: result.message_id || null,
    final_status: "succeeded",
    processed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }).eq("id", event.id);
  return true;
}
