-- Create policy to allow authenticated users to upload files to the 'media' bucket
CREATE POLICY "Allow authenticated users to upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'media' AND 
    auth.role() = 'authenticated'
);

-- Create policy to allow authenticated users to update their own files
CREATE POLICY "Allow authenticated users to update media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'media' AND 
    auth.uid() = owner
);

-- Create policy to allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated users to delete media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'media' AND 
    auth.uid() = owner
);

-- (Optional) If you didn't check "Public" when creating the bucket, run this to allow public read access:
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'media'
);
