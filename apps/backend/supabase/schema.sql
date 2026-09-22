-- =====================================================
-- HOUSY — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- =====================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── USERS ────────────────────────────────────────────
create table if not exists public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  phone        text unique not null,
  name         text not null default '',
  email        text,
  city         text not null default '',
  role         text not null default 'homeowner'
               check (role in ('homeowner','poc','supervisor','field_agent','admin')),
  language_pref text not null default 'en' check (language_pref in ('en','hi')),
  phone_verified    boolean not null default false,
  aadhaar_verified  boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own profile"
  on public.users for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

-- ── PROPERTIES ───────────────────────────────────────
create table if not exists public.properties (
  id               uuid primary key default uuid_generate_v4(),
  owner_id         uuid not null references public.users(id) on delete cascade,
  city             text not null,
  locality         text not null,
  pincode          text not null,
  type             text not null check (type in ('house','apartment','plot')),
  age_years        integer not null check (age_years >= 0),
  sq_ft            integer not null check (sq_ft >= 100),
  bhk              integer not null check (bhk >= 1),
  bathrooms        integer not null check (bathrooms >= 0),
  renovation_scope text[] not null default '{}',
  photos           text[] not null default '{}',
  floor_plan_url   text,
  created_at       timestamptz not null default now()
);

alter table public.properties enable row level security;

create policy "Owners can CRUD own properties"
  on public.properties for all using (auth.uid() = owner_id);

-- ── POC PROFILES ─────────────────────────────────────
create table if not exists public.poc_profiles (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references public.users(id) on delete cascade,
  gang_size             integer not null default 1 check (gang_size >= 1),
  skills_available      text[] not null default '{}',
  primary_skill         text not null,
  daily_rate_min        integer not null check (daily_rate_min > 0),
  daily_rate_max        integer not null check (daily_rate_max >= daily_rate_min),
  areas_served          text[] not null default '{}',
  years_experience      integer not null default 0,
  languages             text[] not null default '{en}',
  bio                   text not null default '',
  work_photos           text[] not null default '{}',
  rating_avg            numeric(3,2) not null default 0.0,
  review_count          integer not null default 0,
  is_verified           boolean not null default false,
  housy_id_card_number  text unique,
  is_available          boolean not null default true,
  created_at            timestamptz not null default now()
);

alter table public.poc_profiles enable row level security;

create policy "POC profiles are publicly readable"
  on public.poc_profiles for select using (true);

create policy "POCs can update own profile"
  on public.poc_profiles for update using (
    auth.uid() = user_id
  );

create policy "Admins can manage all POC profiles"
  on public.poc_profiles for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- ── PROJECTS ─────────────────────────────────────────
create table if not exists public.projects (
  id                uuid primary key default uuid_generate_v4(),
  property_id       uuid not null references public.properties(id) on delete cascade,
  homeowner_id      uuid not null references public.users(id) on delete cascade,
  title             text not null,
  status            text not null default 'planning'
                    check (status in ('planning','active','paused','completed')),
  budget_estimate   integer not null default 0,
  budget_spent      integer not null default 0,
  start_date        date,
  end_date_estimate date,
  created_at        timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Homeowners can CRUD own projects"
  on public.projects for all using (auth.uid() = homeowner_id);

-- ── PROJECT TASKS ────────────────────────────────────
create table if not exists public.project_tasks (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  title           text not null,
  status          text not null default 'not_started'
                  check (status in ('not_started','in_progress','done','needs_inspection')),
  assigned_poc_id uuid references public.poc_profiles(id),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.project_tasks enable row level security;

create policy "Project members can manage tasks"
  on public.project_tasks for all using (
    exists (
      select 1 from public.projects
      where id = project_id and homeowner_id = auth.uid()
    )
  );

-- ── BOOKINGS ─────────────────────────────────────────
create table if not exists public.bookings (
  id                uuid primary key default uuid_generate_v4(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  poc_id            uuid not null references public.poc_profiles(id),
  homeowner_id      uuid not null references public.users(id),
  skills_required   text[] not null default '{}',
  start_date        date not null,
  end_date          date not null,
  daily_rate        integer not null,
  status            text not null default 'pending'
                    check (status in ('pending','accepted','declined','active','completed','cancelled')),
  work_description  text not null,
  platform_fee_pct  integer not null default 12,
  created_at        timestamptz not null default now()
);

alter table public.bookings enable row level security;

create policy "Homeowners can manage own bookings"
  on public.bookings for all using (auth.uid() = homeowner_id);

create policy "POCs can view and update their bookings"
  on public.bookings for select using (
    auth.uid() = (select user_id from public.poc_profiles where id = poc_id)
  );

-- ── REVIEWS ──────────────────────────────────────────
create table if not exists public.reviews (
  id                  uuid primary key default uuid_generate_v4(),
  booking_id          uuid not null references public.bookings(id) on delete cascade,
  reviewer_id         uuid not null references public.users(id),
  reviewee_id         uuid not null references public.users(id),
  quality_rating      integer not null check (quality_rating between 1 and 5),
  punctuality_rating  integer not null check (punctuality_rating between 1 and 5),
  behaviour_rating    integer not null check (behaviour_rating between 1 and 5),
  value_rating        integer not null check (value_rating between 1 and 5),
  overall_rating      numeric(3,2) generated always as (
    (quality_rating + punctuality_rating + behaviour_rating + value_rating)::numeric / 4
  ) stored,
  text                text,
  photos              text[] not null default '{}',
  created_at          timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "Anyone can read reviews"
  on public.reviews for select using (true);

create policy "Reviewers can insert own reviews"
  on public.reviews for insert with check (auth.uid() = reviewer_id);

-- ── EXPENSES ─────────────────────────────────────────
create table if not exists public.expenses (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  logged_by       uuid not null references public.users(id),
  category        text not null check (category in ('labor','material','equipment','professional','misc')),
  description     text not null,
  amount          integer not null check (amount > 0),
  payment_method  text not null default 'cash' check (payment_method in ('cash','upi','bank_transfer')),
  receipt_url     text,
  created_at      timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "Project homeowners manage expenses"
  on public.expenses for all using (
    exists (
      select 1 from public.projects
      where id = project_id and homeowner_id = auth.uid()
    )
  );

-- ── SITE PHOTOS ──────────────────────────────────────
create table if not exists public.site_photos (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  uploaded_by  uuid not null references public.users(id),
  url          text not null,
  room_tag     text,
  task_tag     text,
  notes        text,
  taken_at     timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

alter table public.site_photos enable row level security;

create policy "Project members manage site photos"
  on public.site_photos for all using (
    exists (
      select 1 from public.projects
      where id = project_id and homeowner_id = auth.uid()
    )
  );

-- ── CHAT MESSAGES ────────────────────────────────────
create table if not exists public.chat_messages (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  sender_id   uuid not null references public.users(id),
  receiver_id uuid not null references public.users(id),
  content     text not null,
  type        text not null default 'text' check (type in ('text','voice','image')),
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "Participants can read and send messages"
  on public.chat_messages for all using (
    auth.uid() = sender_id or auth.uid() = receiver_id
  );

-- ── INDEXES ──────────────────────────────────────────
create index if not exists idx_properties_owner on public.properties(owner_id);
create index if not exists idx_poc_city_skill on public.poc_profiles using gin(areas_served, skills_available);
create index if not exists idx_bookings_homeowner on public.bookings(homeowner_id);
create index if not exists idx_bookings_poc on public.bookings(poc_id);
create index if not exists idx_projects_homeowner on public.projects(homeowner_id);
create index if not exists idx_chat_project on public.chat_messages(project_id, created_at desc);
create index if not exists idx_expenses_project on public.expenses(project_id);
create index if not exists idx_site_photos_project on public.site_photos(project_id, taken_at desc);

-- ── TRIGGER: update poc rating on new review ────────
create or replace function update_poc_rating()
returns trigger as $$
begin
  update public.poc_profiles
  set
    rating_avg   = (
      select avg(overall_rating)
      from public.reviews r
      join public.bookings b on b.id = r.booking_id
      where b.poc_id = poc_profiles.id
    ),
    review_count = (
      select count(*)
      from public.reviews r
      join public.bookings b on b.id = r.booking_id
      where b.poc_id = poc_profiles.id
    )
  where id = (
    select poc_id from public.bookings where id = new.booking_id
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_update_poc_rating
  after insert on public.reviews
  for each row execute function update_poc_rating();

-- ── REALTIME ─────────────────────────────────────────
-- Enable realtime for chat
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.bookings;
