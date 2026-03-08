# Supabase Storage Setup

If users are unable to see uploaded images, you may need to configure the Supabase storage bucket for public access.

## Steps to Configure Public Access

1. **Go to your Supabase Dashboard** → Storage
2. **Find the `template-images` bucket**
3. **Make the bucket public** by clicking the settings icon and enabling "Public bucket"
4. **Add RLS policy** if needed:

```sql
-- Allow public read access to template-images bucket
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'template-images');
```

## Alternative: Create the bucket manually

If the bucket doesn't exist, create it in Supabase Dashboard:

1. Go to Storage → Create Bucket
2. Name: `template-images`
3. Enable "Public bucket"
4. File size limit: 1MB
5. Allowed MIME types: `image/*`

## Verify Setup

Test by uploading an image in the editor and checking if the URL is publicly accessible.

Expected URL format: `https://your-project.supabase.co/storage/v1/object/public/template-images/{uuid}/image1.jpg`