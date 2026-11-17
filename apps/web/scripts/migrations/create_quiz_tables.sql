-- Daily quiz (/quiz): synced course digests, generated questions, and one row
-- per user per day. Every table is private to its owner: the Worker forwards the
-- caller's own bearer token, so these RLS policies are the only authority for
-- reads and writes, exactly like the rest of the app.
--
-- No Canvas credential is stored anywhere. The iGuide Canvas Connect extension
-- reads Canvas in the student's own browser and the /quiz page uploads only the
-- resulting plain-text digests.
--
-- Run once in the Supabase SQL editor. Safe to re-run.

-- Courses from the student's current Canvas term. `context_digest` is the
-- plain-text summary of what the course is covering right now (upcoming
-- assignments and exams, announcements, open modules, lecture page excerpts,
-- syllabus); `synced_at` is when the extension last read it.
create table if not exists public.quiz_courses (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id bigint not null,
  name text not null,
  course_code text,
  enabled boolean not null default true,
  context_digest text,
  synced_at timestamptz,
  primary key (user_id, course_id)
);

-- Every generated question. The review columns drive the mistake bank: a
-- question that was answered wrong comes back in later quizzes until it has
-- been answered right twice in a row.
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id bigint not null,
  course_name text not null,
  topic text not null,
  question text not null,
  options jsonb not null,
  answer_index smallint not null,
  explanation text not null,
  created_on date not null,
  times_wrong integer not null default 0,
  review_streak integer not null default 0,
  mastered boolean not null default false,
  last_answered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists quiz_questions_review_idx
  on public.quiz_questions (user_id)
  where times_wrong > 0 and not mastered;

-- One quiz per user per day: the ordered question ids, which of them are
-- reviews of past mistakes, and the answers given so far ({ "<id>": index }).
create table if not exists public.quiz_daily (
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_date date not null,
  question_ids uuid[] not null,
  review_ids uuid[] not null default '{}',
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, quiz_date)
);

alter table public.quiz_courses enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_daily enable row level security;

-- Signed-in users only; guests get nothing.
revoke all on public.quiz_courses, public.quiz_questions, public.quiz_daily from anon;
grant select, insert, update, delete on public.quiz_courses, public.quiz_questions,
  public.quiz_daily to authenticated;

drop policy if exists quiz_courses_owner on public.quiz_courses;
create policy quiz_courses_owner on public.quiz_courses
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists quiz_questions_owner on public.quiz_questions;
create policy quiz_questions_owner on public.quiz_questions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists quiz_daily_owner on public.quiz_daily;
create policy quiz_daily_owner on public.quiz_daily
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
