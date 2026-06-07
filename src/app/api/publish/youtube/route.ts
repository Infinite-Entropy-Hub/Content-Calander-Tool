import { NextResponse } from "next/server";
import { publishToYouTube } from "@/lib/publishYouTube";

export async function POST(req: Request) {
  try {
    const { postId, userId } = await req.json();

    if (!postId || !userId) {
      return NextResponse.json({ error: "Missing postId or userId" }, { status: 400 });
    }

    const videoId = await publishToYouTube(postId, userId);

    return NextResponse.json({ success: true, videoId });
  } catch (error: any) {
    console.error("YouTube Publish Error:", error);
    return NextResponse.json({ error: error.message || "Failed to publish to YouTube" }, { status: 500 });
  }
}
