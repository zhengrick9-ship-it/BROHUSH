const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://xhoehwrevivkrejkyqah.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhob2Vod3Jldml2a3Jlamt5cWFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA4MDM1NywiZXhwIjoyMDk2NjU2MzU3fQ.VUBvBLhizugZWEQ70XjsOyT5W8_xsQ2FkvspK9SzKPA'
);

async function run() {
  // 1. 获取所有木四的投注
  const { data: musBets } = await s.from('bets').select('*').eq('person', '木四');
  console.log(`木四有 ${musBets?.length || 0} 注`);

  if (musBets && musBets.length > 0) {
    // 2. 为听课插入同样的投注
    const tkBets = musBets.map(b => ({
      match_id: b.match_id,
      direction: b.direction,
      odds: b.odds,
      stake: b.stake,
      result: b.result || 'pending',
      profit: b.profit || 0,
      person: '听课'
    }));

    const { data, error } = await s.from('bets').insert(tkBets);
    if (error) {
      console.log('插入听课数据失败:', error.message);
    } else {
      console.log(`✅ 成功插入 ${tkBets.length} 注听课数据`);
    }
  }

  // 3. 验证
  const { data: all } = await s.from('bets').select('person, count').order('person');
  console.log('当前投注分布:', JSON.stringify(all));
}
run().catch(e => console.log(e));
