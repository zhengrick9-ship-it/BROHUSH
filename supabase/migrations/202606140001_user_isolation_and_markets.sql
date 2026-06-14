begin;

alter table public.matches
  add column if not exists handicap_value numeric,
  add column if not exists odds_handicap_h numeric,
  add column if not exists odds_handicap_d numeric,
  add column if not exists odds_handicap_a numeric;

alter table public.bets
  add column if not exists owner_name text,
  add column if not exists market text default 'win_draw_loss',
  add column if not exists handicap numeric default 0;

update public.bets
set owner_name = coalesce(owner_name, '木四'),
    market = coalesce(market, 'win_draw_loss'),
    handicap = coalesce(handicap, 0);

insert into public.bets
  (match_id, owner_name, market, handicap, direction, odds, stake, result, profit, created_at)
select
  match_id, '听课', market, handicap, direction, odds, stake, result, profit, created_at
from public.bets
where owner_name = '木四'
  and not exists (
    select 1
    from public.bets existing
    where existing.owner_name = '听课'
  );

alter table public.bets
  alter column owner_name set not null,
  alter column market set not null,
  alter column handicap set not null;

alter table public.bets
  drop constraint if exists bets_owner_name_check;
alter table public.bets
  add constraint bets_owner_name_check check (owner_name in ('木四', '听课', '饼干'));

alter table public.bets
  drop constraint if exists bets_market_check;
alter table public.bets
  add constraint bets_market_check check (market in ('win_draw_loss', 'handicap'));

create index if not exists bets_owner_match_idx
  on public.bets(owner_name, match_id);

alter table public.bet_tickets
  add column if not exists owner_name text,
  add column if not exists ticket_number integer,
  add column if not exists potential_payout numeric;

update public.bet_tickets
set owner_name = coalesce(owner_name, '木四');

with numbered as (
  select id, row_number() over (order by purchased_at, id) as number
  from public.bet_tickets
  where owner_name = '木四'
)
update public.bet_tickets ticket
set ticket_number = numbered.number
from numbered
where ticket.id = numbered.id
  and ticket.ticket_number is null;

insert into public.bet_tickets
  (
    id, owner_name, ticket_number, label, purchased_at, stake, base_stake,
    multiplier, pass_types, result, profit, source_image, needs_review, created_at
  )
select
  id || '-tingke', '听课', ticket_number, label, purchased_at, stake, base_stake,
  multiplier, pass_types, result, profit, source_image, needs_review, created_at
from public.bet_tickets source
where source.owner_name = '木四'
  and not exists (
    select 1
    from public.bet_tickets existing
    where existing.owner_name = '听课'
  );

insert into public.bet_legs
  (ticket_id, source_match_number, market, handicap, direction, odds)
select
  leg.ticket_id || '-tingke',
  leg.source_match_number,
  leg.market,
  leg.handicap,
  leg.direction,
  leg.odds
from public.bet_legs leg
join public.bet_tickets source on source.id = leg.ticket_id
where source.owner_name = '木四'
on conflict (ticket_id, source_match_number) do nothing;

alter table public.bet_tickets
  alter column owner_name set not null,
  alter column ticket_number set not null;

alter table public.bet_tickets
  drop constraint if exists bet_tickets_owner_name_check;
alter table public.bet_tickets
  add constraint bet_tickets_owner_name_check check (owner_name in ('木四', '听课', '饼干'));

create unique index if not exists bet_tickets_owner_number_key
  on public.bet_tickets(owner_name, ticket_number);

drop policy if exists "public can read bets" on public.bets;
drop policy if exists "public can read bet tickets" on public.bet_tickets;
drop policy if exists "public can read bet legs" on public.bet_legs;

alter table public.bet_legs
  drop constraint if exists bet_legs_ticket_id_source_match_number_key;

create unique index if not exists bet_legs_ticket_selection_key
  on public.bet_legs(ticket_id, source_match_number, market, handicap, direction, odds);

revoke select on public.bets from anon, authenticated;
revoke select on public.bet_tickets from anon, authenticated;
revoke select on public.bet_legs from anon, authenticated;

grant select, insert, update, delete
  on public.matches, public.bets, public.bet_tickets, public.bet_legs
  to service_role;

commit;
