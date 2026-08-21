-- =============================================================================
-- WP-02 -- Core schema, RLS, indexes
-- Rescue Pawtrol (DevOS projects/rescue-pawtrol)
--
-- Source of truth for this migration:
--   architecture.md, requirements.md FR-08/11/18-20, NFR-01/03/05
--   Animal status lifecycle (RQ-01): draft -> published -> pending|adopted|removed
--   Roles (Q3): platform_admin, platform_moderator, org_user
--   Starting quotas (FR-11): 50 active animals, 8 images/animal, 8 MB, 2 GB,
--                            20 animal CUD/day, 40 image uploads/day
--
-- Conventions:
--   - UUID primary keys (gen_random_uuid())
--   - timestamptz for all timestamps
--   - soft-delete via deleted_at (NULL = live)
--   - org_id on every tenant-owned row for RLS
--   - comments explain purpose for future AI / human readers
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- Platform + organization roles (single org_user role -- no owner/editor split)
CREATE TYPE public.app_role AS ENUM (
  'platform_admin',
  'platform_moderator',
  'org_user'
);

-- Organization lifecycle (admin-controlled)
CREATE TYPE public.org_status AS ENUM (
  'pending_verification',  -- created but offline verification not yet complete
  'active',                -- can use the platform
  'suspended',             -- temporarily blocked
  'archived'               -- soft-retired
);

-- Animal status lifecycle (RQ-01)
-- draft -> published -> (pending | adopted | removed)
CREATE TYPE public.animal_status AS ENUM (
  'draft',      -- org is still editing; not public
  'published',  -- visible on public discovery
  'pending',    -- adoption in progress (still listed or soft-hidden -- app decides)
  'adopted',    -- successfully placed
  'removed'     -- soft-delete terminal state (excluded from public queries)
);

-- Lead status for "Join as Rescue" form
CREATE TYPE public.lead_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'rejected',
  'converted'   -- became an org (manual link)
);

-- Order / payment / fulfilment statuses (shop)
CREATE TYPE public.order_status AS ENUM (
  'pending_payment',
  'paid',
  'fulfilment_submitted',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

-- Analytics event types (day-one set from architecture / Q10)
CREATE TYPE public.analytics_event_type AS ENUM (
  'interest_cta',
  'animal_view',
  'org_view',
  'search_filter',
  'product_view',
  'add_to_cart',
  'checkout_started',
  'order_completed'
);

-- ---------------------------------------------------------------------------
-- Helper: current user's role and org_id from JWT app_metadata
-- ---------------------------------------------------------------------------
-- Supabase Auth stores custom claims in auth.jwt() -> app_metadata.
-- We set these when provisioning users (WP-03 / WP-07).
-- These helpers keep RLS policies readable and consistent.
-- IMPORTANT: use ASCII operators -> and ->> (not Unicode arrows).

CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() -> 'app_metadata' ->> 'role', '')::public.app_role;
$$;

CREATE OR REPLACE FUNCTION public.jwt_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() -> 'app_metadata' ->> 'org_id', '')::uuid;
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_role() IN ('platform_admin', 'platform_moderator');
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(check_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.jwt_org_id() IS NOT NULL
     AND public.jwt_org_id() = check_org_id
     AND public.jwt_role() = 'org_user';
$$;

-- ---------------------------------------------------------------------------
-- organizations (tenants)
-- ---------------------------------------------------------------------------
CREATE TABLE public.organizations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  slug            text NOT NULL UNIQUE,          -- URL-friendly public identifier
  status          public.org_status NOT NULL DEFAULT 'pending_verification',

  -- Public profile
  description     text,
  logo_url        text,
  website_url     text,
  public_email    text,                          -- shown on public pages
  public_phone    text,
  cta_text        text,                          -- customizable primary CTA copy

  -- Location (ISO 3166-1 alpha-2 + subdivision + free-text area)
  country_code    char(2),                       -- e.g. 'ES', 'PH', 'VE'
  subdivision     text,                          -- state / province / region
  city            text,

  -- Private (admin-only) verification notes / document references
  verification_notes text,
  verification_docs  jsonb DEFAULT '[]'::jsonb,  -- [{key, filename, uploaded_at}]

  -- Soft-delete / retention (NFR-05)
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.organizations IS
  'Rescue organizations (tenants). Provisioned only by platform admins after offline verification.';

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role            public.app_role NOT NULL,
  org_id          uuid REFERENCES public.organizations (id) ON DELETE SET NULL,
  display_name    text,
  email           text,                          -- denormalised for admin lists
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- org_user must belong to an org; platform roles must not
  CONSTRAINT profiles_org_user_requires_org
    CHECK (
      (role = 'org_user' AND org_id IS NOT NULL)
      OR
      (role IN ('platform_admin', 'platform_moderator') AND org_id IS NULL)
    )
);

COMMENT ON TABLE public.profiles IS
  'Application profile linked to auth.users. Carries role + optional org membership.';

-- ---------------------------------------------------------------------------
-- animals
-- ---------------------------------------------------------------------------
CREATE TABLE public.animals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,

  -- Core identity
  name            text NOT NULL,
  slug            text,                          -- optional public slug
  status          public.animal_status NOT NULL DEFAULT 'draft',

  -- Taxonomy (FR-02, FR-18)
  species         text NOT NULL,                 -- dog, cat, other
  breed           text,
  age_group       text,                          -- puppy/kitten, young, adult, senior
  sex             text,                          -- male, female, unknown
  size            text,                          -- small, medium, large, xlarge
  compatibility   jsonb DEFAULT '{}'::jsonb,     -- {kids: bool, dogs: bool, cats: bool}
  special_needs   text,

  -- Location (ISO + free text)
  country_code    char(2),
  subdivision     text,
  city            text,
  lat             double precision,
  lng             double precision,

  -- Narrative
  summary         text,                          -- short card text
  description     text,                          -- full detail

  -- Soft-delete / retention (FR-19, NFR-05)
  deleted_at      timestamptz,                   -- set when status -> removed or explicit soft-delete
  archived_at     timestamptz,                   -- later retention job

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  published_at    timestamptz                    -- first time moved to published
);

COMMENT ON TABLE public.animals IS
  'Animal listings owned by an organization. Public only when status = published and deleted_at IS NULL.';

-- ---------------------------------------------------------------------------
-- animal_media (metadata only; binaries live in Supabase Storage)
-- ---------------------------------------------------------------------------
CREATE TABLE public.animal_media (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id       uuid NOT NULL REFERENCES public.animals (id) ON DELETE CASCADE,
  org_id          uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,

  storage_path    text NOT NULL,                 -- bucket-relative path
  content_type    text NOT NULL,
  size_bytes      bigint NOT NULL CHECK (size_bytes > 0),
  width           int,
  height          int,
  sort_order      int NOT NULL DEFAULT 0,
  alt_text        text,

  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.animal_media IS
  'Metadata for images stored in Supabase Storage. Quota enforcement uses size_bytes + counts.';

-- ---------------------------------------------------------------------------
-- interest_events (CTA clicks -- FR-05, FR-17)
-- ---------------------------------------------------------------------------
CREATE TABLE public.interest_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id       uuid REFERENCES public.animals (id) ON DELETE SET NULL,
  org_id          uuid REFERENCES public.organizations (id) ON DELETE SET NULL,
  -- No PII required (architecture day-one metrics)
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.interest_events IS
  'Lightweight interest / CTA activation events. No PII.';

-- ---------------------------------------------------------------------------
-- analytics_events (broader day-one set)
-- ---------------------------------------------------------------------------
CREATE TABLE public.analytics_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      public.analytics_event_type NOT NULL,
  animal_id       uuid REFERENCES public.animals (id) ON DELETE SET NULL,
  org_id          uuid REFERENCES public.organizations (id) ON DELETE SET NULL,
  product_id      uuid,                          -- FK added after products table
  metadata        jsonb DEFAULT '{}'::jsonb,     -- free-form context (search terms, etc.)
  created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.analytics_events IS
  'Day-one product metrics (views, search, shop funnel). No PII required.';

-- ---------------------------------------------------------------------------
-- leads ("Join as Rescue" / Contact us -- FR-16)
-- ---------------------------------------------------------------------------
CREATE TABLE public.leads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text,
  email           text NOT NULL,
  phone           text,
  organization_name text,
  country_code    char(2),
  message         text,
  status          public.lead_status NOT NULL DEFAULT 'new',
  admin_notes     text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.leads IS
  'Public lead form submissions. Visible only to platform admins. No auto account creation.';

-- ---------------------------------------------------------------------------
-- organization_quotas (current usage + limits)
-- ---------------------------------------------------------------------------
CREATE TABLE public.organization_quotas (
  org_id                uuid PRIMARY KEY REFERENCES public.organizations (id) ON DELETE CASCADE,

  -- Limits (defaults match FR-11; admin can raise)
  max_active_animals    int NOT NULL DEFAULT 50,
  max_images_per_animal int NOT NULL DEFAULT 8,
  max_image_bytes       bigint NOT NULL DEFAULT 8388608,   -- 8 MB
  max_storage_bytes     bigint NOT NULL DEFAULT 2147483648, -- 2 GB
  max_animal_cud_per_day int NOT NULL DEFAULT 20,
  max_image_uploads_per_day int NOT NULL DEFAULT 40,

  -- Current usage (updated atomically on writes -- WP-13)
  active_animals_count  int NOT NULL DEFAULT 0,
  storage_bytes_used    bigint NOT NULL DEFAULT 0,
  animal_cud_today      int NOT NULL DEFAULT 0,
  image_uploads_today   int NOT NULL DEFAULT 0,
  usage_reset_date      date NOT NULL DEFAULT (CURRENT_DATE),

  updated_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.organization_quotas IS
  'Per-org quota limits and running counters. Counters updated in same transaction as business writes.';

-- ---------------------------------------------------------------------------
-- products (shop catalogue -- FR-12)
-- ---------------------------------------------------------------------------
CREATE TABLE public.products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,
  name            text NOT NULL,
  description     text,
  -- Multi-provider ready: base price in cents; provider-specific SKUs in metadata
  price_cents     int NOT NULL CHECK (price_cents >= 0),
  currency        char(3) NOT NULL DEFAULT 'EUR',
  image_url       text,
  is_active       boolean NOT NULL DEFAULT true,
  metadata        jsonb DEFAULT '{}'::jsonb,     -- provider SKUs, variants, etc.
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.products IS
  'Merchandise catalogue. Navigationally and visually separated from animal discovery.';

-- Add deferred FK on analytics_events.product_id
ALTER TABLE public.analytics_events
  ADD CONSTRAINT analytics_events_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products (id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- orders + order_items (guest checkout -- FR-13, FR-14)
-- ---------------------------------------------------------------------------
CREATE TABLE public.orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status            public.order_status NOT NULL DEFAULT 'pending_payment',

  -- Guest customer (no platform account)
  customer_email    text NOT NULL,
  customer_name     text,
  shipping_address  jsonb,                       -- structured address blob

  -- Money
  currency          char(3) NOT NULL DEFAULT 'EUR',
  subtotal_cents    int NOT NULL DEFAULT 0,
  shipping_cents    int NOT NULL DEFAULT 0,
  total_cents       int NOT NULL DEFAULT 0,

  -- External references
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  pod_provider      text,                        -- e.g. 'gelato', 'printify', 'printful'
  pod_order_id      text,
  pod_status        text,

  metadata          jsonb DEFAULT '{}'::jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  product_id      uuid REFERENCES public.products (id) ON DELETE SET NULL,
  product_name    text NOT NULL,                 -- snapshot at purchase time
  quantity        int NOT NULL CHECK (quantity > 0),
  unit_price_cents int NOT NULL,
  metadata        jsonb DEFAULT '{}'::jsonb      -- size, color, provider SKU
);

COMMENT ON TABLE public.orders IS
  'Guest shop orders. System of record for payment + fulfilment status.';

-- ---------------------------------------------------------------------------
-- Indexes (public filters + tenant isolation)
-- ---------------------------------------------------------------------------

-- Organizations
CREATE INDEX idx_organizations_status ON public.organizations (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_country ON public.organizations (country_code) WHERE deleted_at IS NULL;

-- Animals -- public discovery path
CREATE INDEX idx_animals_public_listing
  ON public.animals (status, country_code, species, created_at DESC)
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE INDEX idx_animals_org ON public.animals (org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_animals_status ON public.animals (status);
CREATE INDEX idx_animals_species ON public.animals (species) WHERE deleted_at IS NULL;
CREATE INDEX idx_animals_breed ON public.animals (breed) WHERE deleted_at IS NULL;

-- Media
CREATE INDEX idx_animal_media_animal ON public.animal_media (animal_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_animal_media_org ON public.animal_media (org_id);

-- Events
CREATE INDEX idx_interest_events_created ON public.interest_events (created_at DESC);
CREATE INDEX idx_interest_events_animal ON public.interest_events (animal_id);
CREATE INDEX idx_analytics_events_type_created ON public.analytics_events (event_type, created_at DESC);

-- Leads (admin)
CREATE INDEX idx_leads_status ON public.leads (status, created_at DESC);

-- Shop
CREATE INDEX idx_products_active ON public.products (is_active) WHERE is_active = true;
CREATE INDEX idx_orders_status ON public.orders (status, created_at DESC);
CREATE INDEX idx_orders_email ON public.orders (customer_email);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER organizations_set_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER animals_set_updated_at
  BEFORE UPDATE ON public.animals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER leads_set_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER organization_quotas_set_updated_at
  BEFORE UPDATE ON public.organization_quotas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create quota row when an organization is inserted
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_org_quotas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organization_quotas (org_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER organizations_create_quotas
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.create_org_quotas();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- Principles:
--   1. Public can read published animals + active org public profiles.
--   2. Org users can read/write only their own org data.
--   3. Platform admins/moderators can read/write everything needed for ops.
--   4. Interest + analytics events: anyone can insert (no PII); only admins read.
--   5. Leads: anyone can insert; only admins read/update.
--   6. Service-role bypasses RLS (used by trusted server paths only).
-- =============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animal_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ---------- organizations ----------
CREATE POLICY "Public can read active organizations"
  ON public.organizations FOR SELECT
  USING (status = 'active' AND deleted_at IS NULL);

CREATE POLICY "Org members can read own organization"
  ON public.organizations FOR SELECT
  USING (public.is_org_member(id));

CREATE POLICY "Org members can update own organization"
  ON public.organizations FOR UPDATE
  USING (public.is_org_member(id))
  WITH CHECK (public.is_org_member(id));

CREATE POLICY "Platform staff full access to organizations"
  ON public.organizations FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ---------- profiles ----------
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Platform staff can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_platform_admin());

CREATE POLICY "Platform staff can manage profiles"
  ON public.profiles FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ---------- animals ----------
CREATE POLICY "Public can read published animals"
  ON public.animals FOR SELECT
  USING (status = 'published' AND deleted_at IS NULL);

CREATE POLICY "Org members can manage own animals"
  ON public.animals FOR ALL
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "Platform staff full access to animals"
  ON public.animals FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ---------- animal_media ----------
CREATE POLICY "Public can read media of published animals"
  ON public.animal_media FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.animals a
      WHERE a.id = animal_id
        AND a.status = 'published'
        AND a.deleted_at IS NULL
    )
  );

CREATE POLICY "Org members can manage own media"
  ON public.animal_media FOR ALL
  USING (public.is_org_member(org_id))
  WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "Platform staff full access to media"
  ON public.animal_media FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ---------- interest_events ----------
CREATE POLICY "Anyone can insert interest events"
  ON public.interest_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Platform staff can read interest events"
  ON public.interest_events FOR SELECT
  USING (public.is_platform_admin());

-- Org can see interest events for their own animals (useful later)
CREATE POLICY "Org members can read own interest events"
  ON public.interest_events FOR SELECT
  USING (public.is_org_member(org_id));

-- ---------- analytics_events ----------
CREATE POLICY "Anyone can insert analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Platform staff can read analytics events"
  ON public.analytics_events FOR SELECT
  USING (public.is_platform_admin());

-- ---------- leads ----------
CREATE POLICY "Anyone can submit a lead"
  ON public.leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Platform staff can manage leads"
  ON public.leads FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ---------- organization_quotas ----------
CREATE POLICY "Org members can read own quotas"
  ON public.organization_quotas FOR SELECT
  USING (public.is_org_member(org_id));

CREATE POLICY "Platform staff full access to quotas"
  ON public.organization_quotas FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Note: counter updates are performed by SECURITY DEFINER functions or
-- service-role server paths (WP-13), not by direct client writes.

-- ---------- products (public catalogue) ----------
CREATE POLICY "Public can read active products"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Platform staff manage products"
  ON public.products FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- ---------- orders / order_items ----------
-- Guest checkout: inserts happen via service-role (server) after Stripe success.
-- Public cannot read arbitrary orders; lookup by email + order id can be added later.
CREATE POLICY "Platform staff manage orders"
  ON public.orders FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform staff manage order items"
  ON public.order_items FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- =============================================================================
-- End of WP-02 schema migration
-- =============================================================================
