-- ============================================================
-- StoryForge AI - Initial Database Schema
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor', 'reviewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Characters (Bimo, Kiko, dll.)
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('main', 'supporting', 'background')),
  species TEXT,
  description TEXT,
  personality TEXT,
  avatar_url TEXT,
  reference_images JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Episodes
CREATE TABLE IF NOT EXISTS public.episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  episode_number INTEGER,
  season INTEGER DEFAULT 1,
  theme TEXT,
  moral_lesson TEXT,
  target_duration INTEGER DEFAULT 60, -- detik
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'scripting', 'voice_over', 'animating', 'compositing', 'review', 'approved', 'publishing', 'published', 'failed')
  ),
  script TEXT,
  script_version INTEGER DEFAULT 1,
  thumbnail_url TEXT,
  video_url TEXT,
  published_url TEXT,
  facebook_post_id TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Episode Characters (many-to-many)
CREATE TABLE IF NOT EXISTS public.episode_characters (
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  character_id UUID REFERENCES public.characters(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'main',
  PRIMARY KEY (episode_id, character_id)
);

-- Assets (gambar, audio, video segments)
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'audio', 'video', 'music', 'sfx')),
  subtype TEXT, -- 'background', 'character', 'voice_over', 'bgm', dll.
  url TEXT NOT NULL,
  duration FLOAT, -- detik (untuk audio/video)
  size_bytes BIGINT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Production Jobs (antrian AI processing)
CREATE TABLE IF NOT EXISTS public.production_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (
    job_type IN ('script_generation', 'voice_over', 'image_generation', 'animation', 'music_generation', 'video_composition', 'publishing')
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed', 'retrying')
  ),
  priority INTEGER DEFAULT 5,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  payload JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Review Notes
CREATE TABLE IF NOT EXISTS public.review_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  timestamp_ref FLOAT, -- timestamp video (detik)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_notes ENABLE ROW LEVEL SECURITY;

-- Profiles: user hanya bisa lihat & edit profil sendiri
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Semua user yang sudah login bisa baca data utama
CREATE POLICY "Authenticated users can view characters" ON public.characters
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view episodes" ON public.episodes
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view assets" ON public.assets
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view production jobs" ON public.production_jobs
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view review notes" ON public.review_notes
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view episode characters" ON public.episode_characters
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insert/Update/Delete: hanya admin dan editor
CREATE POLICY "Editors can manage episodes" ON public.episodes
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Editors can manage characters" ON public.characters
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Editors can manage assets" ON public.assets
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Editors can manage production jobs" ON public.production_jobs
  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Reviewers can manage review notes" ON public.review_notes
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- Triggers: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_episodes_updated
  BEFORE UPDATE ON public.episodes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_production_jobs_updated
  BEFORE UPDATE ON public.production_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile saat user baru register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Seed data: Karakter Bimo & Kiko
-- ============================================================

INSERT INTO public.characters (name, type, species, description, personality) VALUES
  ('Bimo', 'main', 'Panda', 'Panda kecil yang thoughtful dan bijaksana. Senang belajar hal baru.', 'Bijaksana, sabar, penasaran, suka membaca'),
  ('Kiko', 'main', 'Fox', 'Rubah kecil yang energetic dan pemberani. Selalu semangat beraksi.', 'Energik, pemberani, spontan, humoris')
ON CONFLICT DO NOTHING;
