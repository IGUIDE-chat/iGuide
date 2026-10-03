-- Migration: Create `dorm-images` storage bucket and apply RLS policies
-- Run this in the Supabase SQL Editor.

-- 1. Create the dorm-images bucket (publicly readable)
INSERT INTO
    storage.buckets (id, name, public)
VALUES (
        'dorm-images',
        'dorm-images',
        true
    )
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public read access to all files in dorm-images
CREATE POLICY "Public Read Access" ON storage.objects FOR
SELECT USING (bucket_id = 'dorm-images');

-- 3. Allow admin write access (insert/update/delete)
-- Uses the same is_admin metadata check pattern as the dorms table.
CREATE POLICY "Admin Write Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'dorm-images' AND
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
);

CREATE POLICY "Admin Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'dorm-images' AND
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
);

CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'dorm-images' AND
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
);