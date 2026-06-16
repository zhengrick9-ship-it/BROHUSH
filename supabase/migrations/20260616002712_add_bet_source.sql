alter table public.bets
  add column if not exists bet_source text not null default '体彩';

alter table public.bets
  drop constraint if exists bets_bet_source_check;

alter table public.bets
  add constraint bets_bet_source_check
  check (bet_source in ('体彩', '外围'));

create index if not exists bets_owner_source_match_idx
  on public.bets (owner_name, bet_source, match_id);
