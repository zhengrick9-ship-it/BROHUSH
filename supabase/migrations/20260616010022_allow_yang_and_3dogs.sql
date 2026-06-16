alter table public.bets
  drop constraint if exists bets_owner_name_check;

alter table public.bets
  add constraint bets_owner_name_check
  check (owner_name in ('木四', '听课', '饼干', 'yang没吐气'));

alter table public.bet_tickets
  drop constraint if exists bet_tickets_owner_name_check;

alter table public.bet_tickets
  add constraint bet_tickets_owner_name_check
  check (owner_name in ('木四', '听课', '饼干', 'yang没吐气'));
