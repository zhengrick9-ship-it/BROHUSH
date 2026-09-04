# 温度门控决策机制 · 使用说明 (v3.8-local·2026-09-04)

> 一套从"市场温度"到"每日A股综合报告"的完整量化决策流水线。
> **Codex 与 CC 双线复核后本地加固**（2026-09-04）——核心流程回归通过；当前定位为本地研究使用，QDH行情接入和部分组合风控仍有明确边界，见文末 v3.8 说明。

---

## 一、这是什么

每日运行一次，把三层东西合成一份**每日A股综合报告**：
1. **市场温度计** — 全国申万二级行业 + 同花顺题材的热度（判断今天市场冷暖）
2. **温度门控决策机制** — 按温度选策略 → 扫全市场 → 质量核验 → 给候选+仓位
3. **作战计划** — 结合持仓 + 候选的操作要点

**核心思想一句话**：温度管"天"（今天能不能买、用什么策略），策略管"选股"（板块内选哪些个股），质量管"便宜是不是真便宜"。

---

## 二、一键运行

**唯一入口**（在 Hermes 的 scripts 目录）：

```bash
# 全流程（温度计 + 机制 + 报告，一次跑完）
python run_daily_mechanism.py

# 只更新温度计
python run_daily_mechanism.py --stop-after temp

# 跑到机制JSON为止
python run_daily_mechanism.py --stop-after mech

# 只看会执行哪些步骤，不真跑
python run_daily_mechanism.py --dry-run
```

> 用**系统 python** 跑入口即可（只用到标准库），内部计算脚本自动用 **QDataHub venv** 真正执行。

**输出**：
- `G:\HM\hermes-home\reports\每日A股综合报告_<日期>.html`（最终报告，可打开看/发飞书）
- 中间产物见下方"数据流"。

---

## 三、五层流水线（机制核心逻辑）

```
L1 温度 → L2 门控 → L3 策略扫描 → L4 共振+质量核验 → L5 仓位+熔断
```

### L1 温度（thermo_market_conditions.py）
市场盘面温度 0-100，三因子加权（各归一到近60日分位）：
| 因子 | 权重 | 计算 |
|---|---|---|
| 赚钱效应 | 40% | 今天上涨股占比的近60日分位 |
| 量能 | 30% | 今天全市场成交额近20日分位 |
| 情绪 | 30% | 涨停分位 + 跌停反向分位 |

五档：`<20极冷 ｜ 20-40偏冷 ｜ 40-60温和 ｜ 60-80偏热 ｜ >80过热`

### L2 门控（daily_investment_pipeline.py）
温度档决定用哪些策略 + 总仓上限 + 温度系数T：

| 温度档 | 启用策略 | 攻防 | 总仓上限 | T |
|---|---|---|---|---|
| 极冷<20 | 仅低吸龙头 | 防御 | 30% | 0.3 |
| 偏冷20-40 | L3+L1(低吸) | 防御均衡 | 50% | 0.5 |
| 温和40-60 | 全策略 | 进攻均衡 | 75% | 1.0 |
| 偏热60-80 | 只右侧确认 | 进攻 | 70% | 0.8 |
| 过热>80 | 只止盈不加仓 | 防御 | 50% | 0.4 |

### L3 策略扫描（Serenity run_four_strategy_scan）
全市场逐只（约4900只，剔北交所/ST/新股）算MACD+位置+资金流因子，按策略过滤。**L1低位金叉**是偏冷/极冷主用：
- MACD金叉窗口 + 绿柱≥8天 + DIF斜率/加速拐头 + 60日位置<40 + 距250日高点回撤≥20%

### L4 共振 + 质量核验
多策略信号加权（L3=+2 / L1=+1 / LC·Codex共享1.5 / 美股映射+1 / 板块+0.5，追高过热一票否决）+ **QDH真实财务质量核验**：
- 净利yoy>50%（正基数）→ 错杀，升一档
- 净利下滑 → 正确定价，剔除
- 去年亏损今年扭亏 → **扭亏**（中性，不升档，不显示虚高%）
- 中报未披露 → 待验证，剔除

### L5 仓位 + 熔断
单票仓位 = 15% × T × 档位系数；单票≤15%、单行业≤20%、总仓≤门控上限；核心仓V型分批（首笔60%→确认后加40%）。熔断守卫先于推荐执行。

---

## 四、脚本清单 & 数据流

### 核心脚本（`G:\HM\hermes-home\scripts\`）
| 脚本 | 作用 |
|---|---|
| **run_daily_mechanism.py** | 一键入口（串联三步） |
| thermometer_run.py 及 thermo_* 系列 | 市场温度计（热度+CSV） |
| daily_investment_pipeline.py | 机制五层流水线（→ JSON） |
| quality_fn_qdh.py | QDH财务质量判定（错杀/正确定价/扭亏/待验证） |
| generate_daily_report.py | 报告生成器（→ HTML） |

### 调用链 & 产物
```
thermometer_run → cache/thermometer/多窗口_行业.csv、多窗口_主题.csv
daily_investment_pipeline → reports/温度门控机制_<date>.json
generate_daily_report → reports/每日A股综合报告_<date>.html  ←【最终交付】
```

---

## 五、硬件/数据依赖

- **QDataHub venv**：`G:\AI\Project\QDataHub\.venv\Scripts\python.exe`（含 pandas/tushare）
- **QDH 数据**：个股日K（`data_store/daily_by_date/`）、财务表（`data_store/financial/<code>/income.parquet`）
- **Serenity 源头扫描CSV**：`G:\AI\Project\Serenity\runtime_data\reports\20260902_macd_strategy_four_way\current_strategy_candidates_with_industry.csv`（L1候选，带position/斜率/绿柱等因子）
- **tushare token**（温度计拉板块指数日K用）

---

## 六、常见问题 & 纪律

- **候选为0 ？** 先看是不是"偏冷/极冷档 + 质量核验全剔"，这是机制 fail-safe 诚实表现（未核实不荐），不是bug。但若连续多日0且你有把握有错杀，检查 Serenity 扫描CSV是否更新到当日。
- **asof 双轨**：报告中"温度9/3收盘｜策略技术信号9/2收盘"是刻意的诚实标注——源头策略扫描可能比温度晚一天，不重扫候选时如实标注，严禁"幻影对齐"。
- **扭亏 ≠ 错杀**：去年亏损今年扭亏的高yoy%是负基数倒置的虚高，不算"错杀"，只算"扭亏"中性。
- **改造后必须端到端跑一遍**核实输出非空，不能只过代码审查（SSR事故教训：曾因硬编码质量dict把54只候选全误杀成0）。
- 报告只用 **真实3日/1周涨幅**判断板块机会/回避，不用"热度分变化"当涨幅（CC审查定论）。
- **报告/机制纪律（2026-09-04 用户强调）**：报告是**固化产物**，格式/结构必须沿袭 `generate_daily_report.py`（完整CSS+温度三因子+板块+逻辑链+作战计划），**严禁**因数据源变化就临时自创报告脚本/样式。所有机制改动必须记录到本文档并经过CC审查，不得每次临时起意。
- **🚨 策略源头必须每日重跑（2026-09-04 用户抓出的致命缺陷）**：候选来自 Serenity 四策略源头CSV。若源头CSV停在昨天(没重扫全市场)，则无论机制跑几次、温度怎么变，候选永远是同一批——报告就是重复昨日，毫无意义。**铁律：每日必须先重跑 Serenity 四策略扫描(run_four_strategy_scan_X.py, 用当日release/日期生成当日版本)使源头CSV更新到当日，才能跑温度门控机制。** 完整入口见下文"九、每日完整运行流程"。

---

## 七、CC审查记录

- **一轮审**（2026-09-03）：有条件通过 → 抓3必做项（asof双轨 / 扭亏误标错杀 / L3表述澄清）+3建议项（候选口径标注 / 动态取数 / L1权重显式）
- **二轮终审**（2026-09-03）：**完全通过** ✅ —— 6项全部落地，三重交叉验证一致，无致命问题

---

## 八、版本记录（2026-09-04 · 机制固化+文档化）

**v3.6 — 2026-09-04**
- **改动1 · 追溯重述修复**：`skills/trading/lc-strategy-runner/scripts/fin_h1_check.py` 加 `latest_per_end()`（取每个end_date下f_ann_date最新行、含追溯重述）+ 统一归母口径（n_income_attr_p）。修掉中报追溯重述导致净利误判（五粮液被误算-55%，实际+89.3%）。改造后必须端到端重跑验证候选非空。
- **改动2 · 移除演示硬编码**：`daily_investment_pipeline.py` L3 删除 usmap_demo 硬编码（江波龙301308/兆易603986）。报告不含手工/演示标的，只保留真实策略输出。
- **改动3 · 评分分频实证**：9/4 vs 8/31 全市场逐股比对，T变86.6%/R变49.8%/G变39.1%/D变22.3%/V变11.0%。技术面T/R最吃时效每日更，G/V/D也在更新但比例低可降频（非"零变化"）。
- **改动4 · 作战计划动态化(CC复审抓出)**：`generate_daily_report.py` 的 `build_battle_plan()` 原来是硬编码昨日(9/3)整段——日期写死、持仓写死、手工参考表硬编码江波龙/兆易/佰维/工业富联/中科曙光。修复：日期动态(用机制JSON asof)、持仓全景从 current_holdings_accepted_latest.csv 动态读取、**删除手工参考表**(用户明确报告不含手工演示标的)、操作要点基于机制候选+温度档动态生成。
- **改动5 · 逻辑链硬编码动态化 + 源头CSV路径动态化(CC复审N1根治)**：`generate_daily_report.py` chain逻辑链和策略分析的"筛出54只""S分1.5"原来是写死昨天的数字，改为动态读取 Serenity 源头CSV的 L1 候选数 + 机制JSON最终候选数。**并根治N1**：源头CSV目录名原来写死 `20260902_macd_strategy_four_way`，改为 `glob` 动态取最新 `*_macd_strategy_four_way` 目录（generate_daily_report.py 和  daily_investment_pipeline.py 两处都改），否则下个交易日重扫后"54只"会幻影沿用昨日快照。
- **改动6 · 持仓CSV更新到9/4**：根据用户9/4实盘截图，把 current_holdings_accepted_latest.csv 从过期的8/18(含长电/药明/京东方等11只旧持仓) 更新为9/4真实10只持仓(科达/华勤/立讯/中恒/光迅/环旭/拓尔思/飞凯 + 2只创新药ETF)。**教训：持仓CSV必须随用户实盘定期更新，否则报告持仓全景永远显示过期数据。**
- **改动7 · 策略源头每日重扫治理(用户抓出致命缺陷"候选重复昨日")**：根源是 Serenity 四策略源头CSV停在9/2未重扫，导致机制无论温度怎么变候选永远是航锦/哈焊/视觉中国/光云4只。治理：①每日用当日release复制重跑 run_four_strategy_scan_{当日}.py + build_market_context_{当日}.py 生成当日源头CSV(signal_trade_date=当日)②glob已自动取最新目录③README新增「九、每日完整运行流程」固化"源头必须先重扫"纪律④9/4首跑成功:源头更新到9/4(29只候选), 机制输出新候选继峰股份/保变电气(与昨日完全不同)。**铁律：报告候选与昨日相同=源头未更新,禁止出报告。**

---

## 九、每日完整运行流程（2026-09-04 用户确立·机制固化）

**⚠️ 关键认知（用户抓出致命缺陷+CC复认）**：温度计每日自动更新 ≠ 候选每日更新。策略候选来源是 Serenity 四策略源头CSV，**必须每天用当日release重扫全市场**，否则报告候选永远复用昨日、毫无价值。

**每日完整5步（顺序不可乱）：**

```bash
# 0.【今日release确认】查QDH最新release id(当日收盘后:
#    以 data_store/meta/releases/ 下最新 qdh-bj-YYYYMMDDT*.json, 或用评分/发行公告确认)
#    (参考: 9/4 = qdh-bj-20260904T170422)

# 1.【Serenity四策略重扫→ 源头CSV更新到当日】(致命, 必须先做)
#    复制上一交易日 run_four_strategy_scan_XXXXXX.py + build_market_context_XXXXXX.py
#    到 当日_macd_strategy_four_way/ 目录, 改 RELEASE/TARGET_DATE/OUT 为当日, QDH venv跑:
G:\AI\Project\QDataHub\.venv\Scripts\python.exe \
  G:\AI\Project\Serenity\runtime_data\reports\{当日}_macd_strategy_four_way\run_four_strategy_scan_{当日}.py
#    → 产出 current_strategy_candidates.csv(全市场L0-L3候选, signal_trade_date=当日)
#    → 再跑 build_market_context_{当日}.py 生成 _with_industry.csv(带industry列)
#    (确保 current_strategy_candidates_with_industry.csv 的 signal_trade_date=当日)

# 2.【温度计】(可选但建议)
python run_daily_mechanism.py --stop-after temp

# 3.【温度门控机制】(读当日源头CSV)
python run_daily_mechanism.py --stop-after mech

# 4.【报告生成】
python run_daily_mechanism.py --stop-after report   # 或全流程 python run_daily_mechanism.py

# 5.【CC全面审查】(用户要求每次) + 端到端确认候选signal_trade_date=当日
```

**验收标准（防重复昨日）**：
- ✅ 源头 `current_strategy_candidates_with_industry.csv` 的 `signal_trade_date` == 当日
- ✅ 报告的候选与昨日**不同**(形态/资金流/位置每日变化)
- ✅ 若候选与昨日完全一样 → 说明源头没更新，必须重扫后重跑，禁止直接出报告

*v3.6 · 2026-09-04 · 机制固化+改动文档化（用户强调）*

**v3.7 — 2026-09-04 · CC全面审查(不限范围)后修复5缺陷**
- **修复A(高) · 源头build_market_context硬编码旧持仓"三一重工3600@19.10"**：`build_market_context_{日}.py` 原来硬编码 holdings_cost(科达+三一,9/2快照)+holdings_evidence写死9/2，导致holdings_context含非真实持仓三一。改为动态读 current_holdings_accepted_latest.csv(9/4确认10只)。
- **修复B(中) · L0/L1/L3标签映射错误**：`daily_investment_pipeline._load_real_candidates` 原来 L0_SALTLAKE_EXACT 落 else 被误标成"L3"(语义完全不同,L3是资金流+大盘)。修复:含L0/L1/L2/L3全部视为L1低吸族(门控偏冷档白名单含L1)。
- **修复C(低) · 候选重复计数"29只实为28只"**：源头南网科技L0+L1两行重复。修复:`_load_real_candidates` 按 ts_code 去重(保留策略优先级最高的行)。
- **修复D(低) · asof双轨"未重扫候选"错误句式**：源头已重扫到当日(signal_trade_date=当日)时还写"未重扫候选"自我否定。修复:has_rescanned 判断→已重扫则写"已重扫候选至当日"。
- **修复E(中) · 质量门50%单一硬阈值边缘脆弱(海光+49.7%仅差0.3pp被剔)**：记录为已知限制,单期中报归母净利yoy>50%门槛无边际带、无扣非/营收二次校验。**待办**:后续加扣非净利yoy>50%或营收增速>30%双条件。

*v3.7 · 2026-09-04 · CC全面审查修复集成（用户要求每次CC审查）*

**v3.8 — 2026-09-04 · Codex与CC独立复核后本地加固**
- **入口失败即止**：`run_daily_mechanism.py` 对致命步骤立即中止并返回非零码，不再用旧 JSON/旧报告伪装成功。
- **候选日期护栏**：机制流水线要求候选 CSV 全部 `signal_trade_date` 等于温度 as-of，并把源文件、源日期、行数、去重和重复行数写入 `溯源`。
- **报告输入护栏**：报告优先读取 `温度门控机制_<asof>.json`，并校验机制温度、候选源和 JSON 溯源日期一致。
- **财务口径动态化**：按 as-of 仅使用已公告的最新半年/年度数据，与去年同期比较；公告日之后的数据不会进入历史判断。
- **动态叙事**：报告不再写死当日策略分布或具体过期持仓示例，改为从机制 JSON 与候选源生成。
- **版B路径治理**：移除 `20260902` 候选文件硬编码，改读最新日期目录。
- **空候选路径恢复**：门控与当日信号没有交集属于合法空结果，继续输出空候选 JSON；仅上游异常中止并返回非零码。
- **板块日期披露**：板块/主题表显示实际交易日；与机制温度 as-of 不一致时仅作观察，不作为当日门控依据。
- **回归通过**：9/4源头29行、去重28只、温度33°偏冷、最终2只观察候选；机制和报告均成功。

---
*v3.5 · CC完全通过 · 2026-09-03*
