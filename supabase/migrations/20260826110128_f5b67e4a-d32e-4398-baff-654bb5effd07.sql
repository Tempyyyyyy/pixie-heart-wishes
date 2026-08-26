-- 1. Friendship status escalation
DROP POLICY IF EXISTS "Addressee can accept request" ON public.friendships;
CREATE POLICY "Addressee can accept request"
ON public.friendships FOR UPDATE TO authenticated
USING (auth.uid() = addressee_id AND status = 'pending'::friendship_status)
WITH CHECK (auth.uid() = addressee_id AND status = 'accepted'::friendship_status);

-- 2. profile_likes: hide social graph from anonymous visitors
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.profile_likes;
CREATE POLICY "Authenticated users can view likes"
ON public.profile_likes FOR SELECT TO authenticated
USING (true);
REVOKE SELECT ON public.profile_likes FROM anon;

-- 3. SECURITY DEFINER trigger functions must not be callable via the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_profile_like() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;

-- 4. Public buckets should not be listable
DROP POLICY IF EXISTS "Avatars public read" ON storage.objects;
DROP POLICY IF EXISTS "Avatar files are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Banners public read" ON storage.objects;
DROP POLICY IF EXISTS "Skins are publicly readable" ON storage.objects;