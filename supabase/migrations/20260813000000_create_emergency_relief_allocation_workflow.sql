create extension if not exists "uuid-ossp";

create or replace function public.set_emergency_workflow_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.emergency_allocation_batches (
  batch_id uuid primary key default uuid_generate_v4(),
  plan_id text not null,
  plan_name text not null,
  status text not null,
  created_by uuid null references public.app_users(id) on update restrict on delete restrict,
  accepted_by uuid null references public.app_users(id) on update restrict on delete restrict,
  rejected_by uuid null references public.app_users(id) on update restrict on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz null,
  rejected_at timestamptz null,
  constraint emergency_allocation_batches_status_check
    check (status in ('accepted', 'rejected', 'barangays_notified', 'in_distribution', 'completed')),
  constraint emergency_allocation_batches_state_integrity_check
    check (
      (
        status = 'accepted'
        and accepted_by is not null
        and accepted_at is not null
        and rejected_by is null
        and rejected_at is null
      )
      or (
        status = 'rejected'
        and rejected_by is not null
        and rejected_at is not null
        and accepted_by is null
        and accepted_at is null
      )
      or (
        status in ('barangays_notified', 'in_distribution', 'completed')
        and accepted_by is not null
        and accepted_at is not null
        and rejected_by is null
        and rejected_at is null
      )
    )
);

create table if not exists public.emergency_allocation_items (
  item_id uuid primary key default uuid_generate_v4(),
  batch_id uuid not null references public.emergency_allocation_batches(batch_id) on update restrict on delete restrict,
  recommendation_id uuid null references public.ai_recommendations(recommendation_id) on update restrict on delete restrict,
  barangay_id bigint not null references public.barangays(barangay_id) on update restrict on delete restrict,
  barangay_name text not null,
  family_food_packs int4 not null default 0,
  individual_relief_goods int4 not null default 0,
  emergency_kits int4 not null default 0,
  barangay_status text not null,
  accepted_at timestamptz null,
  rejected_at timestamptz null,
  receipt_confirmed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint emergency_allocation_items_batch_barangay_key
    unique (batch_id, barangay_id),
  constraint emergency_allocation_items_barangay_status_check
    check (barangay_status in ('pending', 'notified', 'accepted', 'rejected', 'receipt_confirmed', 'family_heads_notified', 'completed')),
  constraint emergency_allocation_items_family_food_packs_check
    check (family_food_packs >= 0),
  constraint emergency_allocation_items_individual_relief_goods_check
    check (individual_relief_goods >= 0),
  constraint emergency_allocation_items_emergency_kits_check
    check (emergency_kits >= 0),
  constraint emergency_allocation_items_state_integrity_check
    check (
      (
        barangay_status in ('pending', 'notified')
        and accepted_at is null
        and rejected_at is null
        and receipt_confirmed_at is null
      )
      or (
        barangay_status = 'accepted'
        and accepted_at is not null
        and rejected_at is null
        and receipt_confirmed_at is null
      )
      or (
        barangay_status = 'rejected'
        and rejected_at is not null
        and accepted_at is null
        and receipt_confirmed_at is null
      )
      or (
        barangay_status in ('receipt_confirmed', 'family_heads_notified', 'completed')
        and accepted_at is not null
        and receipt_confirmed_at is not null
        and rejected_at is null
      )
    )
);

create table if not exists public.notifications (
  notification_id uuid primary key default uuid_generate_v4(),
  type text not null,
  target_type text not null,
  target_user_id uuid null references public.app_users(id) on update restrict on delete restrict,
  target_barangay_id bigint null references public.barangays(barangay_id) on update restrict on delete restrict,
  target_family_id uuid null references public.families(family_id) on update restrict on delete restrict,
  source_type text null,
  source_id text null,
  title text not null,
  message text not null,
  status text not null default 'pending',
  read_at timestamptz null,
  accepted_at timestamptz null,
  rejected_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notifications_type_check
    check (length(btrim(type)) > 0),
  constraint notifications_target_type_check
    check (target_type in ('user', 'barangay', 'family')),
  constraint notifications_status_check
    check (status in ('pending', 'sent', 'read', 'accepted', 'rejected')),
  constraint notifications_target_matches_type_check
    check (
      (
        target_type = 'user'
        and target_user_id is not null
        and target_barangay_id is null
        and target_family_id is null
      )
      or (
        target_type = 'barangay'
        and target_barangay_id is not null
        and target_user_id is null
        and target_family_id is null
      )
      or (
        target_type = 'family'
        and target_family_id is not null
        and target_user_id is null
        and target_barangay_id is null
      )
    ),
  constraint notifications_state_integrity_check
    check (
      (
        status in ('pending', 'sent')
        and read_at is null
        and accepted_at is null
        and rejected_at is null
      )
      or (
        status = 'read'
        and read_at is not null
        and accepted_at is null
        and rejected_at is null
      )
      or (
        status = 'accepted'
        and read_at is not null
        and accepted_at is not null
        and rejected_at is null
      )
      or (
        status = 'rejected'
        and read_at is not null
        and rejected_at is not null
        and accepted_at is null
      )
    )
);

create index if not exists emergency_allocation_batches_status_idx
  on public.emergency_allocation_batches(status);

create index if not exists emergency_allocation_batches_created_by_idx
  on public.emergency_allocation_batches(created_by);

create index if not exists emergency_allocation_items_batch_id_idx
  on public.emergency_allocation_items(batch_id);

create index if not exists emergency_allocation_items_barangay_id_idx
  on public.emergency_allocation_items(barangay_id);

create index if not exists emergency_allocation_items_barangay_status_idx
  on public.emergency_allocation_items(barangay_status);

create index if not exists notifications_target_user_id_idx
  on public.notifications(target_user_id);

create index if not exists notifications_target_barangay_id_idx
  on public.notifications(target_barangay_id);

create index if not exists notifications_target_family_id_idx
  on public.notifications(target_family_id);

create index if not exists notifications_status_idx
  on public.notifications(status);

create index if not exists notifications_created_at_idx
  on public.notifications(created_at);

drop trigger if exists set_emergency_allocation_batches_updated_at
  on public.emergency_allocation_batches;

create trigger set_emergency_allocation_batches_updated_at
before update on public.emergency_allocation_batches
for each row
execute function public.set_emergency_workflow_updated_at();

drop trigger if exists set_emergency_allocation_items_updated_at
  on public.emergency_allocation_items;

create trigger set_emergency_allocation_items_updated_at
before update on public.emergency_allocation_items
for each row
execute function public.set_emergency_workflow_updated_at();

drop trigger if exists set_notifications_updated_at
  on public.notifications;

create trigger set_notifications_updated_at
before update on public.notifications
for each row
execute function public.set_emergency_workflow_updated_at();
