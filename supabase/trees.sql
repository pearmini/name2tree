-- Name2Tree community trees table (run in Supabase SQL Editor)

create table public.trees (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  browser_id text not null check (char_length(browser_id) >= 8),
  created_at timestamptz not null default now()
);

create index trees_created_at_idx on public.trees (created_at desc);

alter table public.trees enable row level security;

create policy "trees_select_public"
  on public.trees for select
  to anon, authenticated
  using (true);

create policy "trees_insert_public"
  on public.trees for insert
  to anon, authenticated
  with check (char_length(trim(name)) between 1 and 80);

create policy "trees_delete_own"
  on public.trees for delete
  to anon, authenticated
  using (
    browser_id = coalesce(
      (current_setting('request.headers', true)::json ->> 'x-browser-id'),
      ''
    )
  );

grant select, insert, delete on public.trees to anon, authenticated;
