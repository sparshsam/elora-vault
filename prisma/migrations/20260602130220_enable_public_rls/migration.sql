-- Enable Row Level Security for all Prisma-managed public tables.
--
-- Prisma User.id is set from Supabase auth.getUser().user.id in the API
-- routes, so auth.uid()::text is the correct ownership boundary.
--
-- Server-side Prisma/service-role access continues to work through backend
-- APIs because this does not FORCE RLS and privileged database roles bypass
-- normal row policies. Public anon access receives no policies.

alter table public."User" enable row level security;
alter table public."Wallet" enable row level security;
alter table public."Bet" enable row level security;
alter table public."Transaction" enable row level security;
alter table public."VaultLock" enable row level security;
alter table public."Policy" enable row level security;
alter table public."Session" enable row level security;

drop policy if exists "Users can read own user row" on public."User";
create policy "Users can read own user row"
on public."User"
for select
to authenticated
using (id = auth.uid()::text);

drop policy if exists "Users can insert own user row" on public."User";
create policy "Users can insert own user row"
on public."User"
for insert
to authenticated
with check (id = auth.uid()::text);

drop policy if exists "Users can update own user row" on public."User";
create policy "Users can update own user row"
on public."User"
for update
to authenticated
using (id = auth.uid()::text)
with check (id = auth.uid()::text);

drop policy if exists "Users can read own wallet" on public."Wallet";
create policy "Users can read own wallet"
on public."Wallet"
for select
to authenticated
using ("userId" = auth.uid()::text);

drop policy if exists "Users can insert own wallet" on public."Wallet";
create policy "Users can insert own wallet"
on public."Wallet"
for insert
to authenticated
with check ("userId" = auth.uid()::text);

drop policy if exists "Users can update own wallet" on public."Wallet";
create policy "Users can update own wallet"
on public."Wallet"
for update
to authenticated
using ("userId" = auth.uid()::text)
with check ("userId" = auth.uid()::text);

drop policy if exists "Users can read own predictions" on public."Bet";
create policy "Users can read own predictions"
on public."Bet"
for select
to authenticated
using ("userId" = auth.uid()::text);

drop policy if exists "Users can insert own predictions" on public."Bet";
create policy "Users can insert own predictions"
on public."Bet"
for insert
to authenticated
with check ("userId" = auth.uid()::text);

drop policy if exists "Users can update own predictions" on public."Bet";
create policy "Users can update own predictions"
on public."Bet"
for update
to authenticated
using ("userId" = auth.uid()::text)
with check ("userId" = auth.uid()::text);

drop policy if exists "Users can read own transactions" on public."Transaction";
create policy "Users can read own transactions"
on public."Transaction"
for select
to authenticated
using ("userId" = auth.uid()::text);

drop policy if exists "Users can insert own transactions" on public."Transaction";
create policy "Users can insert own transactions"
on public."Transaction"
for insert
to authenticated
with check ("userId" = auth.uid()::text);

drop policy if exists "Users can read own vault locks" on public."VaultLock";
create policy "Users can read own vault locks"
on public."VaultLock"
for select
to authenticated
using ("userId" = auth.uid()::text);

drop policy if exists "Users can insert own vault locks" on public."VaultLock";
create policy "Users can insert own vault locks"
on public."VaultLock"
for insert
to authenticated
with check ("userId" = auth.uid()::text);

drop policy if exists "Users can update own vault locks" on public."VaultLock";
create policy "Users can update own vault locks"
on public."VaultLock"
for update
to authenticated
using ("userId" = auth.uid()::text)
with check ("userId" = auth.uid()::text);

drop policy if exists "Users can read own policies" on public."Policy";
create policy "Users can read own policies"
on public."Policy"
for select
to authenticated
using ("userId" = auth.uid()::text);

drop policy if exists "Users can insert own policies" on public."Policy";
create policy "Users can insert own policies"
on public."Policy"
for insert
to authenticated
with check ("userId" = auth.uid()::text);

drop policy if exists "Users can update own policies" on public."Policy";
create policy "Users can update own policies"
on public."Policy"
for update
to authenticated
using ("userId" = auth.uid()::text)
with check ("userId" = auth.uid()::text);

drop policy if exists "Users can delete own policies" on public."Policy";
create policy "Users can delete own policies"
on public."Policy"
for delete
to authenticated
using ("userId" = auth.uid()::text);

drop policy if exists "Users can read own sessions" on public."Session";
create policy "Users can read own sessions"
on public."Session"
for select
to authenticated
using ("userId" = auth.uid()::text);

drop policy if exists "Users can insert own sessions" on public."Session";
create policy "Users can insert own sessions"
on public."Session"
for insert
to authenticated
with check ("userId" = auth.uid()::text);

drop policy if exists "Users can update own sessions" on public."Session";
create policy "Users can update own sessions"
on public."Session"
for update
to authenticated
using ("userId" = auth.uid()::text)
with check ("userId" = auth.uid()::text);
