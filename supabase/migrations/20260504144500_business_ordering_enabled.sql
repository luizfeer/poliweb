-- ============================================================================
-- BUSINESSES: public ordering/delivery CTA toggle
-- ============================================================================

alter table public.businesses
add column if not exists ordering_enabled boolean not null default false;
