# QDataHub read-only access contract

- Owner/project: QDataHub
- Authority root: `G:\AI\Data\QDataHub\data_store` (read-only; never write, move, delete, rename, or copy authoritative data)
- QDataHub project/docs: `G:\AI\Project\QDataHub`
- Pinned accepted release for the published 2026-08-31 run: `qdh-bj-20260831T224529`
- Latest complete trade date: `20260831`
- Use only `qdata.DataClient` or `G:\AI\Project\QDataHub\scripts\qdata_cli.py` with absolute paths.
- Relevant datasets: `market.a_share.daily`, `market.a_share.daily_basic`,
  `market.a_share.adjustment_factor`, `market.a_share.price_limit`,
  `market.a_share.moneyflow`; use only documented fields needed for daily OHLCV, adjustment,
  valuation and money-flow checks.
- Date/symbol scope: full A-share daily history available to the accepted release, as-of
  `20260831`; use the existing 4,970-row scored universe as the starting symbol list and do
  not expand scope by recursively scanning storage.
- For MACD, use front-adjusted/scalar-normalized daily close and a consistent EMA
  initialization; preserve point-in-time dates and do not use later statements or news.
- Writes are allowed only inside this task directory. Derived CSV/JSON/MD outputs belong here.
- Do not use Tushare, web data, legacy `index_daily`, parent-relative paths, or historical
  files as substitutes. Do not report staging as accepted data.
- If access fails, preserve command, absolute path, exit code, and exception exactly.
