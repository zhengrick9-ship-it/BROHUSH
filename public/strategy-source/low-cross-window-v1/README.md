# 低位金叉窗口策略组 V1

这是一组围绕“低位、DIF 拐头上穿 DEA、即将金叉或刚金叉”的研究策略。四个策略各自独立命名、独立配置，避免把“形态发现”和“可执行过滤”混成一个口径。

## 统一目标

只寻找两类形态：

1. **即将金叉**：按当前 DIF/DEA 斜率估计，未来 1–3 个交易日可能上穿；
2. **刚金叉**：实际发生上穿后的 0–3 个交易日内，且 DIF 与柱体仍向上。

策略不是自动买入信号。所有回测均为研究证据，正式使用前仍需固定参数做滚动样本外验证，并结合公告、流动性、行业景气和个股基本面复核。

## 四个冻结名称

| ID | 名称 | 用途 | 状态 |
|---|---|---|---|
| `L0_SALTLAKE_EXACT` | 盐湖式严格形态 | 保留原来的严格“深跌后刚金叉”口径，作为形态锚点 | 研究基线 |
| `L1_CROSS_WINDOW_PURE` | 金叉窗口纯形态 | 只看 MACD、低位和拐点，扩大形态发现范围 | 发现池，不直接买入 |
| `L2_EARLY_FLOW_MARKET` | 金叉窗口资金大盘基准 | 在形态上叠加资金流、大盘和价格/成交确认，保留上一版收益率最高的策略 | 主基准，待样本外确认 |
| `L3_EARLY_FLOW_MARKET_PLUS` | 金叉窗口筑底增强 | 在 L2 上增加近 5 日不再创新低、单日过热和连续涨停过滤 | 当前优先研究候选 |

## 口径边界

- 研究股票范围：QDataHub accepted release 中的 A 股日线样本；剔除 ST、退市整理、北交所和无法取得完整字段的标的。
- 信号日不使用未来数据；成交假设为信号后第一个交易日的复权开盘价；观察窗口为 5、10、20 个交易日。
- `L1` 的结果显示，纯形态本身并没有形成稳定收益优势，所以它只能用于发现候选，不应替代 L2/L3 的确认过滤。
- 当前回测的研究数据截至 2026-08-28，采用 accepted release `qdh-bj-20260831T174450`；2026-08-31 的钱流字段缺口不影响本次截至 2026-08-28 的样本，但会影响后续实时运行，运行前必须重新检查覆盖率。

## 代码、回测与审计产物

- 代码：`G:\AI\Project\Serenity\runtime_data\reports\20260831_macd_strategy_comparison\run_walkforward.py`
- 代码 SHA-256：`6367aee9d4d5d6ec1318a4ca6161e43a6ae58ae15211eb205edb91e556d49ccc`
- 回测报告：`G:\AI\Project\Serenity\runtime_data\reports\20260901_macd_strategy_comparison_v4\20260831_低位金叉窗口三策略回测与归因.md`
- 回测清单：`G:\AI\Project\Serenity\runtime_data\reports\20260901_macd_strategy_comparison_v4\manifest.json`
- 信号明细：`G:\AI\Project\Serenity\runtime_data\reports\20260901_macd_strategy_comparison_v4\walkforward_signals.csv`
- 机器校验：`G:\AI\Project\Serenity\runtime_data\strategy_research\低位金叉窗口策略组_V1\registry.json`

## 运行方式

四个策略在运行层面彼此独立，实际使用时选择其中一个即可，不需要先跑 L1 再跑 L2/L3。L2 和 L3 共享部分形态条件，且 L3 在规则上是 L2 的收紧子集；这里的“继承”只表示规则继承，不表示执行依赖。

- 选 L0：只研究严格盐湖式刚金叉；
- 选 L1：扩大技术形态召回；
- 选 L2：需要资金和大盘确认；
- 选 L3：需要在 L2 基础上进一步过滤破位和过热。
