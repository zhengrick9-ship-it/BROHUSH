alter table public.bet_legs
  add column if not exists score_home integer,
  add column if not exists score_away integer;

alter table public.bet_legs
  alter column direction drop not null;

alter table public.bet_legs
  drop constraint if exists bet_legs_market_check,
  drop constraint if exists bet_legs_direction_check,
  drop constraint if exists bet_legs_score_check;

alter table public.bet_legs
  add constraint bet_legs_market_check
    check (market in ('win_draw_loss', 'handicap', 'score')),
  add constraint bet_legs_direction_check
    check (
      (market = 'score' and direction is null)
      or
      (market in ('win_draw_loss', 'handicap') and direction in ('H', 'D', 'A'))
    ),
  add constraint bet_legs_score_check
    check (
      (market = 'score' and score_home >= 0 and score_away >= 0)
      or
      (market <> 'score' and score_home is null and score_away is null)
    );

drop index if exists public.bet_legs_ticket_selection_key;

create unique index bet_legs_ticket_selection_key
  on public.bet_legs (
    ticket_id,
    source_match_number,
    market,
    handicap,
    coalesce(direction, ''),
    odds,
    coalesce(score_home, -1),
    coalesce(score_away, -1)
  );
