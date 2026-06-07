import { createClient } from "@supabase/supabase-js";
import { TwitterApi } from "twitter-api-v2";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function publishToTwitter(postId: string, userId: string) {
  // 1. Fetch Post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (postError || !post) throw new Error("Post not found");
  
  const appKey = process.env.TWITTER_API_KEY;
  const appSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!appKey || !appSecret || !accessToken || !accessSecret) {
    throw new Error("Twitter API credentials must be configured in .env.local");
  }

  // 2. Setup Client
  const twitterClient = new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
  });
  const client = twitterClient.readWrite;

  let mediaIds: string[] = [];

  // 3. Upload Media
  if (post.media_urls && post.media_urls.length > 0) {
    for (const url of post.media_urls) {
      const res = await fetch(url);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Twitter requires mimeType
      const mimeType = res.headers.get("content-type") || undefined;
      const mediaId = await client.v1.uploadMedia(buffer, { mimeType });
      mediaIds.push(mediaId);
    }
  } else if (post.media_url) {
    const res = await fetch(post.media_url);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = res.headers.get("content-type") || undefined;
    const mediaId = await client.v1.uploadMedia(buffer, { mimeType });
    mediaIds.push(mediaId);
  }

  // 4. Create Tweet
  const tweetRes = await client.v2.tweet({
    text: post.description || post.title || "",
    media: mediaIds.length > 0 ? { media_ids: mediaIds as [string] } : undefined,
  });

  if (tweetRes.errors) {
    throw new Error(`Twitter Publish Error: ${JSON.stringify(tweetRes.errors)}`);
  }

  // 5. Update DB
  await supabase
    .from("posts")
    .update({ status: "published" })
    .eq("id", postId);

  return tweetRes.data.id;
}
