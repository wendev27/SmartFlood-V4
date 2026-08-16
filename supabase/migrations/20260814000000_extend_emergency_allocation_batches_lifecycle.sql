alter table public.emergency_allocation_batches
  add column if not exists started_at timestamptz null,
  add column if not exists expires_at timestamptz null,
  add column if not exists closed_at timestamptz null,
  add column if not exists closed_by uuid null references public.app_users(id) on update restrict on delete restrict,
  add column if not exists closure_reason text null;

alter table public.emergency_allocation_batches
  drop constraint if exists emergency_allocation_batches_status_check;

alter table public.emergency_allocation_batches
  add constraint emergency_allocation_batches_status_check
    check (status in ('accepted', 'rejected', 'barangays_notified', 'in_distribution', 'completed', 'expired', 'closed'));

alter table public.emergency_allocation_batches
  drop constraint if exists emergency_allocation_batches_state_integrity_check;

alter table public.emergency_allocation_batches
  add constraint emergency_allocation_batches_state_integrity_check
    check (
      (
        status = 'rejected'
        and rejected_by is not null
        and rejected_at is not null
        and accepted_by is null
        and accepted_at is null
        and closed_by is null
        and closed_at is null
      )
      or (
        status = 'closed'
        and accepted_by is not null
        and accepted_at is not null
        and rejected_by is null
        and rejected_at is null
        and closed_by is not null
        and closed_at is not null
      )
      or (
        status in ('accepted', 'barangays_notified', 'in_distribution', 'completed', 'expired')
        and accepted_by is not null
        and accepted_at is not null
        and rejected_by is null
        and rejected_at is null
      )
    );

create index if not exists emergency_allocation_batches_started_at_idx
  on public.emergency_allocation_batches(started_at);

create index if not exists emergency_allocation_batches_expires_at_idx
  on public.emergency_allocation_batches(expires_at);

create index if not exists emergency_allocation_batches_closed_by_idx
  on public.emergency_allocation_batches(closed_by);
