-- Reference schema (columns must match app + your Supabase table)

create extension if not exists "pgcrypto";

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  owner_phone text not null unique,
  name text not null,
  address text default "",
  gmb_link text not null,
  keywords text default "",
  products text default "",
  plan text not null default 'free'
);

create index if not exists businesses_owner_phone_idx on public.businesses (owner_phone);

create table if not exists public.otp_store (
  identifier text primary key,
  otp text not null,
  expires_at timestamptz not null
);
