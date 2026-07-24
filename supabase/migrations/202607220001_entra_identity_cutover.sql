-- Apply only after the Vercel API and employee-to-Entra mapping are ready.
alter table public.pfig_employees
  add column if not exists entra_oid uuid;

create unique index if not exists pfig_employees_entra_oid_unique
  on public.pfig_employees (entra_oid)
  where entra_oid is not null;

alter table public.pfig_employees enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'pfig_employees'
  loop
    execute format('drop policy if exists %I on public.pfig_employees', policy_record.policyname);
  end loop;
end $$;

revoke all on table public.pfig_employees from anon, authenticated;
grant select, insert, update, delete on table public.pfig_employees to service_role;
