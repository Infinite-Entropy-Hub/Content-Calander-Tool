import { google } from "googleapis";
import axios from "axios";
import { Readable } from "stream";

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YOUTUBE_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN;

/**
 * Publishes a Video (Short) to YouTube
 * @param mediaUrl The public URL of the media (from Supabase)
 * @param title The video title
 * @param description The video description
 */
export async function publishToYouTube(mediaUrl: string, title: string, description: string) {
  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET || !YOUTUBE_REFRESH_TOKEN) {
    throw new Error("Missing YouTube API Credentials in Environment.");
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      YOUTUBE_CLIENT_ID,
      YOUTUBE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: YOUTUBE_REFRESH_TOKEN
    });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    // Download the video stream from Supabase URL to pass to YouTube API
    const response = await axios.get(mediaUrl, { responseType: 'stream' });

    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          tags: ['shorts'], // Default tag for shorts
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: response.data as Readable
      },
    });

    return res.data.id;
  } catch (error: any) {
    console.error("YouTube API Error:", error);
    throw new Error(error.message || "Failed to publish to YouTube");
  }
}
