-- =============================================================================
-- WP-13 — Quota & Rate Guard enforcement
--
-- Atomic counter updates via SECURITY DEFINER functions so org members can
-- increment usage without a direct UPDATE policy on organization_quotas
-- (only platform staff have FOR ALL; members have SELECT only).
--
-- FR-11 / NFR-06: starting limits enforced; clear rejection messages.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Internal: reset daily counters when the calendar day rolls over
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._quota_maybe_reset_daily(q public.organization_quotas)
RETURNS public.organization_quotas
LANGUAGE plpgsql
AS $$
BEGIN
  IF q.usage_reset_date < CURRENT_DATE THEN
    q.animal_cud_today := 0;
    q.image_uploads_today := 0;
    q.usage_reset_date := CURRENT_DATE;
  END IF;
  RETURN q;
END;
$$;

-- ---------------------------------------------------------------------------
-- Consume one animal CUD (create / update / soft-delete) against daily limit
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.quota_consume_animal_cud(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.organization_quotas;
BEGIN
  SELECT * INTO q
  FROM public.organization_quotas
  WHERE org_id = p_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'QUOTA_MISSING',
      'error', 'Organisation quota row is missing. Contact support.'
    );
  END IF;

  q := public._quota_maybe_reset_daily(q);

  IF q.animal_cud_today >= q.max_animal_cud_per_day THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'QUOTA_CUD_DAY',
      'error', format(
        'Daily animal edit limit reached (%s). Try again tomorrow or ask an admin to raise the limit.',
        q.max_animal_cud_per_day
      ),
      'used', q.animal_cud_today,
      'max', q.max_animal_cud_per_day
    );
  END IF;

  UPDATE public.organization_quotas
  SET
    animal_cud_today = q.animal_cud_today + 1,
    usage_reset_date = q.usage_reset_date,
    updated_at = now()
  WHERE org_id = p_org_id;

  RETURN jsonb_build_object(
    'ok', true,
    'used', q.animal_cud_today + 1,
    'max', q.max_animal_cud_per_day
  );
END;
$$;

COMMENT ON FUNCTION public.quota_consume_animal_cud(uuid) IS
  'WP-13: atomically consume one animal CUD against max_animal_cud_per_day.';

CREATE OR REPLACE FUNCTION public.quota_reserve_active_animal(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.organization_quotas;
BEGIN
  SELECT * INTO q
  FROM public.organization_quotas
  WHERE org_id = p_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'QUOTA_MISSING',
      'error', 'Organisation quota row is missing. Contact support.'
    );
  END IF;

  IF q.active_animals_count >= q.max_active_animals THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'QUOTA_ACTIVE_ANIMALS',
      'error', format(
        'Active animal limit reached (%s / %s). Unpublish or remove a listing, or ask an admin to raise the quota.',
        q.active_animals_count,
        q.max_active_animals
      ),
      'used', q.active_animals_count,
      'max', q.max_active_animals
    );
  END IF;

  UPDATE public.organization_quotas
  SET
    active_animals_count = q.active_animals_count + 1,
    updated_at = now()
  WHERE org_id = p_org_id;

  RETURN jsonb_build_object(
    'ok', true,
    'used', q.active_animals_count + 1,
    'max', q.max_active_animals
  );
END;
$$;

COMMENT ON FUNCTION public.quota_reserve_active_animal(uuid) IS
  'WP-13: reserve one active-animal slot (published/pending).';

CREATE OR REPLACE FUNCTION public.quota_release_active_animal(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.organization_quotas;
BEGIN
  SELECT * INTO q
  FROM public.organization_quotas
  WHERE org_id = p_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', true, 'used', 0, 'max', 0);
  END IF;

  UPDATE public.organization_quotas
  SET
    active_animals_count = GREATEST(0, q.active_animals_count - 1),
    updated_at = now()
  WHERE org_id = p_org_id;

  RETURN jsonb_build_object(
    'ok', true,
    'used', GREATEST(0, q.active_animals_count - 1),
    'max', q.max_active_animals
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.quota_consume_image_upload(
  p_org_id uuid,
  p_size_bytes bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.organization_quotas;
BEGIN
  IF p_size_bytes IS NULL OR p_size_bytes <= 0 THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'QUOTA_BAD_SIZE',
      'error', 'Invalid image size.'
    );
  END IF;

  SELECT * INTO q
  FROM public.organization_quotas
  WHERE org_id = p_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'QUOTA_MISSING',
      'error', 'Organisation quota row is missing. Contact support.'
    );
  END IF;

  q := public._quota_maybe_reset_daily(q);

  IF p_size_bytes > q.max_image_bytes THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'QUOTA_IMAGE_SIZE',
      'error', format(
        'Image exceeds the maximum size of %s MB.',
        round(q.max_image_bytes / 1024.0 / 1024.0, 1)
      ),
      'max_bytes', q.max_image_bytes
    );
  END IF;

  IF q.image_uploads_today >= q.max_image_uploads_per_day THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'QUOTA_UPLOAD_DAY',
      'error', format(
        'Daily image upload limit reached (%s). Try again tomorrow or ask an admin to raise the limit.',
        q.max_image_uploads_per_day
      ),
      'used', q.image_uploads_today,
      'max', q.max_image_uploads_per_day
    );
  END IF;

  IF q.storage_bytes_used + p_size_bytes > q.max_storage_bytes THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'QUOTA_STORAGE',
      'error', format(
        'Organisation storage limit reached (%s / %s MB). Delete unused images or ask an admin to raise the quota.',
        round(q.storage_bytes_used / 1024.0 / 1024.0, 1),
        round(q.max_storage_bytes / 1024.0 / 1024.0, 1)
      ),
      'used_bytes', q.storage_bytes_used,
      'max_bytes', q.max_storage_bytes
    );
  END IF;

  UPDATE public.organization_quotas
  SET
    image_uploads_today = q.image_uploads_today + 1,
    storage_bytes_used = q.storage_bytes_used + p_size_bytes,
    usage_reset_date = q.usage_reset_date,
    updated_at = now()
  WHERE org_id = p_org_id;

  RETURN jsonb_build_object(
    'ok', true,
    'uploads_today', q.image_uploads_today + 1,
    'max_uploads_day', q.max_image_uploads_per_day,
    'storage_used', q.storage_bytes_used + p_size_bytes,
    'max_storage', q.max_storage_bytes,
    'max_image_bytes', q.max_image_bytes,
    'max_images_per_animal', q.max_images_per_animal
  );
END;
$$;

COMMENT ON FUNCTION public.quota_consume_image_upload(uuid, bigint) IS
  'WP-13: atomically check daily upload + storage limits and consume.';

CREATE OR REPLACE FUNCTION public.quota_release_storage(
  p_org_id uuid,
  p_size_bytes bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.organization_quotas;
  release bigint;
BEGIN
  release := GREATEST(0, COALESCE(p_size_bytes, 0));

  SELECT * INTO q
  FROM public.organization_quotas
  WHERE org_id = p_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', true);
  END IF;

  UPDATE public.organization_quotas
  SET
    storage_bytes_used = GREATEST(0, q.storage_bytes_used - release),
    updated_at = now()
  WHERE org_id = p_org_id;

  RETURN jsonb_build_object(
    'ok', true,
    'storage_used', GREATEST(0, q.storage_bytes_used - release)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.quota_snapshot(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  q public.organization_quotas;
BEGIN
  IF NOT (
    public.is_org_member(p_org_id)
    OR public.is_platform_admin()
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Forbidden');
  END IF;

  SELECT * INTO q
  FROM public.organization_quotas
  WHERE org_id = p_org_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Missing quota row');
  END IF;

  q := public._quota_maybe_reset_daily(q);

  RETURN jsonb_build_object(
    'ok', true,
    'max_active_animals', q.max_active_animals,
    'active_animals_count', q.active_animals_count,
    'max_animal_cud_per_day', q.max_animal_cud_per_day,
    'animal_cud_today', q.animal_cud_today,
    'max_image_uploads_per_day', q.max_image_uploads_per_day,
    'image_uploads_today', q.image_uploads_today,
    'max_storage_bytes', q.max_storage_bytes,
    'storage_bytes_used', q.storage_bytes_used,
    'max_image_bytes', q.max_image_bytes,
    'max_images_per_animal', q.max_images_per_animal,
    'usage_reset_date', q.usage_reset_date
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.quota_consume_animal_cud(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.quota_reserve_active_animal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.quota_release_active_animal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.quota_consume_image_upload(uuid, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.quota_release_storage(uuid, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.quota_snapshot(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.quota_consume_animal_cud(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.quota_reserve_active_animal(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.quota_release_active_animal(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.quota_consume_image_upload(uuid, bigint) FROM anon;
REVOKE ALL ON FUNCTION public.quota_release_storage(uuid, bigint) FROM anon;
REVOKE ALL ON FUNCTION public.quota_snapshot(uuid) FROM anon;
