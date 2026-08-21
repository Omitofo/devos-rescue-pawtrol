-- =============================================================================
-- Optional cover image URL on animals (demo + future CDN fallback)
-- Full binary media remains in Supabase Storage (WP-04).
-- =============================================================================

ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS cover_image_url text;

COMMENT ON COLUMN public.animals.cover_image_url IS
  'Optional public image URL for cards/detail. Prefer animal_media + Storage for production uploads.';
