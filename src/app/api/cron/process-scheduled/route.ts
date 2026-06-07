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
        let platformId = null;
        
        switch (post.platform) {
          case 'instagram':
            platformId = await publishToInstagram(post.id, post.user_id);
            break;
          case 'facebook':
            platformId = await publishToFacebook(post.id, post.user_id);
            break;
          case 'youtube':
            platformId = await publishToYouTube(post.id, post.user_id);
            break;
          case 'x':
          case 'twitter':
            platformId = await publishToTwitter(post.id, post.user_id);
            break;
          default:
            throw new Error(`Unsupported platform: ${post.platform}`);
        }

        // The lib functions generally update the status to "published" already.
        // But we ensure published_at is set here.
        const { error: updateError } = await supabaseAdmin
          .from('posts')
          .update({ 
            published_at: new Date().toISOString()
          })
          .eq('id', post.id);

        if (updateError) throw updateError;

        results.push({ id: post.id, status: 'success', platformId });
        
      } catch (err: any) {
        console.error(`Error publishing post ${post.id}:`, err);
        
        // Append error to notes and mark as failed
        const errorMessage = err.message || JSON.stringify(err);
        const newNotes = post.notes ? `${post.notes}\n\n[AUTO-PUBLISH FAILED]: ${errorMessage}` : `[AUTO-PUBLISH FAILED]: ${errorMessage}`;
        
        await supabaseAdmin
          .from('posts')
          .update({ 
            status: 'failed', 
            notes: newNotes 
          })
          .eq('id', post.id);
          
        results.push({ id: post.id, status: 'failed', error: errorMessage });
      }
    }

    return NextResponse.json({ message: "Processed scheduled posts.", results, count: posts.length });

  } catch (error: any) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
