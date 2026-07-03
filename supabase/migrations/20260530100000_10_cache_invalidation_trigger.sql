-- 10_cache_invalidation_trigger.sql
-- Database-level automatic trigger to notify cache invalidations

-- Enable the pg_net extension to support async HTTP webhooks securely
create extension if not exists pg_net;

create or replace function public.notify_cache_invalidation()
returns trigger as $$
declare
  course_id uuid;
  assessment_id uuid;
  secret_token text;
  payload jsonb;
  request_id bigint;
begin
  -- Retrieve variables based on table name and operation
  if TG_TABLE_NAME = 'courses' then
    if TG_OP = 'DELETE' then
      course_id := old.id;
    else
      course_id := new.id;
    end if;
  elsif TG_TABLE_NAME = 'assessments' then
    if TG_OP = 'DELETE' then
      assessment_id := old.id;
      course_id := old.course_id;
    else
      assessment_id := new.id;
      course_id := new.course_id;
    end if;
  end if;

  -- Static secret signature token key matching client environment
  secret_token := 'asentra-secret-drm-key-2026';
  
  -- Build payload structure
  payload := jsonb_build_object(
    'courseId', course_id,
    'assessmentId', assessment_id
  );

  -- Safe HTTP POST webhook invocation inside an exception block to prevent rollback failures
  begin
    select net.http_post(
      url := 'http://host.docker.internal:3000/api/cache/invalidate',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || secret_token
      ),
      body := payload
    ) into request_id;
  exception when others then
    -- Catch network failure safely to prevent core transaction rollback
    raise warning 'Cache invalidation network webhook failed: %', SQLERRM;
  end;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

-- Attach trigger to public.courses
drop trigger if exists notify_course_cache_invalidation on public.courses;
create trigger notify_course_cache_invalidation
  after insert or update or delete on public.courses
  for each row execute function public.notify_cache_invalidation();

-- Attach trigger to public.assessments
drop trigger if exists notify_assessment_cache_invalidation on public.assessments;
create trigger notify_assessment_cache_invalidation
  after insert or update or delete on public.assessments
  for each row execute function public.notify_cache_invalidation();
