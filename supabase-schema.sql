-- Users (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users primary key,
  email text not null,
  name text not null,
  family_name text not null,
  stripe_customer_id text,
  subscription_status text default 'inactive', -- inactive | active | cancelled
  subscription_id text,
  created_at timestamptz default now()
);

-- Family Members
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users not null,
  name text not null,
  role text not null check (role in ('parent', 'child')),
  age integer,
  color text not null default '#6366f1',
  created_at timestamptz default now()
);

-- Events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users not null,
  family_member_id uuid references public.family_members,
  title text not null,
  description text,
  date date not null,
  time text,
  location text,
  category text check (category in ('school', 'activity', 'medical', 'social', 'other')),
  source text check (source in ('manual', 'email', 'image')) default 'manual',
  raw_email_id uuid,
  created_at timestamptz default now()
);

-- Parsed Emails
create table public.parsed_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users not null,
  from_address text,
  subject text,
  body text,
  received_at timestamptz default now(),
  processed boolean default false
);

-- Weekly Briefings
create table public.weekly_briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users not null,
  week_start date not null,
  content text not null,
  sent_at timestamptz,
  created_at timestamptz default now(),
  constraint weekly_briefings_user_week_unique unique (user_id, week_start)
);

-- Atomically upsert a week row; see supabase/migrations for upsert_weekly_briefing()

-- Thumbs up/down on a briefing (observability / product analytics)
create table public.briefing_feedback (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid references public.weekly_briefings (id) on delete cascade not null,
  user_id uuid references public.users (id) on delete cascade not null,
  sentiment text not null check (sentiment in ('up', 'down')),
  created_at timestamptz not null default now()
);

-- RLS Policies
alter table public.users enable row level security;
alter table public.family_members enable row level security;
alter table public.events enable row level security;
alter table public.parsed_emails enable row level security;
alter table public.weekly_briefings enable row level security;
alter table public.briefing_feedback enable row level security;

create policy "Users can manage own data" on public.users for all using (auth.uid() = id);
create policy "Users can manage own members" on public.family_members for all using (auth.uid() = user_id);
create policy "Users can manage own events" on public.events for all using (auth.uid() = user_id);
create policy "Users can view own emails" on public.parsed_emails for select using (auth.uid() = user_id);
create policy "Users can view own briefings" on public.weekly_briefings for select using (auth.uid() = user_id);

create index briefing_feedback_briefing_id_idx on public.briefing_feedback (briefing_id);
create policy "Users can insert own feedback" on public.briefing_feedback
  for insert with check (auth.uid() = user_id);
create policy "Users can view own feedback" on public.briefing_feedback
  for select using (auth.uid() = user_id);
