import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { publishToInstagram } from "@/lib/publishInstagram";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  try {
    // Basic security for cron (in production, use Vercel cron secret)
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Fetch all scheduled posts that are due
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_for", now);

    if (error) {
      throw error;
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ message: "No posts to process" });
    }

    const results = [];

    // Process each post
    for (const post of posts) {
      try {
        if (post.platform === "instagram") {
          const igPostId = await publishToInstagram(post.id, post.user_id);
          results.push({ id: post.id, success: true, igPostId });
        } else if (post.platform === "facebook") {
          const { publishToFacebook } = await import("@/lib/publishFacebook");
          const fbPostId = await publishToFacebook(post.id, post.user_id);
          results.push({ id: post.id, success: true, fbPostId });
        } else {
          // Future: handle other platforms
          results.push({ id: post.id, success: false, reason: "Platform not supported for auto-publish yet" });
        }
      } catch (err: any) {
        console.error(`Failed to publish post ${post.id}:`, err);
        results.push({ id: post.id, success: false, error: err.message });
      }
    }

    return NextResponse.json({ processed: posts.length, results });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
