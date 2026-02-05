-- ============================================================
-- Migration: rls_policies
-- Row Level Security for all tables
-- ============================================================

-- 3.2 Enable RLS on all 6 tables
alter table exams enable row level security;
alter table questions enable row level security;
alter table assessments enable row level security;
alter table materials enable row level security;
alter table chunks enable row level security;
alter table generation_jobs enable row level security;

-- 3.3 RLS policies for exams: users can only CRUD their own exams
create policy "Users can view own exams"
  on exams for select
  to authenticated
  using (auth.uid() = created_by);

create policy "Users can insert own exams"
  on exams for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Users can update own exams"
  on exams for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

create policy "Users can delete own exams"
  on exams for delete
  to authenticated
  using (auth.uid() = created_by);

-- 3.4 RLS policies for questions: access via exam ownership
create policy "Users can view questions of own exams"
  on questions for select
  to authenticated
  using (exists (
    select 1 from exams where exams.id = questions.exam_id and exams.created_by = auth.uid()
  ));

create policy "Users can insert questions into own exams"
  on questions for insert
  to authenticated
  with check (exists (
    select 1 from exams where exams.id = questions.exam_id and exams.created_by = auth.uid()
  ));

create policy "Users can update questions of own exams"
  on questions for update
  to authenticated
  using (exists (
    select 1 from exams where exams.id = questions.exam_id and exams.created_by = auth.uid()
  ))
  with check (exists (
    select 1 from exams where exams.id = questions.exam_id and exams.created_by = auth.uid()
  ));

create policy "Users can delete questions of own exams"
  on questions for delete
  to authenticated
  using (exists (
    select 1 from exams where exams.id = questions.exam_id and exams.created_by = auth.uid()
  ));

-- 3.5 RLS policies for assessments: SELECT via question→exam ownership, INSERT for service_role only
create policy "Users can view assessments of own questions"
  on assessments for select
  to authenticated
  using (exists (
    select 1 from questions q
    join exams e on e.id = q.exam_id
    where q.id = assessments.question_id and e.created_by = auth.uid()
  ));

create policy "Service role can insert assessments"
  on assessments for insert
  to service_role
  with check (true);

create policy "Service role can update assessments"
  on assessments for update
  to service_role
  using (true)
  with check (true);

-- 3.6 RLS policies for materials: users can CRUD their own uploads
create policy "Users can view own materials"
  on materials for select
  to authenticated
  using (auth.uid() = uploaded_by);

create policy "Users can insert own materials"
  on materials for insert
  to authenticated
  with check (auth.uid() = uploaded_by);

create policy "Users can update own materials"
  on materials for update
  to authenticated
  using (auth.uid() = uploaded_by)
  with check (auth.uid() = uploaded_by);

create policy "Users can delete own materials"
  on materials for delete
  to authenticated
  using (auth.uid() = uploaded_by);

-- 3.7 RLS policies for chunks: SELECT via material ownership
create policy "Users can view chunks of own materials"
  on chunks for select
  to authenticated
  using (exists (
    select 1 from materials where materials.id = chunks.material_id and materials.uploaded_by = auth.uid()
  ));

create policy "Service role can manage chunks"
  on chunks for all
  to service_role
  using (true)
  with check (true);

-- RLS policies for generation_jobs: users can view/create own jobs
create policy "Users can view own generation jobs"
  on generation_jobs for select
  to authenticated
  using (auth.uid() = created_by);

create policy "Users can insert own generation jobs"
  on generation_jobs for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Service role can manage generation jobs"
  on generation_jobs for all
  to service_role
  using (true)
  with check (true);
