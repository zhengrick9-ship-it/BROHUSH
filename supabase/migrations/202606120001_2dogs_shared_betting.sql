begin;

alter table public.matches
  add column if not exists source_match_number integer,
  add column if not exists stage text,
  add column if not exists round_number integer,
  add column if not exists kickoff_at timestamptz;

update public.matches
set stage = coalesce(stage, 'group'),
    round_number = coalesce(round_number, 1)
where stage is null or round_number is null;

with ranked as (
  select id,
         row_number() over (
           partition by match_id, direction, odds, stake
           order by created_at asc, id asc
         ) as row_number
  from public.bets
)
delete from public.bets
where id in (select id from ranked where row_number > 1);

alter table public.matches
  drop constraint if exists matches_stage_check;
alter table public.matches
  add constraint matches_stage_check check (
    stage in (
      'group', 'round_of_32', 'round_of_16', 'quarterfinal',
      'semifinal', 'third_place', 'final'
    )
  );

alter table public.matches
  drop constraint if exists matches_scores_check;
alter table public.matches
  add constraint matches_scores_check check (
    (home_score is null and away_score is null)
    or
    (home_score >= 0 and away_score >= 0)
  );

alter table public.bets
  drop constraint if exists bets_direction_check;
alter table public.bets
  add constraint bets_direction_check check (direction in ('H', 'D', 'A'));

alter table public.bets
  drop constraint if exists bets_values_check;
alter table public.bets
  add constraint bets_values_check check (odds > 1 and stake > 0);

create unique index if not exists matches_source_match_number_key
  on public.matches(source_match_number)
  where source_match_number is not null;

drop index if exists public.bets_one_shared_bet_per_match_key;
create index if not exists bets_match_id_idx on public.bets(match_id);

create index if not exists matches_round_order_idx
  on public.matches(stage, round_number, match_date, source_match_number);

alter table public.matches enable row level security;
alter table public.bets enable row level security;

create table if not exists public.bet_tickets (
  id text primary key,
  label text not null,
  purchased_at timestamptz not null,
  stake numeric not null check (stake > 0),
  base_stake numeric not null default 2 check (base_stake > 0),
  multiplier integer not null default 1 check (multiplier > 0),
  pass_types integer[] not null,
  result text not null default 'pending'
    check (result in ('won', 'lost', 'pending')),
  profit numeric not null default 0,
  source_image text,
  needs_review boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.bet_legs (
  id bigint generated always as identity primary key,
  ticket_id text not null references public.bet_tickets(id) on delete cascade,
  source_match_number integer not null,
  market text not null check (market in ('win_draw_loss', 'handicap')),
  handicap integer not null default 0,
  direction text not null check (direction in ('H', 'D', 'A')),
  odds numeric not null check (odds > 1),
  unique (ticket_id, source_match_number)
);

alter table public.bet_tickets enable row level security;
alter table public.bet_legs enable row level security;

drop policy if exists "public can read matches" on public.matches;
create policy "public can read matches"
  on public.matches for select
  to anon, authenticated
  using (true);

drop policy if exists "public can read bets" on public.bets;
create policy "public can read bets"
  on public.bets for select
  to anon, authenticated
  using (true);

drop policy if exists "public can read bet tickets" on public.bet_tickets;
create policy "public can read bet tickets"
  on public.bet_tickets for select
  to anon, authenticated
  using (true);

drop policy if exists "public can read bet legs" on public.bet_legs;
create policy "public can read bet legs"
  on public.bet_legs for select
  to anon, authenticated
  using (true);

revoke insert, update, delete on public.matches from anon, authenticated;
revoke insert, update, delete on public.bets from anon, authenticated;
revoke insert, update, delete on public.bet_tickets from anon, authenticated;
revoke insert, update, delete on public.bet_legs from anon, authenticated;
grant select on public.matches, public.bets, public.bet_tickets, public.bet_legs
  to anon, authenticated;
grant select, insert, update, delete
  on public.matches, public.bets, public.bet_tickets, public.bet_legs
  to service_role;
grant usage, select on all sequences in schema public to service_role;

insert into public.bet_tickets
  (
    id, label, purchased_at, stake, base_stake, multiplier, pass_types,
    result, profit, source_image, needs_review
  )
values
  (
    'photo-system-20260611',
    '8 场 · 2/3/4/5/6/7/8 关',
    '2026-06-11 13:06:00+08',
    494,
    2,
    1,
    array[2,3,4,5,6,7,8],
    'pending',
    0,
    '2fc71534e974e4176bccff1730b103bf.jpg',
    true
  ),
  (
    'photo-sixfold-20260611',
    '6×1 · 5 倍',
    '2026-06-11 13:09:26+08',
    10,
    2,
    5,
    array[6],
    'pending',
    0,
    'ce27aabff5143e369df4b3d337dfdaef.jpg',
    true
  )
on conflict (id) do update set
  label = excluded.label,
  purchased_at = excluded.purchased_at,
  stake = excluded.stake,
  base_stake = excluded.base_stake,
  multiplier = excluded.multiplier,
  pass_types = excluded.pass_types,
  source_image = excluded.source_image,
  needs_review = excluded.needs_review;

insert into public.bet_legs
  (ticket_id, source_match_number, market, handicap, direction, odds)
values
  ('photo-system-20260611', 2, 'handicap', -1, 'H', 5.95),
  ('photo-system-20260611', 6, 'win_draw_loss', 0, 'A', 5.25),
  ('photo-system-20260611', 11, 'win_draw_loss', 0, 'A', 3.92),
  ('photo-system-20260611', 9, 'handicap', 1, 'A', 5.30),
  ('photo-system-20260611', 12, 'handicap', -1, 'H', 3.55),
  ('photo-system-20260611', 16, 'win_draw_loss', 0, 'A', 5.85),
  ('photo-system-20260611', 19, 'win_draw_loss', 0, 'A', 8.90),
  ('photo-system-20260611', 21, 'handicap', -1, 'H', 4.25),
  ('photo-sixfold-20260611', 2, 'handicap', -1, 'H', 5.95),
  ('photo-sixfold-20260611', 4, 'handicap', -1, 'H', 3.70),
  ('photo-sixfold-20260611', 6, 'win_draw_loss', 0, 'A', 5.25),
  ('photo-sixfold-20260611', 11, 'win_draw_loss', 0, 'A', 3.92),
  ('photo-sixfold-20260611', 9, 'handicap', 1, 'A', 5.30),
  ('photo-sixfold-20260611', 15, 'handicap', -1, 'H', 3.10)
on conflict (ticket_id, source_match_number) do update set
  market = excluded.market,
  handicap = excluded.handicap,
  direction = excluded.direction,
  odds = excluded.odds;

commit;
