import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function publishToFacebook(postId: string, userId: string) {
  // 1. Fetch Post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (postError || !post) throw new Error("Post not found");

  // 2. Fetch Keys
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("api_keys")
    .eq("id", userId)
    .single();

  if (profileError || !profile) throw new Error("Profile not found");

  const igToken = profile.api_keys?.instagram; // We reuse the same Meta token
  if (!igToken) throw new Error("Meta/Facebook API Key not configured");

  // 3. Meta API: Get Facebook Pages and Page Access Token
  const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,access_token&access_token=${igToken}`);
  const pagesData = await pagesRes.json();
  
  if (!pagesData.data || pagesData.data.length === 0) {
    throw new Error("No Facebook Pages found. Make sure you assigned the Page to the System User in Meta Business Settings.");
  }
  
  const pageId = pagesData.data[0].id;
  const pageToken = pagesData.data[0].access_token || igToken;

  // 4. Publish to Facebook Page
  let publishData: any;

  if (post.media_urls && post.media_urls.length > 1) {
    // --- CAROUSEL LOGIC ---
    const mediaFbIds = [];

    // Upload each photo as unpublished
    for (const url of post.media_urls) {
      const uploadRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos?url=${encodeURIComponent(url)}&published=false&access_token=${pageToken}`, { method: "POST" });
      const uploadData = await uploadRes.json();
      if (uploadData.error) throw new Error(`Facebook Photo Upload Error: ${uploadData.error.message}`);
      mediaFbIds.push({ "media_fbid": uploadData.id });
    }

    // Publish them together in a feed post
    const feedRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: post.description || "",
        attached_media: mediaFbIds,
        access_token: pageToken
      })
    });
    publishData = await feedRes.json();

  } else {
    // --- SINGLE MEDIA LOGIC ---
    const mediaUrl = post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : post.media_url;
    if (!mediaUrl) throw new Error("No media attached to post");

    const isVideo = mediaUrl.match(/\.(mp4|mov|webm)$/i);
    let publishUrl = "";
    
    if (isVideo) {
      publishUrl = `https://graph.facebook.com/v19.0/${pageId}/videos?file_url=${encodeURIComponent(mediaUrl)}&description=${encodeURIComponent(post.description || "")}&access_token=${pageToken}`;
    } else {
      publishUrl = `https://graph.facebook.com/v19.0/${pageId}/photos?url=${encodeURIComponent(mediaUrl)}&message=${encodeURIComponent(post.description || "")}&access_token=${pageToken}`;
    }

    const publishRes = await fetch(publishUrl, { method: "POST" });
    publishData = await publishRes.json();
  }

  if (publishData.error) throw new Error(`Facebook Publish Error: ${publishData.error.message}`);

  // 8. Update DB
  await supabase
    .from("posts")
    .update({ status: "published", platform_post_id: publishData.id })
    .eq("id", postId);

  return publishData.id;
}
