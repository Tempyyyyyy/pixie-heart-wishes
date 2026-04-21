-- Профиль: новые поля
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS hours_played integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mod_installs integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS achievements integer NOT NULL DEFAULT 0;

-- Инстансы: новые поля для модпаков
ALTER TABLE public.instances
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS mrpack_url text,
  ADD COLUMN IF NOT EXISTS modrinth_project_id text;

-- Bucket для баннеров
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket для аватарок (если ещё не было)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Политики для баннеров: публичное чтение, владелец пишет в свою папку
DROP POLICY IF EXISTS "Banners public read" ON storage.objects;
CREATE POLICY "Banners public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "Banners owner write" ON storage.objects;
CREATE POLICY "Banners owner write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Banners owner update" ON storage.objects;
CREATE POLICY "Banners owner update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Banners owner delete" ON storage.objects;
CREATE POLICY "Banners owner delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Политики для аватарок (на всякий случай, если их не было)
DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;
CREATE POLICY "Avatars public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatars owner write" ON storage.objects;
CREATE POLICY "Avatars owner write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Avatars owner update" ON storage.objects;
CREATE POLICY "Avatars owner update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Avatars owner delete" ON storage.objects;
CREATE POLICY "Avatars owner delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );