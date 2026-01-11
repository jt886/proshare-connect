-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  nickname text,
  avatar_url text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
-- Enable RLS for profiles
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Create community_messages table
create table if not exists public.community_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for community_messages
alter table public.community_messages enable row level security;

drop policy if exists "Anyone can read messages." on public.community_messages;
create policy "Anyone can read messages." on public.community_messages
  for select using (true);

drop policy if exists "Authenticated users can insert messages." on public.community_messages;
create policy "Authenticated users can insert messages." on public.community_messages
  for insert with check (auth.uid() = user_id);

-- Enable Realtime for community_messages
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'community_messages'
  ) then
    alter publication supabase_realtime add table community_messages;
  end if;
end;
$$;

-- Function to handle new user creation (auto-create profile)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
