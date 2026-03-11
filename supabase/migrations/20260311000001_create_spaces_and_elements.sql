-- Create Spaces table
create table if not exists spaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text,
  owner_id uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create Elements table for granular persistence
create table if not exists elements (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces(id) on delete cascade not null,
  created_by uuid references auth.users(id), -- Tracks who/what key created it
  type text not null,
  x integer not null,
  y integer not null,
  params jsonb default '{}'::jsonb,
  z_index integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table spaces enable row level security;
alter table elements enable row level security;

-- Spaces Policies
create policy "Anyone can view public spaces" on spaces
  for select using (true);

create policy "Users can create their own spaces" on spaces
  for insert with check (auth.uid() = owner_id);

create policy "Owners can update their own spaces" on spaces
  for update using (auth.uid() = owner_id);

-- Elements Policies
create policy "Anyone can view elements in a space" on elements
  for select using (true);

create policy "Allow all for space owners" on elements
  for all using (
    exists (
      select 1 from spaces 
      where spaces.id = elements.space_id 
      and spaces.owner_id = auth.uid()
    )
  );

-- For now, allow anonymous inserts if the space exists (to maintain the "free as possible" feel)
-- We can tighten this later if needed.
create policy "Allow anonymous inserts to elements" on elements
  for insert with check (true);

-- Enable Realtime for elements
alter publication supabase_realtime add table elements;
