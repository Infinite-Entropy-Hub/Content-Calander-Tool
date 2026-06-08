import { NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { files } = await req.json(); 

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'No files provided for deletion' }, { status: 400 });
    }

    const supabasePaths: string[] = [];
    const r2Keys: string[] = [];

    for (const file of files) {
      if (file.source === 'supabase') {
        supabasePaths.push(`${user.id}/${file.name}`);
      } else if (file.source === 'cloudflare' && file.r2Key) {
        if (file.r2Key.startsWith(`${user.id}/`)) {
          r2Keys.push(file.r2Key);
        }
      }
    }

    let deletedCount = 0;

    // 1. Delete from Supabase
    if (supabasePaths.length > 0) {
      const { error } = await supabase.storage.from("media").remove(supabasePaths);
      if (error) {
        console.error("Supabase delete error:", error);
      } else {
        deletedCount += supabasePaths.length;
      }
    }

    // 2. Delete from Cloudflare R2
    if (r2Keys.length > 0) {
      const accountId = process.env.R2_ACCOUNT_ID;
      const accessKeyId = process.env.R2_ACCESS_KEY_ID;
      const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      const bucketName = process.env.R2_BUCKET_NAME;

      if (accountId && accessKeyId && secretAccessKey && bucketName) {
        const S3 = new S3Client({
          region: "auto",
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey,
          },
        });

        for (const key of r2Keys) {
          const command = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key,
          });
          try {
            await S3.send(command);
            deletedCount++;
          } catch (r2Error) {
            console.error(`Failed to delete R2 key ${key}:`, r2Error);
          }
        }
      }
    }

    return NextResponse.json({ success: true, deletedCount });

  } catch (error: any) {
    console.error("Delete media error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
