-- 1. 给 bets 表加 person 字段
alter table bets add column if not exists person text default '木四';

-- 2. 现有的投注都是木四的，标记一下
update bets set person = '木四' where person is null;

-- 3. 给听课复制同样的 14 注（除了 user_id 不用管）
do $$
declare
  r record;
  new_id uuid;
begin
  for r in select * from bets where person = '木四' loop
    insert into bets (match_id, direction, odds, stake, result, profit, person)
    values (r.match_id, r.direction, r.odds, r.stake, r.result, r.profit, '听课');
  end loop;
end $$;

-- 4. 允许所有人访问
drop policy if exists "public can read bets" on bets;
create policy "public can read bets" on bets for select using (true);
