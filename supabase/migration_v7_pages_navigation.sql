-- =============================================================
-- MIGRATION v7 — PAGES IN THE TOP NAVIGATION  (already applied)
-- Any page built in the editor can appear as a button in the
-- alliance menu, with its own label and position.
-- =============================================================

alter table public.event_pages
  add column if not exists nav_label text,
  add column if not exists nav_order integer not null default 100,
  add column if not exists in_nav    boolean not null default true;

create index if not exists event_pages_nav_idx
  on public.event_pages (in_nav, nav_order, id);

update public.event_pages
   set nav_label = coalesce(nav_label, title)
 where nav_label is null;

-- Pages now live at the top level (/:slug), so the event page that
-- used the slug "tri-alliance" was renamed to avoid colliding with
-- the hand-built /tri-alliance guide.
update public.event_pages set slug = 'tri-alliance-clash' where slug = 'tri-alliance';
