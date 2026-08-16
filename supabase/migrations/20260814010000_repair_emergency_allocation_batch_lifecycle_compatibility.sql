with approval_audit as (
  select distinct on (audit.target_id)
    audit.target_id::uuid as batch_id,
    audit_user.id as actor_user_id,
    audit.created_at
  from public.audit_logs audit
  left join public.app_users audit_user
    on audit.actor_user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and audit_user.id = audit.actor_user_id::uuid
  where audit.target_type = 'emergency_allocation_batch'
    and audit.action = 'AI_RECOMMENDATION_APPROVED'
    and audit.target_id is not null
    and audit.target_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  order by audit.target_id, audit.created_at asc
),
repairable_batches as (
  select
    batch.batch_id,
    coalesce(batch.accepted_by, approval_audit.actor_user_id, batch.created_by) as repaired_accepted_by,
    coalesce(batch.accepted_at, approval_audit.created_at, batch.started_at, batch.created_at) as repaired_accepted_at
  from public.emergency_allocation_batches batch
  left join approval_audit
    on approval_audit.batch_id = batch.batch_id
  where batch.status in ('accepted', 'barangays_notified', 'in_distribution', 'completed', 'closed', 'expired')
    and (batch.accepted_by is null or batch.accepted_at is null)
    and coalesce(batch.accepted_by, approval_audit.actor_user_id, batch.created_by) is not null
    and coalesce(batch.accepted_at, approval_audit.created_at, batch.started_at, batch.created_at) is not null
)
update public.emergency_allocation_batches batch
set
  accepted_by = coalesce(batch.accepted_by, repairable_batches.repaired_accepted_by),
  accepted_at = coalesce(batch.accepted_at, repairable_batches.repaired_accepted_at)
from repairable_batches
where batch.batch_id = repairable_batches.batch_id;

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
        and closed_by is null
        and closed_at is null
      )
    );
