-- =============================================================
-- MIGRATION v6 — TROOP TIER on members  (already applied)
-- Additive: nothing existing is touched. `power` keeps its
-- "in millions" convention (218.7 = 218.7M).
-- =============================================================

alter table public.members
  add column if not exists tier text;   -- T9 | T10 | TG1..TG8 | null

-- Rank helper so the board can sort by tier: T9 < T10 < TG1 < … < TG8
create or replace function public.tier_rank(t text)
returns integer language sql immutable as $$
  select case t
    when 'T9'  then 1
    when 'T10' then 2
    when 'TG1' then 3
    when 'TG2' then 4
    when 'TG3' then 5
    when 'TG4' then 6
    when 'TG5' then 7
    when 'TG6' then 8
    when 'TG7' then 9
    when 'TG8' then 10
    else 0                              -- not set yet: sorts last
  end;
$$;

create index if not exists members_tier_idx
  on public.members (public.tier_rank(tier) desc,
                     (inf_count + cav_count + arch_count) desc);

-- The audit trigger also records tier and power changes now; see
-- migration_v3_audit_log.sql for the original function.
