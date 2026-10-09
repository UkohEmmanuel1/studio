-- PosterStudio initial schema. Apply with Supabase CLI or SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  width integer not null check (width between 50 and 10000),
  height integer not null check (height between 50 and 10000),
  document jsonb not null default '{"version":1,"pages":[]}'::jsonb,
  thumbnail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_user_updated_idx on public.projects(user_id, updated_at desc);
alter table public.projects enable row level security;

drop policy if exists "Users can view their own projects" on public.projects;
create policy "Users can view their own projects" on public.projects for select using (auth.uid() = user_id);
drop policy if exists "Users can create their own projects" on public.projects;
create policy "Users can create their own projects" on public.projects for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own projects" on public.projects;
create policy "Users can update their own projects" on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own projects" on public.projects;
create policy "Users can delete their own projects" on public.projects for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();

-- Private asset bucket. File paths must begin with the authenticated user's UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('design-assets', 'design-assets', false, 8388608, array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do nothing;

drop policy if exists "Users read their own design assets" on storage.objects;
create policy "Users read their own design assets" on storage.objects for select to authenticated
using (bucket_id = 'design-assets' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users upload their own design assets" on storage.objects;
create policy "Users upload their own design assets" on storage.objects for insert to authenticated
with check (bucket_id = 'design-assets' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users update their own design assets" on storage.objects;
create policy "Users update their own design assets" on storage.objects for update to authenticated
using (bucket_id = 'design-assets' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'design-assets' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users delete their own design assets" on storage.objects;
create policy "Users delete their own design assets" on storage.objects for delete to authenticated
using (bucket_id = 'design-assets' and (storage.foldername(name))[1] = auth.uid()::text);
