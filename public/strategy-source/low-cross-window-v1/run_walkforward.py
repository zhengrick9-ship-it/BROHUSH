# coding: utf-8
"""Walk-forward comparison for three low-turn MACD research strategies.

Research only.  Signals use the close of t; outcomes assume entry at t+1 open
and exit at the close of t+5/t+10/t+20.  QDataHub is read-only.
"""
from __future__ import annotations

import hashlib
import json
import sys
import gc
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(r"G:\AI\Project\Serenity")
QDH_SRC = Path(r"G:\AI\Project\QDataHub\src")
OUT = ROOT / "runtime_data" / "reports" / "20260901_macd_strategy_comparison_v4"
UNIVERSE = ROOT / "runtime_data" / "strategy_runs" / "20260826_multi_strategy" / "technical_v2_run2" / "all_scored.csv"
RELEASE = "qdh-bj-20260831T174450"
START = "20250101"
SIGNAL_START = "20260202"
SIGNAL_END = "20260807"  # leaves twenty complete trading sessions through 20260828
DATA_END = "20260828"     # latest date with money-flow data available for this study
COOLDOWN = 10

sys.path.insert(0, str(QDH_SRC))
from qdata import DataClient  # noqa: E402


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def run_metrics(signals: pd.DataFrame, index_close: pd.Series) -> pd.DataFrame:
    rows: list[dict] = []
    for strategy, g in signals.groupby("strategy"):
        rec: dict[str, object] = {"strategy": strategy, "signals": int(len(g)), "unique_stocks": int(g.ts_code.nunique())}
        for h in (5, 10, 20):
            r = pd.to_numeric(g[f"ret_{h}d"], errors="coerce").dropna()
            x = pd.to_numeric(g[f"excess_{h}d"], errors="coerce").dropna()
            dd = pd.to_numeric(g[f"mdd_{h}d"], errors="coerce").dropna()
            rec.update({
                f"n_{h}d": int(len(r)), f"mean_{h}d_pct": round(float(r.mean() * 100), 3),
                f"median_{h}d_pct": round(float(r.median() * 100), 3),
                f"win_{h}d_pct": round(float((r > 0).mean() * 100), 2),
                f"excess_mean_{h}d_pct": round(float(x.mean() * 100), 3),
                f"excess_win_{h}d_pct": round(float((x > 0).mean() * 100), 2),
                f"p25_{h}d_pct": round(float(r.quantile(.25) * 100), 3),
                f"mean_mdd_{h}d_pct": round(float(dd.mean() * 100), 3),
            })
        rows.append(rec)
    return pd.DataFrame(rows)


def add_outcomes(rows: list[dict], symbol: str, dates: np.ndarray, open_adj: np.ndarray, close_adj: np.ndarray, low_adj: np.ndarray, index_map: dict[str, float]) -> list[dict]:
    resolved: list[dict] = []
    for r in rows:
        i = r.pop("_i")
        entry_i = i + 1
        if entry_i >= len(dates) or not np.isfinite(open_adj[entry_i]) or open_adj[entry_i] <= 0:
            continue
        entry = float(open_adj[entry_i])
        r["entry_trade_date"] = str(dates[entry_i])
        r["entry_adj_open"] = entry
        for h in (5, 10, 20):
            exit_i = i + h
            if exit_i >= len(dates) or not np.isfinite(close_adj[exit_i]):
                r[f"ret_{h}d"] = np.nan; r[f"excess_{h}d"] = np.nan; r[f"mdd_{h}d"] = np.nan
                continue
            ret = float(close_adj[exit_i] / entry - 1.0)
            date0, date1 = str(dates[i]), str(dates[exit_i])
            idx0, idx1 = index_map.get(date0), index_map.get(date1)
            benchmark = np.nan if not idx0 or not idx1 else float(idx1 / idx0 - 1.0)
            r[f"ret_{h}d"] = ret
            r[f"excess_{h}d"] = np.nan if not np.isfinite(benchmark) else ret - benchmark
            window_low = low_adj[entry_i:exit_i + 1]
            r[f"mdd_{h}d"] = float(np.nanmin(window_low) / entry - 1.0)
        resolved.append(r)
    return resolved


def one_symbol(frame: pd.DataFrame, flow: pd.DataFrame, limits: pd.DataFrame, name: str, index_map: dict[str, float], index_r3_map: dict[str, float]) -> list[dict]:
    d = frame.sort_values("trade_date").drop_duplicates("trade_date").reset_index(drop=True).copy()
    if len(d) < 270:
        return []
    dates = d.trade_date.astype(str).to_numpy()
    close = pd.to_numeric(d.close, errors="coerce").to_numpy(float)
    op = pd.to_numeric(d.open, errors="coerce").to_numpy(float)
    low = pd.to_numeric(d.low, errors="coerce").to_numpy(float)
    pct_chg = pd.to_numeric(d.pct_chg, errors="coerce").to_numpy(float)
    af = pd.to_numeric(d.adj_factor, errors="coerce").fillna(1.0).to_numpy(float)
    # a single scaling constant does not change crossover geometry or returns.
    adj = close * af / af[-1]; open_adj = op * af / af[-1]; low_adj = low * af / af[-1]
    vol = pd.to_numeric(d.vol, errors="coerce").fillna(0.0).to_numpy(float)
    amount = pd.to_numeric(d.amount, errors="coerce").fillna(0.0).to_numpy(float)
    c = pd.Series(adj)
    dif = (c.ewm(span=12, adjust=False).mean() - c.ewm(span=26, adjust=False).mean()).to_numpy()
    dea = pd.Series(dif).ewm(span=9, adjust=False).mean().to_numpy()
    hist = 2.0 * (dif - dea)
    mf = flow.set_index("trade_date")["net_mf_amount"].to_dict() if len(flow) else {}
    net = np.array([float(mf.get(day, np.nan)) for day in dates])
    limit_map = {}
    if len(limits):
        limit_map = {str(row.trade_date): float(row.up_limit) for row in limits.itertuples(index=False) if np.isfinite(float(row.up_limit))}
    up_limits = np.array([limit_map.get(day, np.nan) for day in dates])
    limit_flags = np.isfinite(up_limits) & np.isfinite(close) & (close >= up_limits * 0.995)
    symbol = str(d.ts_code.iloc[0])
    selected: dict[str, int] = {"pure_shape_window": -999, "early_turn_flow_market": -999, "early_turn_flow_market_plus": -999}
    pending: list[dict] = []
    for i in range(250, len(dates) - 20):
        if not (SIGNAL_START <= dates[i] <= SIGNAL_END):
            continue
        last = adj[i]
        if not np.isfinite(last) or last <= 0:
            continue
        dd250 = (np.nanmax(adj[i-249:i+1]) - last) / np.nanmax(adj[i-249:i+1]) * 100
        lo60, hi60 = np.nanmin(adj[i-59:i+1]), np.nanmax(adj[i-59:i+1])
        pos60 = (last - lo60) / max(hi60 - lo60, 1e-12) * 100
        slope3 = (dif[i] - dif[i-3]) / last / 3 * 100
        slope5 = (dif[i] - dif[i-5]) / last / 5 * 100
        slope10 = (dif[i] - dif[i-10]) / last / 10 * 100
        accel = slope3 - slope10
        hist_expand = (hist[i] - hist[i-3]) / last / 3 * 100
        # Consecutive green histogram ending at t (for pending) or t-1 (for a fresh cross).
        def green_stats(end: int) -> tuple[int, float, float]:
            vals: list[float] = []
            j = end
            while j >= 0 and hist[j] < 0:
                vals.append(abs(hist[j]) / last * 100); j -= 1
            return len(vals), (max(vals) if vals else 0.0), float(sum(vals))
        is_just = dif[i] > dea[i] and dif[i-1] <= dea[i-1] and hist[i] > hist[i-1]
        is_pending = dif[i] <= dea[i] and dif[i] > dif[i-1] and hist[i] > hist[i-1] > hist[i-2]
        gap = max(dea[i] - dif[i], 0.0) / last * 100
        prev_gap = max(dea[i-1] - dif[i-1], 0.0) / last * 100
        convergence = prev_gap - gap
        predicted = gap / convergence if convergence > 0 else 999.0
        gd, gp, ga = green_stats(i-1 if is_just else i)
        r3 = (adj[i] / adj[i-3] - 1) * 100
        vr = vol[i] / max(np.nanmean(vol[i-20:i]), 1e-12)
        # The range excludes both flat/no-confirmation shapes and the kind of
        # already-vertical, delayed entry that this research is meant to avoid.
        price_or_vol = (0.5 <= r3 <= 8.0) or (1.3 <= vr <= 3.0 and r3 <= 8.0)
        # B/C only see completed data through t.  B deliberately allows seven
        # negative-histogram sessions so it can retain a 信捷电气-style early turn.
        early = is_pending and predicted <= 3 and gd >= 7 and gp >= 1 and ga >= 8 and slope3 >= .03 and accel >= .04 and hist_expand >= .20 and pos60 < 30 and dd250 >= 20 and price_or_vol
        # A waits for a confirmed first cross, but still demands a meaningful
        # preceding weak phase and excludes high-position/late momentum crosses.
        strict = is_just and gd >= 12 and gp >= 1 and ga >= 10 and slope3 >= .08 and accel >= .04 and hist_expand >= .15 and pos60 < 45 and dd250 >= 20 and 0.5 <= r3 <= 8.0 and vr <= 3.0
        flow3 = np.nansum(net[i-2:i+1]); amount3 = np.nansum(amount[i-2:i+1]); flow_ratio = flow3 / amount3 if amount3 > 0 else np.nan
        market_r3 = index_r3_map.get(str(dates[i]), np.nan)
        # C is intentionally not a "stronger MACD" list. It is an early-turn
        # candidate with active net inflow, controlled price confirmation, and
        # a non-adverse three-day broad-market tape.
        # Pure shape window: pending 1-3 sessions or actual cross 0-3 sessions.
        # It does not use money flow, market state, or a price confirmation.
        pure_shape = (is_pending or is_just) and gd >= 8 and gp >= 1 and ga >= 8 and slope3 >= .03 and accel >= .04 and hist_expand >= .20 and pos60 < 40 and dd250 >= 20
        flow_confirmed = early and np.isfinite(flow_ratio) and flow_ratio >= .008 and r3 >= 4.0 and np.isfinite(market_r3) and market_r3 > 0
        # Base stability uses adjusted intraday lows. A 1% tolerance allows a
        # normal final shakeout while rejecting a renewed material breakdown.
        last5_low = float(np.nanmin(low_adj[i-4:i+1]))
        prior5_low = float(np.nanmin(low_adj[i-9:i-4]))
        no_new_low_5 = last5_low >= prior5_low * .99 if np.isfinite(last5_low) and np.isfinite(prior5_low) else False
        limit_pct = (up_limits[i] / float(d.pre_close.iloc[i]) - 1.0) * 100.0 if np.isfinite(up_limits[i]) and float(d.pre_close.iloc[i]) > 0 else np.nan
        heat_ratio = pct_chg[i] / limit_pct if np.isfinite(pct_chg[i]) and np.isfinite(limit_pct) and limit_pct > 0 else np.nan
        run = 0
        j = i
        while j >= 0 and limit_flags[j]:
            run += 1; j -= 1
        not_overheated = (not np.isfinite(heat_ratio) or heat_ratio < .80) and run < 2
        improved_flow = flow_confirmed and no_new_low_5 and not_overheated
        base = {"ts_code": symbol, "name": name, "signal_trade_date": str(dates[i]), "signal_state": "pending" if is_pending else "just_cross", "dd250": dd250, "pos60": pos60, "green_days": gd, "green_peak_pct": gp, "green_area_pct": ga, "slope3_pct": slope3, "slope5_pct": slope5, "slope_accel_pct": accel, "hist_expand_pct": hist_expand, "predicted_cross_days": predicted, "r3_pct": r3, "daily_pct": pct_chg[i], "vol_ratio": vr, "flow3_ratio": flow_ratio, "market_r3_pct": market_r3 * 100 if np.isfinite(market_r3) else np.nan, "no_new_low_5": no_new_low_5, "limit_pct": limit_pct, "heat_ratio": heat_ratio, "consecutive_limit_up": run}
        for strategy, passed in (("pure_shape_window", pure_shape), ("early_turn_flow_market", flow_confirmed), ("early_turn_flow_market_plus", improved_flow)):
            if passed and i - selected[strategy] >= COOLDOWN:
                selected[strategy] = i
                pending.append({**base, "strategy": strategy, "_i": i})
    return add_outcomes(pending, symbol, dates, open_adj, adj, low_adj, index_map)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    universe = pd.read_csv(UNIVERSE, dtype={"symbol": str})
    symbols = universe.symbol.dropna().astype(str).drop_duplicates().tolist()
    names = dict(zip(universe.symbol.astype(str), universe.name.fillna("").astype(str)))
    client = DataClient(project="Serenity-macd-three-strategy-backtest", release_id=RELEASE, runtime_root=OUT)
    # The QDH factor dataset is symbol-partitioned.  Keep this streaming: holding
    # all 5,000+ symbol frames at once can exhaust memory before the test begins.
    # Each chunk is read, scored, and released before moving to the next chunk.
    all_rows: list[dict] = []
    factor_rows = 0
    moneyflow_rows = 0
    flow_coverage: dict[str, int] = {}
    idx = client.index.daily(symbols=["000001.SH"], start_date=START, end_date=DATA_END)
    idx["trade_date"] = idx.trade_date.astype(str)
    idx["close"] = pd.to_numeric(idx.close, errors="coerce")
    idx["r3"] = idx.close.pct_change(3)
    index_map = dict(zip(idx.trade_date, idx.close))
    index_r3_map = dict(zip(idx.trade_date, idx.r3))
    for n, start in enumerate(range(0, len(symbols), 600), 1):
        chunk = symbols[start:start+600]
        factor = client.market.stk_factor(symbols=chunk, start_date=START, end_date=DATA_END)
        money = client.market.moneyflow(symbols=chunk, start_date=START, end_date=DATA_END)
        limits = client.market.price_limits(start_date=START, end_date=DATA_END, symbols=chunk)
        for x in (factor, money):
            x["ts_code"] = x.ts_code.astype(str)
            x["trade_date"] = x.trade_date.astype(str)
        if len(limits):
            limits["ts_code"] = limits.ts_code.astype(str)
            limits["trade_date"] = limits.trade_date.astype(str)
        factor_rows += len(factor)
        moneyflow_rows += len(money)
        for day, count in money.groupby("trade_date").ts_code.nunique().items():
            flow_coverage[str(day)] = flow_coverage.get(str(day), 0) + int(count)
        flow_groups = {s: x for s, x in money.groupby("ts_code")}
        limit_groups = {s: x for s, x in limits.groupby("ts_code")} if len(limits) else {}
        for s, frame in factor.groupby("ts_code"):
            all_rows.extend(one_symbol(frame, flow_groups.get(s, pd.DataFrame(columns=["trade_date", "net_mf_amount"])), limit_groups.get(s, pd.DataFrame(columns=["trade_date", "up_limit"])), names.get(s, ""), index_map, index_r3_map))
        print(f"loaded and scored {min(start+600, len(symbols))}/{len(symbols)}")
        del factor, money, limits, flow_groups, limit_groups
        gc.collect()
    signals = pd.DataFrame(all_rows)
    signals.to_csv(OUT / "walkforward_signals.csv", index=False, encoding="utf-8-sig")
    metrics = run_metrics(signals, pd.Series(index_map))
    metrics.to_csv(OUT / "strategy_metrics.csv", index=False, encoding="utf-8-sig")
    coverage = pd.DataFrame(sorted(flow_coverage.items()), columns=["trade_date", "moneyflow_symbols"])
    coverage.to_csv(OUT / "moneyflow_coverage.csv", index=False, encoding="utf-8-sig")
    manifest = {"experiment": "v4_unified_cross_window_with_baseline_and_heat_filter", "release_id": RELEASE, "data_start": START, "data_end": DATA_END, "signal_start": SIGNAL_START, "signal_end": SIGNAL_END, "entry": "t+1 adjusted open", "exits": "t+5/t+10/t+20 adjusted close", "cooldown_sessions": COOLDOWN, "strategies": {"pure_shape_window": "pending predicted<=3 or actual cross age<=3; MACD/low-position gates only", "early_turn_flow_market": "previous best baseline: pending only; flow3_ratio>=0.008; r3_pct>=4; SSE 3d return>0", "early_turn_flow_market_plus": "baseline plus adjusted-low base stability and dynamic heat/continuous-limit-up exclusions"}, "heat_filter": "single-day heat_ratio<0.80 when limit data available; consecutive limit-up run<2; recent 5-session adjusted intraday low >= prior 5-session low*0.99", "universe_rows": int(len(symbols)), "factor_rows": int(factor_rows), "moneyflow_rows": int(moneyflow_rows), "signals": int(len(signals)), "code_sha256": sha256(Path(__file__))}
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(metrics.to_string(index=False))


if __name__ == "__main__":
    main()
