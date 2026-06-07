import { NextResponse } from "next/server";
import { publishToTwitter } from "@/lib/publishTwitter";

export async function POST(req: Request) {
  try {
    const { postId, userId } = await req.json();

    if (!postId || !userId) {
      return NextResponse.json({ error: "Missing postId or userId" }, { status: 400 });
    }

    const tweetId = await publishToTwitter(postId, userId);

    return NextResponse.json({ success: true, tweetId });
  } catch (error: any) {
    console.error("Twitter Publish Error:", error);
    return NextResponse.json({ error: error.message || "Failed to publish to Twitter" }, { status: 500 });
  }
}
