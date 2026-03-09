-- 1. Create the signaling table
create table if not exists signaling (
  id bigint primary key generated always as identity,
  channel_id text not null,
  sender_id text not null,
  type text not null,
  payload jsonb not null,
  created_at timestamp with time zone default now()
);

-- 2. Enable Realtime for this table
-- Use the default 'supabase_realtime' publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'signaling'
  ) then
    alter publication supabase_realtime add table signaling;
  end if;
end $$;

-- 3. Set RLS (For development, allow all for now)
alter table signaling enable row level security;

create policy "Allow all signaling" on signaling
  for all using (true) with check (true);
