import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: Request) {
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

    const allMedia = [];

    // 1. Fetch from Supabase
    const { data: supabaseData, error: supabaseError } = await supabase.storage
      .from("media")
      .list(user.id, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (!supabaseError && supabaseData) {
      for (const file of supabaseData) {
        if (file.name === ".emptyFolderPlaceholder") continue;
        const { data: publicUrlData } = supabase.storage
          .from("media")
          .getPublicUrl(`${user.id}/${file.name}`);
        
        allMedia.push({
          id: `supa_${file.id}`,
          name: file.name,
          updated_at: file.updated_at || new Date().toISOString(),
          metadata: {
            size: file.metadata?.size || 0,
            mimetype: file.metadata?.mimetype || '',
          },
          url: publicUrlData.publicUrl,
          source: 'supabase'
        });
      }
    }

    // 2. Fetch from Cloudflare R2
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrlBase = process.env.R2_PUBLIC_URL;

    if (accountId && accessKeyId && secretAccessKey && bucketName && publicUrlBase) {
      const S3 = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: accessKeyId,
          secretAccessKey: secretAccessKey,
        },
      });

      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `${user.id}/`, // only get user's files
      });

      try {
        const r2Data = await S3.send(command);
        if (r2Data.Contents) {
          for (const item of r2Data.Contents) {
            const fileName = item.Key?.split('/').pop() || item.Key;
            if (!fileName) continue;
            
            allMedia.push({
              id: `r2_${item.ETag?.replace(/"/g, '') || Math.random()}`,
              name: fileName,
              updated_at: item.LastModified?.toISOString() || new Date().toISOString(),
              metadata: {
                size: item.Size || 0,
                mimetype: fileName.match(/\.(mp4|mov|webm)$/i) ? 'video/mp4' : 'image/jpeg', 
              },
              url: `${publicUrlBase}/${item.Key}`,
              source: 'cloudflare',
              r2Key: item.Key 
            });
          }
        }
      } catch (r2Error) {
        console.error("Error fetching from R2:", r2Error);
      }
    }

    // Sort combined media by updated_at descending
    allMedia.sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());

    return NextResponse.json({ media: allMedia });

  } catch (error: any) {
    console.error("List media error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
