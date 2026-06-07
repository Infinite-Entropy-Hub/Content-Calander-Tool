import axios from "axios";

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_PAGE_ID = process.env.META_APP_ID; // Usually you need the IG User ID connected to the page

/**
 * Publishes a Reel or Image to Instagram
 * @param mediaUrl The public URL of the media (from Supabase)
 * @param caption The caption text
 * @param isVideo True if it's a video/reel
 */
export async function publishToInstagram(mediaUrl: string, caption: string, isVideo: boolean) {
  if (!META_ACCESS_TOKEN || !META_PAGE_ID) {
    throw new Error("Missing Meta API Credentials in Environment.");
  }

  try {
    // Step 1: Create a media container
    const containerUrl = `https://graph.facebook.com/v19.0/${META_PAGE_ID}/media`;
    
    const containerPayload: any = {
      caption,
      access_token: META_ACCESS_TOKEN,
    };

    if (isVideo) {
      containerPayload.media_type = "REELS";
      containerPayload.video_url = mediaUrl;
    } else {
      containerPayload.image_url = mediaUrl;
    }

    const containerResponse = await axios.post(containerUrl, containerPayload);
    const creationId = containerResponse.data.id;

    if (!creationId) throw new Error("Failed to create media container");

    // Wait a bit for Meta to process the video before publishing
    if (isVideo) {
      await new Promise(resolve => setTimeout(resolve, 10000)); 
    }

    // Step 2: Publish the media container
    const publishUrl = `https://graph.facebook.com/v19.0/${META_PAGE_ID}/media_publish`;
    const publishResponse = await axios.post(publishUrl, {
      creation_id: creationId,
      access_token: META_ACCESS_TOKEN
    });

    return publishResponse.data.id; // Returns the published post ID
  } catch (error: any) {
    console.error("Meta API Error:", error?.response?.data || error.message);
    throw new Error(error?.response?.data?.error?.message || "Failed to publish to Instagram");
  }
}
