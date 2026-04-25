-- Add skin / cape fields to minecraft_accounts
ALTER TABLE public.minecraft_accounts
  ADD COLUMN IF NOT EXISTS skin_url text,
  ADD COLUMN IF NOT EXISTS cape_url text,
  ADD COLUMN IF NOT EXISTS skin_model text NOT NULL DEFAULT 'classic';

-- Public bucket for uploaded skins
INSERT INTO storage.buckets (id, name, public)
VALUES ('skins', 'skins', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "Skins are publicly readable" ON storage.objects;
CREATE POLICY "Skins are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'skins');

-- Authenticated user can upload to their own folder (first segment = user id)
DROP POLICY IF EXISTS "Users upload own skins" ON storage.objects;
CREATE POLICY "Users upload own skins"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'skins' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users update own skins" ON storage.objects;
CREATE POLICY "Users update own skins"
ON storage.objects FOR UPDATE
USING (bucket_id = 'skins' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own skins" ON storage.objects;
CREATE POLICY "Users delete own skins"
ON storage.objects FOR DELETE
USING (bucket_id = 'skins' AND auth.uid()::text = (storage.foldername(name))[1]);