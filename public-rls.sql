-- 允许公开读取比赛
drop policy if exists "authenticated can read matches" on matches;
create policy "public can read matches" on matches for select using (true);

-- 允许公开读取投注记录
drop policy if exists "authenticated can read own bets" on bets;
create policy "public can read bets" on bets for select using (true);

-- 允许公开读取推荐方案
drop policy if exists "authenticated can read recommendations" on recommendations;
create policy "public can read recommendations" on recommendations for select using (true);
