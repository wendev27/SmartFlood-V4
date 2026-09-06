-- Rename the arrival label only. Existing report IDs, residents, photos and
-- terminal states are retained. Apply before deploying writers of 'Arrived'.
begin;
lock table public.emergency_reports in access exclusive mode;

do $$
declare
  status_column smallint;
  status_checks text[];
begin
  select attnum into status_column from pg_attribute
  where attrelid = 'public.emergency_reports'::regclass and attname = 'status' and not attisdropped;
  select array_agg(conname::text) into status_checks from pg_constraint
  where conrelid = 'public.emergency_reports'::regclass and contype = 'c'
    and conkey = array[status_column]::smallint[];
  if coalesce(cardinality(status_checks), 0) <> 1 then
    raise exception 'Expected one status-only check on emergency_reports; inspect constraints before applying';
  end if;
  if exists (select 1 from public.emergency_reports where status not in
    ('Pending','En Route','On Scene','Arrived','Resolved','Rejected','Cancelled')) then
    raise exception 'Unknown emergency status; no changes applied';
  end if;
  execute format('alter table public.emergency_reports drop constraint %I', status_checks[1]);
end $$;

update public.emergency_reports set status = 'Arrived' where status = 'On Scene';

alter table public.emergency_reports add constraint emergency_reports_status_check
  check (status in ('Pending','En Route','Arrived','Resolved','Rejected','Cancelled'));
commit;
