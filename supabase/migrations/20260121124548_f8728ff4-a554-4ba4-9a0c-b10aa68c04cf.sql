-- ============================================
-- MUSIC LIBRARY SCHEMA
-- ============================================

-- 1. Folders table (hierarchical structure)
CREATE TABLE public.folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  description TEXT,
  cover_image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(slug, parent_id)
);

-- 2. Tracks table
CREATE TABLE public.tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  duration_seconds INTEGER,
  duration_formatted TEXT,
  bpm INTEGER,
  genre TEXT,
  year INTEGER,
  file_size_bytes BIGINT,
  file_format TEXT DEFAULT 'mp3',
  is_visible BOOLEAN DEFAULT true,
  play_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for folders (public read, admin write)
CREATE POLICY "Anyone can view visible folders" 
ON public.folders 
FOR SELECT 
USING (is_visible = true);

CREATE POLICY "Authenticated users can manage folders" 
ON public.folders 
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 5. RLS Policies for tracks (public read, admin write)
CREATE POLICY "Anyone can view visible tracks" 
ON public.tracks 
FOR SELECT 
USING (is_visible = true);

CREATE POLICY "Authenticated users can manage tracks" 
ON public.tracks 
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Indexes for performance
CREATE INDEX idx_folders_parent_id ON public.folders(parent_id);
CREATE INDEX idx_folders_slug ON public.folders(slug);
CREATE INDEX idx_tracks_folder_id ON public.tracks(folder_id);
CREATE INDEX idx_tracks_artist ON public.tracks(artist);
CREATE INDEX idx_tracks_genre ON public.tracks(genre);
CREATE INDEX idx_tracks_title ON public.tracks(title);

-- 7. Function to get folder path (breadcrumb)
CREATE OR REPLACE FUNCTION public.get_folder_path(folder_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  depth INTEGER
) 
LANGUAGE SQL
STABLE
AS $$
  WITH RECURSIVE folder_path AS (
    SELECT f.id, f.name, f.slug, f.parent_id, 0 as depth
    FROM public.folders f
    WHERE f.id = folder_id
    
    UNION ALL
    
    SELECT f.id, f.name, f.slug, f.parent_id, fp.depth + 1
    FROM public.folders f
    INNER JOIN folder_path fp ON f.id = fp.parent_id
  )
  SELECT folder_path.id, folder_path.name, folder_path.slug, folder_path.depth
  FROM folder_path
  ORDER BY depth DESC;
$$;

-- 8. Function to count tracks in folder (including subfolders)
CREATE OR REPLACE FUNCTION public.count_folder_tracks(folder_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  WITH RECURSIVE folder_tree AS (
    SELECT id FROM public.folders WHERE id = folder_id
    UNION ALL
    SELECT f.id FROM public.folders f
    INNER JOIN folder_tree ft ON f.parent_id = ft.id
  )
  SELECT COUNT(*)::INTEGER
  FROM public.tracks t
  WHERE t.folder_id IN (SELECT id FROM folder_tree);
$$;

-- 9. Trigger for updated_at
CREATE TRIGGER update_folders_updated_at
BEFORE UPDATE ON public.folders
FOR EACH ROW
EXECUTE FUNCTION public.update_leads_updated_at();

CREATE TRIGGER update_tracks_updated_at
BEFORE UPDATE ON public.tracks
FOR EACH ROW
EXECUTE FUNCTION public.update_leads_updated_at();

-- 10. Create storage bucket for music files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'music', 
  'music', 
  true,
  52428800, -- 50MB max per file
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/m4a']
);

-- 11. Storage policies
CREATE POLICY "Anyone can view music files"
ON storage.objects FOR SELECT
USING (bucket_id = 'music');

CREATE POLICY "Authenticated users can upload music"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'music' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update music"
ON storage.objects FOR UPDATE
USING (bucket_id = 'music' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete music"
ON storage.objects FOR DELETE
USING (bucket_id = 'music' AND auth.uid() IS NOT NULL);