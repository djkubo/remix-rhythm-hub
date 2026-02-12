-- Audit + idempotency log for Shippo webhook processing.

create table if not exists public.shippo_webhook_events (
  id uuid primary key default gen_random_uuid(),
  shippo_event text not null,
  tracking_number text,
  lead_id uuid references public.leads(id) on delete set null,
  event_fingerprint text not null unique,
  payload jsonb not null default '{}'::jsonb,
  headers jsonb not null default '{}'::jsonb,
  status text not null default 'received' check (
    status in ('received', 'processed', 'ignored', 'failed')
  ),
  processing_error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_shippo_webhook_events_created_at
  on public.shippo_webhook_events(created_at desc);

create index if not exists idx_shippo_webhook_events_tracking_number
  on public.shippo_webhook_events(tracking_number);

create index if not exists idx_shippo_webhook_events_lead_id
  on public.shippo_webhook_events(lead_id);

create index if not exists idx_shippo_webhook_events_status
  on public.shippo_webhook_events(status);

alter table public.shippo_webhook_events enable row level security;

drop policy if exists "Admins can read shippo_webhook_events" on public.shippo_webhook_events;
drop policy if exists "Admins can manage shippo_webhook_events" on public.shippo_webhook_events;

create policy "Admins can read shippo_webhook_events"
on public.shippo_webhook_events
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage shippo_webhook_events"
on public.shippo_webhook_events
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));
