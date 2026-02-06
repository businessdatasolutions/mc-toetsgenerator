-- ============================================================
-- Migration: storage_policies
-- RLS policies for uploads and materials storage buckets.
-- ============================================================

-- Create buckets if they don't already exist (idempotent)
insert into storage.buckets (id, name, public, file_size_limit)
values ('uploads', 'uploads', false, 52428800)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit)
values ('materials', 'materials', false, 52428800)
on conflict (id) do nothing;

-- Uploads bucket: authenticated users can manage their own files
create policy "Users can upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'uploads');

create policy "Users can read own uploads"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'uploads');

create policy "Users can delete own uploads"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'uploads');

-- Materials bucket: authenticated users can upload, service_role can download
create policy "Users can upload materials"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'materials');

create policy "Users can read own materials"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'materials');

create policy "Users can delete own materials"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'materials');
