# Codex 接手手记 —— A股温度门控机制 v3.7

> 交接时间：2026-09-04 晚间
> 上一棒：Hermes 已完成遇制核心根治 + CC 全面审查 + 机制固化到 v3.7
> 你的任务：接手后阅读本文件 → 继续完善机制

---

## 一、机制一句话

**温度门控决策机制**：每天量市场温度 → 按温度门控选策略(四策略) → 
Serenity四策略源头每天重扫全市场 → 质量核验(QDH真实财务) → 仓位 → 生成 `每日A股综合报告_<date>.html`。

## 二、当前致命缺陷【已根治】怎么修好的

你接手的仓库已修复"候选重复昨日"的机制死穴：
- **根因**：策略候选源头CSV停在9/2没重扫，机制无论跑几次都复用9/2快照。
- **修复**：新增 `run_four_strategy_scan_20260904.py` + `build_market_context_20260904.py`，用当日release重扫全市场，
  源头CSV (`current_strategy_candidates_with_industry.csv`) 的 `signal_trade_date` 已到 **20260904**，候选29只全部是当日新形态。
- **固化**：README 新增「九、每日完整运行流程」，写死"先重扫源头→再跑机制→候选不同才出报告"。

## 三、文件地图（关键路径）

### 📍 主仓库 `G:\HM\hermes-home\scripts\`
| 文件 | 作用 | 状态 |
|---|---|---|
| `README_温度门控机制.md` | **机制固化文档 v3.7**（入口先读这个）| ✅ 最新|
| `run_daily_mechanism.py` | 一键入口：温度→机制→报告 三步 | ✅ |
| `daily_investment_pipeline.py` | 机制流水线（门控+策略+质量核验）| ✅ 已修标签/去重/删硬编码 |
| `generate_daily_report.py` | 报告生成器（禁自创格式）| ✅ 已修作战计划/动态持仓/动态候选数 |
| `thermometer_run.py` | 市场温度计 | ✅ |
| `thermometer_viz_v2.py` + `build_versionB.py` | 温度地图 | ✅ 已修d3误判 |
| `quality_fn_qdh.py` | QDH真实财务质量核验 | ✅ |
| `unified_strategy_v2.0.py` | LC低位策略 v4.4 | ✅ |
| `fin_h1_check.py` / `verify_restatement_fix.py` | 中报追溯重述修复+验证 | ✅ |

### 📍 Serenity 四策略源头 `G:\AI\Project\Serenity\runtime_data\reports\`
| 路径 | 说明 |
|---|---|
| `20260904_macd_strategy_four_way/run_four_strategy_scan_20260904.py` | 今日重扫脚本(全市场L0-L3) |
| `20260904_macd_strategy_four_way/build_market_context_20260904.py` | 生成with_industry+holdings_context |
| `20260904_macd_strategy_four_way/current_strategy_candidates_with_industry.csv` | **源头候选CSV，signal_trade_date=20260904，29只** |
| `20260902_macd_strategy_four_way/` | 昨日旧版(参考) |

### 📍 报告与数据 `G:\HM\hermes-home\`
| 路径 | 说明 |
|---|---|
| `reports\每日A股综合报告_20260904.html` | **最新完整报告**(114KB,新候选继峰/保变) |
| `runtime_data\qdatahub\full_scoring_v4.parquet` | 全市场五维评分,asof=9/4 |
| `runtime_data\qdatahub\current_holdings_accepted_latest.csv` | **真实持仓10只(9/4截图确认)** |
| `cache\thermometer\多窗口_行业.csv` + `多窗口_主题.csv` | 温度地图数据 |

## 四、每日运行5步（Codex 接手后按这个跑）

```bash
# 0. 确认今日QDH release id(最新 qdh-bj-YYYYMMDDT*.json)
# 1. 复制上一日 run_four_strategy_scan + build_market_context 到 当日目录,改日期参数,QDH venv跑
#    → 源头 current_strategy_candidates_with_industry.csv signal_trade_date==当日
# 2. python run_daily_mechanism.py --stop-after temp   (温度计)
# 3. python run_daily_mechanism.py --stop-after mech   (机制JSON)
# 4. python run_daily_mechanism.py                      (全流程,出报告)
# 5. CC全面审查(不限范围) + 端到端确认候选signal_trade_date==当日
```

## 五、CC 全面审查(不限范围)已抓到并修复的5缺陷(v3.7)

- **A(高)** 源头build硬编码"三一重工3600@19.10"旧持仓 → 改动态读持仓CSV ✅
- **B(中)** 南网科技L0被误标"L3"标签 → 改含L0/L1/L2/L3全归L1低吸族 ✅
- **C(低)** 候选重复计数"29实为28" → 按ts_code去重,报告改"筛出28只" ✅
- **D(低)** asof句式"未重扫候选"自我否定 → 已重扫则标"已重扫候选至当日" ✅
- **E(中)** 质量门50%单一硬阈值边缘脆弱(海光+49.7%被剔) → 记录为已知限制,待办:加扣非+营收双条件

## 六、9/4当日策略结论(供参考)

- **新候选(错杀观察档)**：继峰股份(+137.3%)、保变电气(+77.3%) —— CC复认"错杀"判定真实可信
- **回避**：光启/乖宝/佳驰/虹软(业绩下滑)、幸福蓝海/中航高科/广西能源(V1名不符实)、黄金三雄(82°高温)
- **市场温度**：33°偏冷(Δ12,赚钱效应43.2%,涨停42/跌停13)

## 七、已知待办(Codex可继续完善)

1. **机制E待办**：质量门50%阈值加"扣非净利yoy>50%或营收增速>30%"双条件(现在单期净利单维度边缘脆弱)
2. **评分分频方案落地**：CC建议 T每日更新、G/V/D可降频、R每日+降噪(33档→5档)
3. **持仓CSV**：确认截图是否含未截的持仓(当前10只+2ETF)

## 八、纪律铁律(别违反)

- 报告格式**禁止自创**，必须沿袭 `generate_daily_report.py`
- 每次改动**必须**派CC对抗性审查(不限范围)
- 候选源头**必须每日重扫**,禁止复用昨日快照出报告
- 所有改动**必须**记入 README 版本记录
- build_market_context 的 holdings**禁止硬编码**,动态读持仓CSV

## 九、v3.8（2026-09-04，Codex接管后本地加固）

- 入口遇到致命步骤失败立即中止，并返回非零退出码；不再继续调用报告生成器，也不把历史报告冒充为本次结果。
- 机制流水线强制校验候选源 `signal_trade_date` 为单一日期且等于温度 as-of；机制 JSON 增加源文件、源日期、原始行数、去重数和重复行数溯源。
- 机制 JSON 改用生产命名 `温度门控机制_<asof>.json`；报告生成器优先读取生产命名，并校验机制、候选源和溯源日期一致。
- 财务质量门按 as-of 选择已经公告的最新半年/年度报告，报告口径与机制复用同一动态期段，避免硬编码 20260630/20250630 长期滞留。
- 报告策略链的源头策略分布、候选来源、质量分布和作战纪律改为动态生成；移除过期的具体持仓示例。
- 版B遗留入口不再读取写死的 20260902 候选路径，改为读取最新日期目录。
- 合法空候选修复：门控白名单与当日源头无交集时保留空候选 JSON；只有上游异常（`None`）才非零退出，极冷/偏热日仍能生成诚实的空结果报告。
- 板块/主题缓存交易日落入报告标题和提示；若与机制温度 as-of 不一致，明确标注为观察数据，不参与当日门控。
- 9/4回归：机制温度33°偏冷，源头29行/去重28只，最终保变电气、继峰股份2只观察候选；机制和报告生成均成功。
