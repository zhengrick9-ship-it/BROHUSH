export type Mechanism = {
  id: string;
  name: string;
  short: string;
  purpose: string;
  runtime: string;
  rules: string[];
  result: string;
  recommendation: string;
};

export const mechanisms: Mechanism[] = [
  {
    id: "L0_SALTLAKE_EXACT",
    name: "L0 严格盐湖式形态",
    short: "深跌、长时间低位、明显斜率上穿。",
    purpose: "寻找最接近盐湖股份式的深跌后拐头上穿形态。",
    runtime: "独立运行；只做严格形态筛选。",
    rules: ["刚金叉且金叉年龄不超过 3 个交易日", "250 日回撤至少 30%，前高距离至少 45 个交易日", "60 日位置低于 30%，近 5 日不再创新低", "MACD 斜率、柱体扩张和价格/成交确认同时满足"],
    result: "2026-08-31 收盘无合格信号。",
    recommendation: "适合寻找最纯粹的形态；无信号时不放宽条件冒充结果。"
  },
  {
    id: "L1_CROSS_WINDOW_PURE",
    name: "L1 金叉窗口纯形态",
    short: "扩大技术形态召回，不叠加资金流。",
    purpose: "发现预计 3 日内金叉或刚金叉 3 日内、低位且拐点向上的股票。",
    runtime: "独立运行；输出的是形态发现池，不是直接买入清单。",
    rules: ["预计金叉 1–3 个交易日，或刚金叉 0–3 个交易日", "绿色 MACD 区域至少持续 8 日，且面积和峰值达到门槛", "3 日 DIF 斜率、加速度和柱体扩张满足要求", "60 日位置低于 40%，250 日回撤至少 20%"],
    result: "2026-08-31 收盘命中 48 只；优先研究海光信息，威胜信息与和而泰进入观察池。",
    recommendation: "适合做宽口径发现；必须经过业绩、估值和事件过滤。"
  },
  {
    id: "L2_EARLY_FLOW_MARKET",
    name: "L2 资金大盘基准",
    short: "形态叠加资金流、价格/成交和大盘确认。",
    purpose: "在早期金叉形态中寻找资金与市场环境同步改善的对象。",
    runtime: "独立运行；不需要先运行 L1。",
    rules: ["只保留预计 1–3 个交易日金叉的早期形态", "3 日资金流比例至少 0.8%", "个股近 3 日上涨至少 4%，或成交量显著放大并满足价格约束", "上证指数近 3 日为正，且通过低位与 MACD 方向门槛"],
    result: "2026-08-31 收盘命中中科星图、视觉中国 2 只；基本面复核后均不升级为投资推荐。",
    recommendation: "适合做资金确认基准；资金流是代理变量，不能替代基本面。"
  },
  {
    id: "L3_EARLY_FLOW_MARKET_PLUS",
    name: "L3 筑底增强",
    short: "L2 基础上过滤仍在破位和短线过热。",
    purpose: "只保留资金、市场和形态同时确认，并已出现筑底迹象的对象。",
    runtime: "独立运行；规则上收紧 L2，但不依赖 L2 的运行结果。",
    rules: ["满足 L2 的形态、资金、价格/成交和大盘条件", "最近 5 日不再创新低", "单日涨幅不过热，且连续涨停运行不超过 1 日", "任何一项硬条件不满足，都不进入推荐池"],
    result: "2026-08-31 收盘无合格信号；L2 两只命中对象均因近 5 日仍创新低被剔除。",
    recommendation: "适合做更严格的交易候选；宁缺毋滥，不为了得到名单而降低门槛。"
  }
];

export const mechanismById = Object.fromEntries(mechanisms.map((item) => [item.id, item])) as Record<string, Mechanism>;
