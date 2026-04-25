-- Add RGB nickname color and likes count to profiles
ALTER TABLE profiles 
ADD COLUMN display_name_color TEXT DEFAULT '#ffffff',
ADD COLUMN likes_count INTEGER DEFAULT 0;

-- Create profile_likes table
CREATE TABLE profile_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, profile_id)
);

-- Create profile_comments table
CREATE TABLE profile_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_profile_likes_user ON profile_likes(user_id);
CREATE INDEX idx_profile_likes_profile ON profile_likes(profile_id);
CREATE INDEX idx_profile_comments_profile ON profile_comments(profile_id);
CREATE INDEX idx_profile_comments_created ON profile_comments(created_at DESC);
