import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/serverSupabase";
import { getMetaToken, META_API_VERSION, processComment } from "@/lib/metaAutomation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const { data: automations, error } = await supabase.from("comment_automations").select("*")
    .eq("is_enabled", true).eq("scan_existing_comments", true).limit(25);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const results: unknown[] = [];

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
      results.push({ automationId: automation.id, scanned: data.data?.length || 0, matched });
    } catch (scanError) {
      results.push({ automationId: automation.id, error: scanError instanceof Error ? scanError.message : "Scan failed" });
    }
  }
  return NextResponse.json({ processed: automations?.length || 0, results });
}
