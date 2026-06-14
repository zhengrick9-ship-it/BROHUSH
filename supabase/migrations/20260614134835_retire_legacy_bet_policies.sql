begin;

drop policy if exists "authenticated can read own bets" on public.bets;
drop policy if exists "authenticated can insert own bets" on public.bets;
drop policy if exists "authenticated can update own bets" on public.bets;
drop policy if exists "authenticated can read matches" on public.matches;

revoke all on public.bets from anon, authenticated;
revoke all on public.bet_tickets from anon, authenticated;
revoke all on public.bet_legs from anon, authenticated;

commit;
