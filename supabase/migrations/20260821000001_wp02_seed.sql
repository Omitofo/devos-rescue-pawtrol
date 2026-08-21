-- =============================================================================
-- WP-02 — Seed data (development / demo)
-- Safe to re-run only on empty tables; uses fixed UUIDs for referential clarity.
-- Does NOT create auth.users — that happens in WP-03 / WP-07 when auth is wired.
-- =============================================================================

-- Fixed UUIDs for predictable local testing
-- org-1: Hope Paws Spain
-- org-2: Manila Street Dogs

INSERT INTO public.organizations (
  id, name, slug, status,
  description, public_email, public_phone, cta_text,
  country_code, subdivision, city
) VALUES
(
  'a0000000-0000-4000-8000-000000000001',
  'Hope Paws Spain',
  'hope-paws-spain',
  'active',
  'Small foster-based rescue focused on dogs and cats in the Valencia region.',
  'hello@hopepaws.example',
  '+34 600 000 001',
  'Want to meet this friend? Message us on WhatsApp or email — we reply within 24 h.',
  'ES',
  'Valencia',
  'Valencia'
),
(
  'a0000000-0000-4000-8000-000000000002',
  'Manila Street Dogs',
  'manila-street-dogs',
  'active',
  'Community-powered rescue helping street dogs in Metro Manila find safe homes.',
  'adopt@manilastreetdogs.example',
  '+63 900 000 0002',
  'Interested in adopting? Contact us and we will guide you through the process.',
  'PH',
  'Metro Manila',
  'Manila'
)
ON CONFLICT (id) DO NOTHING;

-- Quota rows are created automatically by the trigger.
-- Optionally raise limits for demo org-1:
UPDATE public.organization_quotas
SET max_active_animals = 100
WHERE org_id = 'a0000000-0000-4000-8000-000000000001';

-- Animals for org-1
INSERT INTO public.animals (
  id, org_id, name, slug, status,
  species, breed, age_group, sex, size,
  compatibility, special_needs,
  country_code, subdivision, city,
  summary, description, published_at
) VALUES
(
  'b0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'Luna',
  'luna-hope-paws',
  'published',
  'dog', 'Mixed', 'young', 'female', 'medium',
  '{"kids": true, "dogs": true, "cats": false}'::jsonb,
  NULL,
  'ES', 'Valencia', 'Valencia',
  'Gentle, playful young dog looking for an active family.',
  'Luna was rescued from the streets of Valencia. She is vaccinated, sterilised, and ready for her forever home. She loves walks and quiet evenings on the sofa.',
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
  'Needs a calm indoor home',
  'ES', 'Valencia', 'Valencia',
  'Calm adult cat who enjoys sunny windowsills.',
  'Mochi is a soft-hearted indoor cat. He is fully vetted and looking for a peaceful home where he can watch the world go by.',
  now()
),
(
  'b0000000-0000-4000-8000-000000000003',
  'a0000000-0000-4000-8000-000000000001',
  'Bruno',
  'bruno-draft',
  'draft',
  'dog', 'Labrador Mix', 'adult', 'male', 'large',
  '{"kids": true, "dogs": true, "cats": true}'::jsonb,
  NULL,
  'ES', 'Valencia', 'Valencia',
  'Still being prepared for listing.',
  'Draft animal — not visible on the public site.',
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Animals for org-2
INSERT INTO public.animals (
  id, org_id, name, slug, status,
  species, breed, age_group, sex, size,
  compatibility,
  country_code, subdivision, city,
  summary, description, published_at
) VALUES
(
  'b0000000-0000-4000-8000-000000000011',
  'a0000000-0000-4000-8000-000000000002',
  'Kira',
  'kira-manila',
  'published',
  'dog', 'Aspin', 'young', 'female', 'medium',
  '{"kids": true, "dogs": true, "cats": true}'::jsonb,
  'PH', 'Metro Manila', 'Manila',
  'Bright and energetic Aspin ready for adventure.',
  'Kira was rescued from a busy market street. She is friendly with people and other dogs, and would thrive with an active family.',
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Update quota counters to match seed
UPDATE public.organization_quotas
SET active_animals_count = 2   -- Luna + Mochi (published); Bruno is draft
WHERE org_id = 'a0000000-0000-4000-8000-000000000001';

UPDATE public.organization_quotas
SET active_animals_count = 1
WHERE org_id = 'a0000000-0000-4000-8000-000000000002';

-- Sample products (shop)
INSERT INTO public.products (id, slug, name, description, price_cents, currency, is_active) VALUES
(
  'c0000000-0000-4000-8000-000000000001',
  'rescue-pawtrol-tote',
  'Rescue Pawtrol Tote Bag',
  'Sturdy cotton tote. Every purchase helps fund meals and vet care.',
  2200,
  'EUR',
  true
),
(
  'c0000000-0000-4000-8000-000000000002',
  'rescue-pawtrol-tee',
  'Rescue Pawtrol T-Shirt',
  'Soft unisex tee with the Rescue Pawtrol mark.',
  2800,
  'EUR',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Sample lead
INSERT INTO public.leads (id, name, email, organization_name, country_code, message, status) VALUES
(
  'd0000000-0000-4000-8000-000000000001',
  'Ana Reyes',
  'ana@example.org',
  'Cebu Paw Helpers',
  'PH',
  'We run a small foster network in Cebu and would love to list our dogs on Rescue Pawtrol.',
  'new'
)
ON CONFLICT (id) DO NOTHING;
