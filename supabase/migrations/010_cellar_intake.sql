-- ────────────────────────────────────────────────────────────────────────────
-- 010_cellar_intake.sql
-- bocage_cellar_intake — Private Cellar Curation questionnaire submissions.
--
-- Guests fill the questionnaire on an unlisted marketing-site page
-- (bocagechampagnebar.com/CellarCuration) that the owners share as a private
-- link. Admins review and edit submissions in the Society AdminCRM
-- (CRM → Cellar tab). Answer columns store the human-readable option labels
-- exactly as they appear on the printed intake form, so the CRM can display
-- them without a mapping table.
--
-- Mirrored into bocage/scripts/init-bocage-society-tables.sql (canonical).
-- ────────────────────────────────────────────────────────────────────────────
create table if not exists public.bocage_cellar_intake (
  id                      uuid primary key default uuid_generate_v4(),

  -- Cover page
  guest_name              text not null,
  email                   text,
  phone                   text,
  intake_date             date default current_date,
  referred_by             text,

  -- Part One — About You
  bottle_frequency        text,
  perfect_evening         text,
  entertaining_frequency  text,
  wine_experience         text,
  loved_wines             text,
  avoid_wines             text,

  -- Part Two — Your Palate (scales run 1–5 between the two printed endpoints)
  reach_for_most          text,
  style_scale             int check (style_scale between 1 and 5),
  earthy_scale            int check (earthy_scale between 1 and 5),
  oak_scale               int check (oak_scale between 1 and 5),
  tannin_scale            int check (tannin_scale between 1 and 5),
  champagne_occasion      text,
  champagne_style_scale   int check (champagne_style_scale between 1 and 5),
  champagne_style         text,
  still_regions           text[] not null default '{}',

  -- Part Three — Your Existing Cellar
  collection_description  text,
  bottle_count            text,
  collection_categories   text[] not null default '{}',
  proud_bottles           text,
  unsure_bottles          text,
  missing_most            text,
  collection_help         text,
  cellar_notes            text,

  -- Part Four — The Practical Side
  storage_method          text,
  bottles_on_hand         text,
  collection_priority     text,
  per_bottle_range        text,
  aging_preference        text,
  dream_bottle            text,

  -- Admin workflow
  status                  text not null default 'new'
                          check (status in ('new','contacted','scheduled','completed','archived')),
  admin_notes             text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
alter table public.bocage_cellar_intake enable row level security;

-- Guests reach the form through a privately shared link and have no account,
-- so anyone may INSERT — but only admins can ever read, update, or delete.
drop policy if exists bocage_cellar_intake_public_insert on public.bocage_cellar_intake;
create policy bocage_cellar_intake_public_insert on public.bocage_cellar_intake
  for insert to anon, authenticated
  with check (true);

drop policy if exists bocage_cellar_intake_admin_all on public.bocage_cellar_intake;
create policy bocage_cellar_intake_admin_all on public.bocage_cellar_intake
  for all using (public.bocage_is_admin()) with check (public.bocage_is_admin());
