-- =============================================================
-- DAD TROOPS INTEL — MIGRATION v2
-- Adds EXACT troop counts + avatar. Non-destructive: keeps the
-- existing range columns (inf/cav/arc) and all current data.
-- Run this ONCE in the Supabase SQL Editor.
-- =============================================================

-- ------- 1. New columns -------
alter table public.members
  add column if not exists inf_count integer not null default 0,
  add column if not exists cav_count integer not null default 0,
  add column if not exists arch_count integer not null default 0,
  add column if not exists avatar text;

-- ------- 2. Helper: convert an old range label to a representative exact count -------
create or replace function public.range_to_count(r text)
returns integer as $$
  select case r
    when '<200'    then 150000
    when '200-300' then 250000
    when '300-400' then 350000
    when '400-500' then 450000
    when '500-600' then 550000
    when '600-700' then 650000
    when '700-800' then 750000
    when '>800'    then 850000
    else 0
  end;
$$ language sql immutable;

-- ------- 3. Backfill exact counts from the existing ranges (only where still zero) -------
update public.members set
  inf_count  = public.range_to_count(inf)
where inf_count = 0 and inf is not null;
update public.members set
  cav_count  = public.range_to_count(cav)
where cav_count = 0 and cav is not null;
update public.members set
  arch_count = public.range_to_count(arc)
where arch_count = 0 and arc is not null;

-- ------- 4. Assign a random pet avatar to anyone without one -------
update public.members
set avatar = (array['panther','cheetah','lynx','elephant','wolf'])[1 + floor(random() * 5)::int]
where avatar is null;

-- ------- 5. Index for sorting by army size -------
create index if not exists members_total_idx
  on public.members ((inf_count + cav_count + arch_count) desc);
