import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function publishToInstagram(postId: string, userId: string) {
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

  const igToken = profile.api_keys?.instagram;
  if (!igToken) throw new Error("Instagram API Key not configured");

  // 3. Meta API: Get Pages
  const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${igToken}`);
  const pagesData = await pagesRes.json();
  if (!pagesData.data || pagesData.data.length === 0) throw new Error("No Facebook Pages found");
  const pageId = pagesData.data[0].id;

  // 4. Meta API: Get IG Account
  const igAccRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${igToken}`);
  const igAccData = await igAccRes.json();
  const igUserId = igAccData.instagram_business_account?.id;
  if (!igUserId) throw new Error("No Instagram Business Account linked to this Facebook Page.");

  // 5. Meta API: Create Media Container
  const isVideo = post.media_url.match(/\.(mp4|mov|webm)$/i);
  let containerUrl = `https://graph.facebook.com/v19.0/${igUserId}/media?access_token=${igToken}`;
  
  if (post.post_format === 'story') {
    containerUrl += `&media_type=STORIES`;
    if (isVideo) {
      containerUrl += `&video_url=${encodeURIComponent(post.media_url)}`;
    } else {
      containerUrl += `&image_url=${encodeURIComponent(post.media_url)}`;
    }
  } else if (isVideo) {
    containerUrl += `&media_type=REELS&video_url=${encodeURIComponent(post.media_url)}`;
    if (post.description) containerUrl += `&caption=${encodeURIComponent(post.description)}`;
  } else {
    containerUrl += `&image_url=${encodeURIComponent(post.media_url)}`;
    if (post.description) containerUrl += `&caption=${encodeURIComponent(post.description)}`;
  }

  const createContainerRes = await fetch(containerUrl, { method: "POST" });
  const createContainerData = await createContainerRes.json();

  if (createContainerData.error) throw new Error(`Meta API Container Error: ${createContainerData.error.message}`);
  
  const creationId = createContainerData.id;

  // 6. Meta API: Poll
  let isReady = false;
  let attempts = 0;
  while (!isReady && attempts < 10) {
    const statusRes = await fetch(`https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${igToken}`);
    const statusData = await statusRes.json();
    
    if (statusData.status_code === 'FINISHED' || !statusData.status_code) {
      isReady = true;
      break;
    } else if (statusData.status_code === 'ERROR') {
      throw new Error("Meta API Error processing video");
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  // 7. Meta API: Publish
  const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish?creation_id=${creationId}&access_token=${igToken}`, { method: "POST" });
  const publishData = await publishRes.json();

  if (publishData.error) throw new Error(`Meta API Publish Error: ${publishData.error.message}`);

  // 8. Update DB
  await supabase
    .from("posts")
    .update({ status: "published" })
    .eq("id", postId);

  return publishData.id;
}
