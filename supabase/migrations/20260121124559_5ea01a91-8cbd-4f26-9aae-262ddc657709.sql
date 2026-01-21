-- Fix function search_path warnings
CREATE OR REPLACE FUNCTION public.get_folder_path(folder_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  depth INTEGER
) 
LANGUAGE SQL
STABLE
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.count_folder_tracks(folder_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SET search_path = public
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