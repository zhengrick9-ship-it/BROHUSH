import test from 'node:test';
import assert from 'node:assert/strict';
import { GAMES, generate, validTicket, randomInt, ticketText } from './engine.ts';
for (const id of Object.keys(GAMES)) {
  test(`${id}: 1000组范围、位数、唯一与排序`, () => {
    for(let i=0;i<50;i++) {
      const rows=generate(id,20); assert.equal(new Set(rows.map(ticketText)).size,20);
      for(const row of rows){assert.ok(validTicket(row));GAMES[id].groups.forEach((g,j)=>{if(g.unique)assert.deepEqual(row.numbers[j],[...row.numbers[j]].sort((a,b)=>a-b));});}
    }
  });
}
test('七星彩前六位允许重复，末位可取14，位置不可排序',()=>{
  const row=generate('qxc',1,[[9],[0],[0],[9],[0],[0],[14]])[0];
  assert.deepEqual(row.numbers,[[9],[0],[0],[9],[0],[0],[14]]);assert.ok(validTicket(row));
  assert.match(ticketText(row),/9.*0.*0.*9.*0.*0.*14/);
});
test('排列5保留前导零',()=>assert.match(ticketText(generate('pl5',1,[[0],[0],[1],[2],[3]])[0]),/0.*0.*1.*2.*3/));
test('锁号保持且不污染输入',()=>{const locks=[[1,35],[12]];for(const t of generate('dlt',20,locks)){assert.ok(t.numbers[0].includes(1)&&t.numbers[0].includes(35));assert.ok(t.numbers[1].includes(12));}assert.deepEqual(locks,[[1,35],[12]]);});
test('全锁时只容许1组',()=>{assert.equal(generate('ssq',1,[[1,2,3,4,5,6],[16]]).length,1);assert.throws(()=>generate('ssq',3,[[1,2,3,4,5,6],[16]]),/最多生成1组/);});
test('非法参数拒绝',()=>{for(const n of [0,21,1.5,NaN])assert.throws(()=>generate('dlt',n));assert.throws(()=>generate('qxc',1,[[10]]));assert.throws(()=>generate('dlt',1,[[1,1]]));assert.throws(()=>generate('ssq',1,[[34]]));});
test('消除取模偏差的拒绝采样',()=>{let calls=0;assert.equal(randomInt(10,()=>++calls===1?4294967295:9),9);assert.equal(calls,2);assert.throws(()=>randomInt(10,()=>-1));});
test('不把存储坏数据作为有效号码',()=>{for(const x of [null,{}, {game:'__proto__',numbers:[]},{game:'ssq',numbers:[[1,1,2,3,4,5],[1]]},{game:'qxc',numbers:[[1],[1],[1],[1],[1],[1],[15]]}])assert.equal(validTicket(x),false);});
