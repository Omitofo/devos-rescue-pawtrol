-- =============================================================================
-- WP-04 — Animal media Storage bucket + policies
-- Binaries in Storage; metadata in public.animal_media (schema WP-02).
-- Path convention: {org_id}/{animal_id}/{uuid}.{ext}
-- =============================================================================

-- Public-read bucket for published animal images (MVP simplicity).
-- Writes still require authenticated org membership via storage policies.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'animal-media',
  'animal-media',
  true,
  8388608,  -- 8 MB (FR-11)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public can read objects in this bucket (published animals only enforced in app
-- for listing; bucket is public for simple CDN-style URLs in MVP).
CREATE POLICY "Public read animal-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'animal-media');

-- Org users can upload into their own org folder prefix
CREATE POLICY "Org members upload animal-media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'animal-media'
    AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'org_user'
  );

-- Org users can update/delete their own org objects
CREATE POLICY "Org members manage own animal-media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'animal-media'
    AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'org_user'
  );

CREATE POLICY "Org members delete own animal-media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'animal-media'
    AND (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'org_id')
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'org_user'
  );

-- Platform staff full access
CREATE POLICY "Platform staff manage animal-media"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'animal-media'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('platform_admin', 'platform_moderator')
  )
  WITH CHECK (
    bucket_id = 'animal-media'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('platform_admin', 'platform_moderator')
  );
