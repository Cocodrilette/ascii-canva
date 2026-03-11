-- Create API Keys table
create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  name text not null,
  key text not null unique,
  status text not null default 'active', -- 'active' or 'revoked'
  created_at timestamp with time zone default now(),
  revoked_at timestamp with time zone
);

-- Enable RLS
alter table api_keys enable row level security;

-- RLS Policies
create policy "Users can view their own API keys" on api_keys
  for select using (auth.uid() = user_id);

create policy "Users can create their own API keys" on api_keys
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own API keys" on api_keys
  for update using (auth.uid() = user_id);
