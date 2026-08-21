-- =============================================================================
-- Rich demo seed — 3 realistic rescue organisations + animals with photos
--
-- IMPORTANT: Do NOT delete organizations that may be referenced by profiles.
-- ON DELETE SET NULL on profiles.org_id + CHECK (org_user requires org_id)
-- would fail. We upsert orgs and only replace animals / interest demo rows.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Organizations (upsert by fixed id)
-- ---------------------------------------------------------------------------
INSERT INTO public.organizations (
  id, name, slug, status,
  description, logo_url, website_url,
  public_email, public_phone, cta_text,
  country_code, subdivision, city
) VALUES
(
  'a0000000-0000-4000-8000-000000000001',
  'Hope Paws Valencia',
  'hope-paws-valencia',
  'active',
  'Foster-based rescue in the Valencia region. We pull dogs and cats from overcrowded municipal shelters, provide full veterinary care, and match them with adoptive families across Spain and beyond. Every animal leaves us vaccinated, sterilised, and microchipped.',
  'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=200&h=200&fit=crop',
  'https://example.org/hope-paws',
  'adopt@hopepaws-valencia.example',
  '+34 600 123 456',
  'Want to meet this friend? WhatsApp or email us — we reply within 24 hours and can arrange a video call with the foster family.',
  'ES',
  'Comunidad Valenciana',
  'Valencia'
),
(
  'a0000000-0000-4000-8000-000000000002',
  'Manila Street Dogs',
  'manila-street-dogs',
  'active',
  'Community-powered rescue helping street dogs in Metro Manila find safe homes. We run trap-neuter-return programmes, emergency medical care, and a foster network across Quezon City and Makati. Adopters receive ongoing support for the first six months.',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop',
  'https://example.org/manila-street-dogs',
  'hello@manilastreetdogs.example',
  '+63 917 555 0142',
  'Interested in adopting? Message us on Facebook or Viber — we will walk you through temperament, home checks, and the adoption agreement.',
  'PH',
  'Metro Manila',
  'Quezon City'
),
(
  'a0000000-0000-4000-8000-000000000003',
  'Caracas Animal Bridge',
  'caracas-animal-bridge',
  'active',
  'Volunteer collective rescuing dogs and cats from high-risk areas of Caracas. We prioritise medical stabilisation, socialisation, and responsible rehoming within Venezuela and with verified international partners. Transparency and post-adoption follow-up are core to how we work.',
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop',
  'https://example.org/caracas-animal-bridge',
  'contacto@caracasanimalbridge.example',
  '+58 412 555 0198',
  '¿Quieres conocer a este peludo? Escríbenos por Instagram o correo. Coordinamos visitas y te contamos toda su historia médica.',
  'VE',
  'Distrito Capital',
  'Caracas'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  logo_url = EXCLUDED.logo_url,
  website_url = EXCLUDED.website_url,
  public_email = EXCLUDED.public_email,
  public_phone = EXCLUDED.public_phone,
  cta_text = EXCLUDED.cta_text,
  country_code = EXCLUDED.country_code,
  subdivision = EXCLUDED.subdivision,
  city = EXCLUDED.city,
  updated_at = now();

-- Ensure quota rows exist (trigger may have already created them)
INSERT INTO public.organization_quotas (org_id, max_active_animals)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 80),
  ('a0000000-0000-4000-8000-000000000002', 50),
  ('a0000000-0000-4000-8000-000000000003', 50)
ON CONFLICT (org_id) DO UPDATE SET
  max_active_animals = EXCLUDED.max_active_animals;

-- ---------------------------------------------------------------------------
-- Replace demo animals only (fixed UUID range)
-- ---------------------------------------------------------------------------
DELETE FROM public.interest_events
WHERE animal_id IN (
  SELECT id FROM public.animals
  WHERE id BETWEEN 'b0000000-0000-4000-8000-000000000001'::uuid
              AND 'b0000000-0000-4000-8000-000000000099'::uuid
);

DELETE FROM public.animals
WHERE id BETWEEN 'b0000000-0000-4000-8000-000000000001'::uuid
            AND 'b0000000-0000-4000-8000-000000000099'::uuid;

-- Hope Paws Valencia
INSERT INTO public.animals (
  id, org_id, name, slug, status,
  species, breed, age_group, sex, size,
  compatibility, special_needs,
  country_code, subdivision, city,
  summary, description, cover_image_url, published_at
) VALUES
(
  'b0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'Luna',
  'luna-hope-paws',
  'published',
  'dog', 'Mixed (podenco-type)', 'young', 'female', 'medium',
  '{"kids": true, "dogs": true, "cats": false}'::jsonb,
  NULL,
  'ES', 'Comunidad Valenciana', 'Valencia',
  'Gentle, playful young dog looking for an active family who loves long walks.',
  'Luna was rescued from the streets near the Turia gardens. She is vaccinated, sterilised, and microchipped. She thrives with daily exercise and calm evenings on the sofa. Best with older children or adults; still learning polite manners around cats.',
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=800&fit=crop',
  now()
),
(
  'b0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000001',
  'Mochi',
  'mochi-hope-paws',
  'published',
  'cat', 'Domestic Shorthair', 'adult', 'male', 'small',
  '{"kids": true, "dogs": false, "cats": true}'::jsonb,
  'Prefers a calm indoor home',
  'ES', 'Comunidad Valenciana', 'Valencia',
  'Calm adult cat who lives for sunny windowsills and quiet company.',
  'Mochi came to us as a surrendered indoor cat. Fully vetted, FIV/FeLV negative, and used to apartment living. He enjoys being near people without demanding constant attention — ideal for remote workers or gentle households.',
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=800&fit=crop',
  now()
),
(
  'b0000000-0000-4000-8000-000000000003',
  'a0000000-0000-4000-8000-000000000001',
  'Bruno',
  'bruno-hope-paws',
  'published',
  'dog', 'Labrador mix', 'adult', 'male', 'large',
  '{"kids": true, "dogs": true, "cats": true}'::jsonb,
  NULL,
  'ES', 'Comunidad Valenciana', 'Torrent',
  'Big softie who thinks every stranger is a friend.',
  'Bruno is a classic Labrador mix: food-motivated, affectionate, and happiest when he has a job (even if that job is carrying a toy from room to room). He lives with another dog in foster and is polite with cats. Needs a home with a bit of space or committed walkers.',
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=800&fit=crop',
  now()
),
(
  'b0000000-0000-4000-8000-000000000004',
  'a0000000-0000-4000-8000-000000000001',
  'Nala',
  'nala-hope-paws',
  'published',
  'cat', 'Domestic Longhair', 'young', 'female', 'small',
  '{"kids": true, "dogs": false, "cats": true}'::jsonb,
  NULL,
  'ES', 'Comunidad Valenciana', 'Valencia',
  'Curious fluffball with a talent for cardboard boxes.',
  'Nala was born in foster care and has been socialised with people from week one. She is playful, vocal when she wants dinner, and already litter-trained. Would do well as an only cat or with a patient adult feline companion.',
  'https://images.unsplash.com/photo-1495360010541-f48722b57f1d?w=800&h=800&fit=crop',
  now()
);

-- Manila Street Dogs
INSERT INTO public.animals (
  id, org_id, name, slug, status,
  species, breed, age_group, sex, size,
  compatibility, special_needs,
  country_code, subdivision, city,
  summary, description, cover_image_url, published_at
) VALUES
(
  'b0000000-0000-4000-8000-000000000011',
  'a0000000-0000-4000-8000-000000000002',
  'Kira',
  'kira-manila',
  'published',
  'dog', 'Aspin', 'young', 'female', 'medium',
  '{"kids": true, "dogs": true, "cats": true}'::jsonb,
  NULL,
  'PH', 'Metro Manila', 'Quezon City',
  'Bright, energetic Aspin ready for weekend adventures.',
  'Kira was rescued from a busy market street in Cubao. She is friendly with people and other dogs, house-training is in progress, and she already knows sit and come. Ideal for an active family who can continue basic training.',
  'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800&h=800&fit=crop',
  now()
),
(
  'b0000000-0000-4000-8000-000000000012',
  'a0000000-0000-4000-8000-000000000002',
  'Bantay',
  'bantay-manila',
  'published',
  'dog', 'Aspin', 'adult', 'male', 'medium',
  '{"kids": true, "dogs": true, "cats": false}'::jsonb,
  'Needs a secure yard or consistent leash walks',
  'PH', 'Metro Manila', 'Makati',
  'Loyal watchdog personality with a soft side once he trusts you.',
  'Bantay guarded a construction site for years before the crew relocated. He is healthy, sterilised, and looking for a home where he can still feel useful — apartment living is fine if walks are non-negotiable. Best as an only dog or with a calm canine friend.',
  'https://images.unsplash.com/photo-1583511655857-d19b40a7ba14?w=800&h=800&fit=crop',
  now()
),
(
  'b0000000-0000-4000-8000-000000000013',
  'a0000000-0000-4000-8000-000000000002',
  'Mingming',
  'mingming-manila',
  'published',
  'cat', 'Domestic Shorthair', 'young', 'female', 'small',
  '{"kids": true, "dogs": false, "cats": true}'::jsonb,
  NULL,
  'PH', 'Metro Manila', 'Quezon City',
  'Pocket-sized explorer with big opinions about tuna.',
  'Mingming was part of a TNR colony and chose people over the street. She is sterilised, vaccinated, and thriving in a foster apartment. Loves window-watching and short play sessions with feather toys.',
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&h=800&fit=crop',
  now()
);

-- Caracas Animal Bridge
INSERT INTO public.animals (
  id, org_id, name, slug, status,
  species, breed, age_group, sex, size,
  compatibility, special_needs,
  country_code, subdivision, city,
  summary, description, cover_image_url, published_at
) VALUES
(
  'b0000000-0000-4000-8000-000000000021',
  'a0000000-0000-4000-8000-000000000003',
  'Canela',
  'canela-caracas',
  'published',
  'dog', 'Mixed', 'adult', 'female', 'medium',
  '{"kids": true, "dogs": true, "cats": true}'::jsonb,
  NULL,
  'VE', 'Distrito Capital', 'Caracas',
  'Sweet-natured girl who greets everyone with a full-body wag.',
  'Canela recovered from a minor street injury in our clinic and has been in foster for two months. She walks well on leash, sleeps through the night, and has lived peacefully with cats. Looking for a patient home that can keep her routine steady.',
  'https://images.unsplash.com/photo-1561037404-61cd46aa613b?w=800&h=800&fit=crop',
  now()
),
(
  'b0000000-0000-4000-8000-000000000022',
  'a0000000-0000-4000-8000-000000000003',
  'Simón',
  'simon-caracas',
  'published',
  'dog', 'Mixed', 'senior', 'male', 'small',
  '{"kids": true, "dogs": false, "cats": true}'::jsonb,
  'Senior care — joint supplements recommended',
  'VE', 'Distrito Capital', 'Caracas',
  'Grey-muzzled gentleman seeking a quiet retirement couch.',
  'Simón is approximately nine years old, up to date on vaccines, and manages stairs slowly but happily. He prefers short walks and long naps. Perfect for someone who wants companionship more than high-energy outings.',
  'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=800&h=800&fit=crop',
  now()
),
(
  'b0000000-0000-4000-8000-000000000023',
  'a0000000-0000-4000-8000-000000000003',
  'Misu',
  'misu-caracas',
  'published',
  'cat', 'Domestic Shorthair', 'adult', 'male', 'small',
  '{"kids": false, "dogs": false, "cats": false}'::jsonb,
  'Best as a single pet in a calm home',
  'VE', 'Distrito Capital', 'Caracas',
  'Independent soul who chooses when to offer affection.',
  'Misu is fully indoor, sterilised, and used to a quiet adult household. He is not a lap cat, but he will sit nearby while you work and occasionally request chin scratches on his own terms. Ideal for first-time cat people who respect boundaries.',
  'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=800&h=800&fit=crop',
  now()
);

-- Sync active animal counters for the three demo orgs
UPDATE public.organization_quotas q
SET active_animals_count = sub.cnt,
    updated_at = now()
FROM (
  SELECT org_id, count(*)::int AS cnt
  FROM public.animals
  WHERE status = 'published'
    AND deleted_at IS NULL
    AND org_id IN (
      'a0000000-0000-4000-8000-000000000001',
      'a0000000-0000-4000-8000-000000000002',
      'a0000000-0000-4000-8000-000000000003'
    )
  GROUP BY org_id
) sub
WHERE q.org_id = sub.org_id;

-- Keep your test org_user attached to Hope Paws Valencia if still null
UPDATE public.profiles
SET org_id = 'a0000000-0000-4000-8000-000000000001',
    updated_at = now()
WHERE role = 'org_user'
  AND org_id IS NULL
  AND email = 'henrique.dev.mail@gmail.com';
