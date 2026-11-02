export type GameId = "dlt" | "ssq" | "qxc" | "pl3" | "pl5" | "fc3d";
export type Group = { label: string; min: number; max: number; count: number; unique: boolean; pad: boolean };
export type Ticket = { game: GameId; numbers: number[][] };
export type Locks = (number | null)[][];
const digit = (label: string, max = 9): Group => ({ label, min: 0, max, count: 1, unique: false, pad: false });
export const GAMES: Record<GameId, { name: string; badge: string; subtitle: string; groups: Group[]; source: string }> = {
  dlt: { name: "超级大乐透", badge: "5 + 2", subtitle: "前区 01–35 选5个 · 后区 01–12 选2个", groups: [{ label: "前区", min: 1, max: 35, count: 5, unique: true, pad: true }, { label: "后区", min: 1, max: 12, count: 2, unique: true, pad: true }], source: "https://www.gstc.org.cn/newsDetail/030600/030601" },
  ssq: { name: "双色球", badge: "6 + 1", subtitle: "红球 01–33 选6个 · 蓝球 01–16 选1个", groups: [{ label: "红球", min: 1, max: 33, count: 6, unique: true, pad: true }, { label: "蓝球", min: 1, max: 16, count: 1, unique: true, pad: true }], source: "https://www.scflcp.com.cn/yxgz/823145252.jhtml" },
  qxc: { name: "七星彩", badge: "6 + 1位", subtitle: "前六位各 0–9 · 最后一位 0–14 · 顺序保留", groups: [...Array.from({ length: 6 }, (_, i) => digit(`第${i + 1}位`)), digit("末位", 14)], source: "https://www.zhcw.com/c/2020-09-27/619756.shtml" },
  pl3: { name: "排列3", badge: "3位", subtitle: "百位、十位、个位各 0–9 · 直选单式", groups: [digit("百位"), digit("十位"), digit("个位")], source: "https://www.sport.gov.cn/cpzx/n5649/c663326/content.html" },
  pl5: { name: "排列5", badge: "5位", subtitle: "五个位置各 0–9 · 直选单式 · 允许重号", groups: Array.from({ length: 5 }, (_, i) => digit(`第${i + 1}位`)), source: "https://accpbet.sporttery.cn/h5/helpCenter/help_4_20.html" },
  fc3d: { name: "福彩3D", badge: "3位", subtitle: "百位、十位、个位各 0–9 · 单选单式", groups: [digit("百位"), digit("十位"), digit("个位")], source: "https://zhs.mof.gov.cn/zhengcefabu/201409/t20140925_1144249.htm" },
};

export function randomInt(max: number, draw: () => number = () => globalThis.crypto.getRandomValues(new Uint32Array(1))[0]): number {
  if (!Number.isInteger(max) || max < 1 || max > 0x100000000) throw new Error("随机数范围无效");
  const limit = Math.floor(0x100000000 / max) * max;
  for (let i = 0; i < 10000; i++) {
    const value = draw();
    if (!Number.isInteger(value) || value < 0 || value >= 0x100000000) throw new Error("随机数源无效");
    if (value < limit) return value % max;
  }
  throw new Error("随机数源不可用，请重试");
}

export function validTicket(value: unknown): value is Ticket {
  if (!value || typeof value !== "object") return false;
  const t = value as Ticket;
  if (typeof t.game !== "string" || !Object.hasOwn(GAMES, t.game) || !Array.isArray(t.numbers) || t.numbers.length !== GAMES[t.game].groups.length) return false;
  return GAMES[t.game].groups.every((g, i) => Array.isArray(t.numbers[i]) && t.numbers[i].length === g.count && t.numbers[i].every(n => Number.isInteger(n) && n >= g.min && n <= g.max) && (!g.unique || new Set(t.numbers[i]).size === g.count));
}

function choose(n: number, k: number): number { let v = 1; for (let i = 1; i <= k; i++) v = v * (n - i + 1) / i; return Math.round(v); }
export function generate(game: GameId, count: number, locks: Locks = [], rng: (max: number) => number = randomInt): Ticket[] {
  if (!Object.hasOwn(GAMES, game) || !Number.isInteger(count) || count < 1 || count > 20) throw new Error("每次请选择1–20组号码");
  const groups = GAMES[game].groups;
  if (locks.length > groups.length) throw new Error("锁定号码与彩种不匹配");
  let combinations = 1;
  const fixed = groups.map((g, i) => {
    const nums = (locks[i] ?? []).filter((n): n is number => n !== null);
    if (nums.length > g.count || nums.some(n => !Number.isInteger(n) || n < g.min || n > g.max) || (g.unique && new Set(nums).size !== nums.length)) throw new Error("锁定号码无效，请重新选择");
    combinations *= g.unique ? choose(g.max - g.min + 1 - nums.length, g.count - nums.length) : nums.length ? 1 : g.max - g.min + 1;
    return nums;
  });
  if (count > combinations) throw new Error(`目前锁定条件最多生成${combinations}组不同号码，请减少组数或解锁号码`);
  const output: Ticket[] = [], seen = new Set<string>();
  for (let attempt = 0; output.length < count && attempt < 10000; attempt++) {
    const numbers = groups.map((g, index) => {
      const nums = [...fixed[index]];
      const pool = Array.from({ length: g.max - g.min + 1 }, (_, i) => i + g.min).filter(n => !nums.includes(n));
      while (nums.length < g.count) { const i = rng(pool.length); if (!Number.isInteger(i) || i < 0 || i >= pool.length) throw new Error("随机数源无效"); nums.push(pool.splice(i, 1)[0]); }
      return g.unique ? nums.sort((a, b) => a - b) : nums;
    });
    const key = JSON.stringify(numbers);
    if (!seen.has(key)) { seen.add(key); output.push({ game, numbers }); }
  }
  if (output.length !== count) throw new Error("本次随机结果重复较多，请重新摇号");
  return output;
}
export function ticketText(t: Ticket): string { return `${GAMES[t.game].name}  ${t.numbers.map((group, i) => group.map(n => GAMES[t.game].groups[i].pad ? String(n).padStart(2, "0") : String(n)).join(" ")).join("  |  ")}`; }
