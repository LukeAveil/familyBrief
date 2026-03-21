-- Allow calendar events imported from image/PDF uploads
alter table public.events drop constraint if exists events_source_check;
alter table public.events
  add constraint events_source_check check (source in ('manual', 'email', 'image'));
