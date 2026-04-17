create extension if not exists pgcrypto;

drop table if exists public.assignments cascade;
drop table if exists public.applications cascade;
drop table if exists public.ratings cascade;
drop table if exists public.payment_methods cascade;
drop table if exists public.offline_workers cascade;
drop table if exists public.jobs cascade;
drop table if exists public.profiles cascade;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('worker', 'employer', 'mate')),
  name text not null,
  phone text not null unique,
  email text,
  location text,
  avatar text,
  jobs_done integer not null default 0,
  rating numeric(3,2) not null default 0,
  score integer not null default 0,
  ctype text,
  organization_name text,
  primary_skill text,
  hiring_need text,
  registration_id text,
  code text,
  device_id text,
  upi_id text,
  bank_account jsonb,
  mate_payout jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.offline_workers (
  id uuid primary key default gen_random_uuid(),
  worker_code text not null unique,
  name text not null,
  location text,
  primary_skill text,
  availability text,
  payout_method text not null default 'upi',
  upi_id text,
  bank_account jsonb,
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id text primary key,
  owner_role text not null default 'employer',
  owner_phone text,
  owner_name text,
  title text not null,
  type text not null,
  pay integer not null default 0,
  duration text not null default 'daily',
  time_label text,
  location text,
  latitude numeric,
  longitude numeric,
  description text,
  distance_km numeric(6,2) not null default 0,
  status text not null default 'open',
  applicant_names text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references public.jobs(id) on delete cascade,
  applicant_name text not null,
  applicant_phone text,
  status text not null default 'applied',
  created_at timestamptz not null default now()
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references public.jobs(id) on delete cascade,
  rater_phone text not null,
  rater_name text,
  rater_role text,
  target_phone text,
  target_name text,
  target_role text,
  stars integer not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references public.jobs(id) on delete cascade,
  worker_id text not null,
  worker_name text not null,
  status text not null default 'assigned',
  assigned_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('worker', 'employer', 'mate')),
  phone text not null,
  method_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role, phone, method_type)
);

create index if not exists jobs_owner_phone_idx on public.jobs(owner_phone);
create index if not exists jobs_status_idx on public.jobs(status);
create index if not exists applications_job_id_idx on public.applications(job_id);
create index if not exists ratings_job_id_idx on public.ratings(job_id);
create index if not exists ratings_target_phone_idx on public.ratings(target_phone);
create unique index if not exists ratings_job_rater_target_idx on public.ratings(job_id, rater_phone, target_phone);
create index if not exists assignments_job_id_idx on public.assignments(job_id);
create unique index if not exists assignments_job_worker_idx on public.assignments(job_id, worker_id);
create index if not exists payment_methods_phone_idx on public.payment_methods(phone);
create unique index if not exists offline_workers_code_idx on public.offline_workers(worker_code);

alter table public.profiles enable row level security;
alter table public.offline_workers enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.ratings enable row level security;
alter table public.assignments enable row level security;
alter table public.payment_methods enable row level security;

drop policy if exists "demo read profiles" on public.profiles;
drop policy if exists "demo write profiles" on public.profiles;
drop policy if exists "demo read jobs" on public.jobs;
drop policy if exists "demo write jobs" on public.jobs;
drop policy if exists "demo read offline_workers" on public.offline_workers;
drop policy if exists "demo write offline_workers" on public.offline_workers;
drop policy if exists "demo read applications" on public.applications;
drop policy if exists "demo write applications" on public.applications;
drop policy if exists "demo read ratings" on public.ratings;
drop policy if exists "demo write ratings" on public.ratings;
drop policy if exists "demo read assignments" on public.assignments;
drop policy if exists "demo write assignments" on public.assignments;
drop policy if exists "demo read payment_methods" on public.payment_methods;
drop policy if exists "demo write payment_methods" on public.payment_methods;

create policy "demo read profiles" on public.profiles for select using (true);
create policy "demo write profiles" on public.profiles for insert with check (true);
create policy "demo update profiles" on public.profiles for update using (true) with check (true);
create policy "demo delete profiles" on public.profiles for delete using (true);

create policy "demo read jobs" on public.jobs for select using (true);
create policy "demo write jobs" on public.jobs for insert with check (true);
create policy "demo update jobs" on public.jobs for update using (true) with check (true);
create policy "demo delete jobs" on public.jobs for delete using (true);

create policy "demo read offline_workers" on public.offline_workers for select using (true);
create policy "demo write offline_workers" on public.offline_workers for insert with check (true);
create policy "demo update offline_workers" on public.offline_workers for update using (true) with check (true);
create policy "demo delete offline_workers" on public.offline_workers for delete using (true);

create policy "demo read applications" on public.applications for select using (true);
create policy "demo write applications" on public.applications for insert with check (true);
create policy "demo update applications" on public.applications for update using (true) with check (true);
create policy "demo delete applications" on public.applications for delete using (true);

create policy "demo read ratings" on public.ratings for select using (true);
create policy "demo write ratings" on public.ratings for insert with check (true);
create policy "demo update ratings" on public.ratings for update using (true) with check (true);
create policy "demo delete ratings" on public.ratings for delete using (true);

create policy "demo read assignments" on public.assignments for select using (true);
create policy "demo write assignments" on public.assignments for insert with check (true);
create policy "demo update assignments" on public.assignments for update using (true) with check (true);
create policy "demo delete assignments" on public.assignments for delete using (true);

create policy "demo read payment_methods" on public.payment_methods for select using (true);
create policy "demo write payment_methods" on public.payment_methods for insert with check (true);
create policy "demo update payment_methods" on public.payment_methods for update using (true) with check (true);
create policy "demo delete payment_methods" on public.payment_methods for delete using (true);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_jobs_updated_at on public.jobs;
create trigger touch_jobs_updated_at
before update on public.jobs
for each row execute function public.touch_updated_at();

drop trigger if exists touch_assignments_updated_at on public.assignments;
create trigger touch_assignments_updated_at
before update on public.assignments
for each row execute function public.touch_updated_at();

drop trigger if exists touch_ratings_updated_at on public.ratings;
create trigger touch_ratings_updated_at
before update on public.ratings
for each row execute function public.touch_updated_at();

drop trigger if exists touch_payment_methods_updated_at on public.payment_methods;
create trigger touch_payment_methods_updated_at
before update on public.payment_methods
for each row execute function public.touch_updated_at();

