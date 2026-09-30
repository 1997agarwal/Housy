-- =====================================================
-- HOUSY — Multi-city support
-- Run in Supabase SQL Editor AFTER schema.sql. Idempotent.
-- =====================================================

create table if not exists public.cities (
  id          text primary key,                       -- slug, e.g. 'bareilly'
  name        text not null,
  state       text not null,
  cost_mult   numeric(4,2) not null default 1.00,     -- vs Bareilly baseline
  status      text not null default 'soon' check (status in ('live','soon')),
  created_at  timestamptz not null default now()
);

alter table public.cities enable row level security;
drop policy if exists "Cities are public" on public.cities;
create policy "Cities are public" on public.cities for select using (true);

insert into public.cities (id, name, state, cost_mult, status) values
  ('bareilly','Bareilly','Uttar Pradesh',1.00,'live'),
  ('lucknow','Lucknow','Uttar Pradesh',1.12,'live'),
  ('agra','Agra','Uttar Pradesh',1.05,'soon'),
  ('kanpur','Kanpur','Uttar Pradesh',1.05,'soon'),
  ('meerut','Meerut','Uttar Pradesh',1.10,'soon'),
  ('varanasi','Varanasi','Uttar Pradesh',1.02,'soon'),
  ('dehradun','Dehradun','Uttarakhand',1.08,'soon'),
  ('delhi-ncr','Delhi NCR','Delhi',1.40,'soon'),
  ('chandigarh','Chandigarh','Chandigarh',1.25,'soon'),
  ('jaipur','Jaipur','Rajasthan',1.15,'soon'),
  ('indore','Indore','Madhya Pradesh',1.10,'soon'),
  ('bhopal','Bhopal','Madhya Pradesh',1.05,'soon'),
  ('patna','Patna','Bihar',1.00,'soon'),
  ('ahmedabad','Ahmedabad','Gujarat',1.20,'soon'),
  ('mumbai','Mumbai','Maharashtra',1.60,'soon'),
  ('pune','Pune','Maharashtra',1.30,'soon'),
  ('bengaluru','Bengaluru','Karnataka',1.40,'soon'),
  ('hyderabad','Hyderabad','Telangana',1.30,'soon'),
  ('chennai','Chennai','Tamil Nadu',1.30,'soon'),
  ('kolkata','Kolkata','West Bengal',1.20,'soon')
on conflict (id) do update set name = excluded.name, state = excluded.state, cost_mult = excluded.cost_mult;

-- Crews, properties and projects belong to a city. Nullable so existing rows keep working.
alter table public.poc_profiles add column if not exists city_id text references public.cities(id);
alter table public.properties   add column if not exists city_id text references public.cities(id);
alter table public.projects     add column if not exists city_id text references public.cities(id);
alter table public.poc_profiles add column if not exists trade text;
alter table public.poc_profiles add column if not exists locality text;

-- Backfill from the free-text city already stored (case-insensitive match on name).
update public.properties p set city_id = c.id from public.cities c where p.city_id is null and lower(p.city) = lower(c.name);
update public.poc_profiles pp set city_id = c.id from public.cities c, public.users u
  where pp.city_id is null and u.id = pp.user_id and lower(u.city) = lower(c.name);

create index if not exists poc_profiles_city_idx on public.poc_profiles (city_id, trade);
create index if not exists projects_city_idx on public.projects (city_id);

-- People who want Housy in a city that isn't live yet. Written by the API (service role); never public.
create table if not exists public.city_waitlist (
  id          uuid primary key default uuid_generate_v4(),
  city_id     text not null references public.cities(id),
  name        text not null,
  phone       text not null,
  project_type text,
  created_at  timestamptz not null default now(),
  unique (city_id, phone)
);
alter table public.city_waitlist enable row level security;   -- no policies: service role only
