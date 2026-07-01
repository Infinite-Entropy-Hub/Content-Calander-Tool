import { getServiceSupabase } from "@/lib/serverSupabase";
import { getMetaToken, META_API_VERSION, processComment } from "@/lib/metaAutomation";

export async function scanCommentAutomations() {
  const supabase = getServiceSupabase();
  const { data: automations, error } = await supabase.from("comment_automations").select("*")
    .eq("is_enabled", true).eq("scan_existing_comments", true).limit(25);
  if (error) throw error;

  const results: Array<Record<string, unknown>> = [];
  for (const automation of automations || []) {
    try {
      const token = await getMetaToken(automation.user_id);
      const response = await fetch(
        `https://graph.facebook.com/${META_API_VERSION}/${automation.media_id}/comments?fields=id,text,from,timestamp&limit=100&access_token=${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Unable to scan comments");

      let matched = 0;
      for (const comment of data.data || []) {
        const processed = await processComment(automation, comment);
        if (processed.matched && !processed.duplicate) matched += 1;
      }
      await supabase.from("comment_automations").update({ last_scanned_at: new Date().toISOString() }).eq("id", automation.id);
      results.push({ automationId: automation.id, name: automation.name, scanned: data.data?.length || 0, matched });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scan failed";
      console.error("[comment-automation-cron] scan failed", { automationId: automation.id, message });
      results.push({ automationId: automation.id, name: automation.name, error: message });
    }
  }

  console.log("[comment-automation-cron] scan complete", { processed: automations?.length || 0, results });
  return { processed: automations?.length || 0, results };
}
