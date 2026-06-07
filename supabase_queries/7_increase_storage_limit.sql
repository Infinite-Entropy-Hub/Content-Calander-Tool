-- 7_increase_storage_limit.sql
-- Increase the file size limit for the 'media' bucket to 500MB (524288000 bytes)

-- Update the file size limit on the existing bucket
UPDATE storage.buckets 
SET file_size_limit = 524288000 
WHERE id = 'media';
