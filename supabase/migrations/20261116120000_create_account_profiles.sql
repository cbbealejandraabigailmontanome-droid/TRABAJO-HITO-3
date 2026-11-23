create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text not null default 'Cliente'
    check (char_length(btrim(full_name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
on public.profiles
for select to authenticated
using (user_id = (select auth.uid()));

revoke all privileges on table public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_full_name text;
begin
  v_full_name := nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '');
  if v_full_name is null or char_length(v_full_name) > 120 then
    v_full_name := 'Cliente';
  end if;

  insert into public.profiles (user_id, email, full_name)
  values (new.id, new.email, v_full_name)
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        updated_at = now();

  return new;
end;
$$;

revoke all on function public.sync_profile_from_auth_user() from public, anon, authenticated;

create trigger on_auth_user_created_sync_profile
after insert on auth.users
for each row execute function public.sync_profile_from_auth_user();

create trigger on_auth_user_updated_sync_profile
after update of email, raw_user_meta_data on auth.users
for each row execute function public.sync_profile_from_auth_user();

insert into public.profiles (user_id, email, full_name)
select
  u.id,
  u.email,
  coalesce(nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''), 'Cliente')
from auth.users u
on conflict (user_id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      updated_at = now();
