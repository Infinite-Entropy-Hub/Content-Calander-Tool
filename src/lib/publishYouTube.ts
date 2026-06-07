import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import { Readable } from "stream";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function publishToYouTube(postId: string, userId: string) {
  // 1. Fetch Post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (postError || !post) throw new Error("Post not found");
  
  const mediaUrl = post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : post.media_url;
  if (!mediaUrl) throw new Error("No media attached to post");

  // 2. Fetch Keys
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("api_keys")
    .eq("id", userId)
    .single();

  if (profileError || !profile) throw new Error("Profile not found");

  const ytRefreshToken = profile.api_keys?.youtube;
  if (!ytRefreshToken) throw new Error("YouTube Refresh Token not configured in Profile");

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET must be set in .env");
  }

  // 3. Setup OAuth2 Client
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: ytRefreshToken });

  const youtube = google.youtube({ version: "v3", auth: oauth2Client });

  // 4. Download video from Supabase to a readable stream
  const mediaRes = await fetch(mediaUrl);
  if (!mediaRes.ok || !mediaRes.body) throw new Error("Failed to fetch media from storage");
  
  // Node.js standard readable stream for googleapis
  const nodeStream = Readable.fromWeb(mediaRes.body as any);

  // 5. Upload to YouTube
  const insertRes = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: post.title,
        description: post.description || "",
      },
      status: {
        privacyStatus: "public",
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: nodeStream,
    },
  });

  if (!insertRes.data.id) {
    throw new Error("Failed to upload to YouTube");
  }

  // 6. Update DB
  await supabase
    .from("posts")
    .update({ status: "published" })
    .eq("id", postId);

  return insertRes.data.id;
}
