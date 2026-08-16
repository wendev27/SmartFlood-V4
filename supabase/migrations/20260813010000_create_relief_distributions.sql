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

create table if not exists public.relief_distributions (
  distribution_id uuid primary key default uuid_generate_v4(),
  batch_id uuid not null references public.emergency_allocation_batches(batch_id) on update restrict on delete restrict,
  allocation_item_id uuid not null references public.emergency_allocation_items(item_id) on update restrict on delete restrict,
  family_id uuid not null references public.families(family_id) on update restrict on delete restrict,
  family_head_id uuid null references public.residents_v3(resident_id) on update restrict on delete restrict,
  barangay_id bigint not null references public.barangays(barangay_id) on update restrict on delete restrict,
  status text not null default 'received',
  verified_by uuid not null references public.app_users(id) on update restrict on delete restrict,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint relief_distributions_batch_family_key
    unique (batch_id, family_id),
  constraint relief_distributions_status_check
    check (status in ('received', 'rejected')),
  constraint relief_distributions_received_fields_check
    check (
      (status <> 'received')
      or (verified_at is not null and verified_by is not null)
    )
);

create index if not exists relief_distributions_batch_id_idx
  on public.relief_distributions(batch_id);

create index if not exists relief_distributions_allocation_item_id_idx
  on public.relief_distributions(allocation_item_id);

create index if not exists relief_distributions_family_id_idx
  on public.relief_distributions(family_id);

create index if not exists relief_distributions_barangay_id_idx
  on public.relief_distributions(barangay_id);

create index if not exists relief_distributions_status_idx
  on public.relief_distributions(status);

create index if not exists relief_distributions_verified_at_idx
  on public.relief_distributions(verified_at);

drop trigger if exists set_relief_distributions_updated_at
  on public.relief_distributions;

create trigger set_relief_distributions_updated_at
before update on public.relief_distributions
for each row
execute function public.set_emergency_workflow_updated_at();
