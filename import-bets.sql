-- 导入你的 14 张已购投注 (用户ID: fb82bcbf-bc42-4516-a7ab-9358f056bd19)
-- 每注 100 元

do $$
declare
  uid uuid := 'fb82bcbf-bc42-4516-a7ab-9358f056bd19';
  mid uuid;
begin

-- 1. 墨西哥 vs 南非 → 客胜 @8.40
select id into mid from matches where home_team = '墨西哥' and away_team = '南非';
insert into bets (match_id, user_id, direction, odds, stake, result, profit) values (mid, uid, 'A', 8.40, 100, 'pending', 0);

-- 2. 韩国 vs 捷克 → 主胜 @2.43
select id into mid from matches where home_team = '韩国' and away_team = '捷克';
insert into bets (match_id, user_id, direction, odds, stake, result, profit) values (mid, uid, 'H', 2.43, 100, 'pending', 0);

-- 3. 加拿大 vs 波黑 → 主胜 @1.59
select id into mid from matches where home_team = '加拿大' and away_team = '波黑';
insert into bets (match_id, user_id, direction, odds, stake, result, profit) values (mid, uid, 'H', 1.59, 100, 'pending', 0);

-- 4. 美国 vs 巴拉圭 → 客胜 @3.92
select id into mid from matches where home_team = '美国' and away_team = '巴拉圭';
insert into bets (match_id, user_id, direction, odds, stake, result, profit) values (mid, uid, 'A', 3.92, 100, 'pending', 0);

-- 5. 巴西 vs 摩洛哥 → 主胜 @1.53
select id into mid from matches where home_team = '巴西' and away_team = '摩洛哥';
insert into bets (match_id, user_id, direction, odds, stake, result, profit) values (mid, uid, 'H', 1.53, 100, 'pending', 0);

-- 6. 澳大利亚 vs 土耳其 → 主胜 @5.15
select id into mid from matches where home_team = '澳大利亚' and away_team = '土耳其';
insert into bets (match_id, user_id, direction, odds, stake, result, profit) values (mid, uid, 'H', 5.15, 100, 'pending', 0);

-- 7. 荷兰 vs 日本 → 客胜 @3.92
select id into mid from matches where home_team = '荷兰' and away_team = '日本';
insert into bets (match_id, user_id, direction, odds, stake, result, profit) values (mid, uid, 'A', 3.92, 100, 'pending', 0);

-- 8. 瑞典 vs 突尼斯 → 客胜 @4.30
select id into mid from matches where home_team = '瑞典' and away_team = '突尼斯';
insert into bets (match_id, user_id, direction, odds, stake, result, profit) values (mid, uid, 'A', 4.30, 100, 'pending', 0);

-- 9. 比利时 vs 埃及 → 客胜 @5.85
select id into mid from matches where home_team = '比利时' and away_team = '埃及';
insert into bets (match_id, user_id, direction, odds, stake, result, profit) values (mid, uid, 'A', 5.85, 100, 'pending', 0);

-- 10. 沙特 vs 乌拉圭 → 主胜 @8.45
select id into mid from matches where home_team = '沙特' and away_team = '乌拉圭';
insert into bets (match_id, user_id, direction, odds, stake, result, profit) values (mid, uid, 'H', 8.45, 100, 'pending', 0);

-- 11. 法国 vs 塞内加尔 → 客胜 @6.75
select id into mid from matches where home_team = '法国' and away_team = '塞内加尔';
insert into bets (match_id, user_id, direction, odds, stake, result, profit) values (mid, uid, 'A', 6.75, 100, 'pending', 0);

-- 12. 奥地利 vs 约旦 → 客胜 @8.90
select id into mid from matches where home_team = '奥地利' and away_team = '约旦';
insert into bets (match_id, user_id, direction, odds, stake, result, profit) values (mid, uid, 'A', 8.90, 100, 'pending', 0);

-- 13. 英格兰 vs 克罗地亚 → 客胜 @5.25
select id into mid from matches where home_team = '英格兰' and away_team = '克罗地亚';
insert into bets (match_id, user_id, direction, odds, stake, result, profit) values (mid, uid, 'A', 5.25, 100, 'pending', 0);

-- 14. 加纳 vs 巴拿马 → 客胜 @3.60
select id into mid from matches where home_team = '加纳' and away_team = '巴拿马';
insert into bets (match_id, user_id, direction, odds, stake, result, profit) values (mid, uid, 'A', 3.60, 100, 'pending', 0);

raise notice '✅ 14 张投注全部导入成功！';
end $$;
