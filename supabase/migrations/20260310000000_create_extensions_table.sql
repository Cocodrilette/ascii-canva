-- 1. Create the extensions table
create table if not exists extensions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  author_id uuid references auth.users(id),
  type text not null unique,
  icon text, -- Lucide icon name
  code text not null, -- JS code that exports the extension object
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Create the user_extensions join table
create table if not exists user_extensions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  extension_id uuid references extensions(id) not null,
  installed_at timestamp with time zone default now(),
  unique(user_id, extension_id)
);

-- 3. Enable RLS
alter table extensions enable row level security;
alter table user_extensions enable row level security;

-- 4. Set RLS Policies
create policy "Anyone can view extensions" on extensions
  for select using (true);

create policy "Users can create extensions" on extensions
  for insert with check (auth.uid() = author_id);

create policy "Users can update their own extensions" on extensions
  for update using (auth.uid() = author_id);

create policy "Users can view their own installations" on user_extensions
  for select using (auth.uid() = user_id);

create policy "Users can install extensions" on user_extensions
  for insert with check (auth.uid() = user_id);

create policy "Users can uninstall extensions" on user_extensions
  for delete using (auth.uid() = user_id);

-- 5. Enable Realtime
alter publication supabase_realtime add table extensions;
alter publication supabase_realtime add table user_extensions;
