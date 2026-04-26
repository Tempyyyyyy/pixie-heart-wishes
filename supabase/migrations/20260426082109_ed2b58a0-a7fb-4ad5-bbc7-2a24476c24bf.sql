-- Add missing profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name_color text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

-- Profile likes table
CREATE TABLE IF NOT EXISTS public.profile_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_id)
);

ALTER TABLE public.profile_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
  ON public.profile_likes FOR SELECT USING (true);

CREATE POLICY "Users can like profiles"
  ON public.profile_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own like"
  ON public.profile_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Profile comments table
CREATE TABLE IF NOT EXISTS public.profile_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON public.profile_comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can comment"
  ON public.profile_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authors can update their comment"
  ON public.profile_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authors or profile owner can delete"
  ON public.profile_comments FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = profile_id);

CREATE TRIGGER update_profile_comments_updated_at
  BEFORE UPDATE ON public.profile_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Triggers to keep likes_count in sync
CREATE OR REPLACE FUNCTION public.handle_profile_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET likes_count = likes_count + 1 WHERE id = NEW.profile_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.profile_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER profile_likes_count_ins
  AFTER INSERT ON public.profile_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_like();

CREATE TRIGGER profile_likes_count_del
  AFTER DELETE ON public.profile_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_like();

CREATE INDEX IF NOT EXISTS idx_profile_comments_profile_id ON public.profile_comments(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_likes_profile_id ON public.profile_likes(profile_id);