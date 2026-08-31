# coding: utf-8
"""Current-close signal scan for the frozen low MACD cross strategies.

Research only.  Uses today's close when present.  Money-flow strategies are
also emitted with a lagged-flow flag when the latest accepted money-flow day
is older than today's close; those rows are not equivalent to a fully current
signal.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(r"G:\AI\Project\Serenity")
QDH_SRC = Path(r"G:\AI\Project\QDataHub\src")
OUT = ROOT / "runtime_data" / "reports" / "20260831_macd_strategy_current"
UNIVERSE = ROOT / "runtime_data" / "strategy_runs" / "20260826_multi_strategy" / "technical_v2_run2" / "all_scored.csv"
RELEASE = "qdh-bj-20260831T224529"
START = "20250101"
END = "20260831"
TARGET_DATE = "20260831"

sys.path.insert(0, str(QDH_SRC))
from qdata import DataClient  # noqa: E402


def clip01(x: float) -> float:
    return float(np.clip(x, 0.0, 1.0)) if np.isfinite(x) else 0.0


def shape_score(r: dict) -> float:
    """Pre-trade ordering score; not part of the boolean strategy gates."""
    parts = [
        clip01(float(r["slope3_pct"]) / 0.20),
        clip01(float(r["slope_accel_pct"]) / 0.15),
        clip01(float(r["hist_expand_pct"]) / 0.40),
        clip01(float(r["green_peak_pct"]) / 3.0),
        clip01(float(r["green_area_pct"]) / 15.0),
        1.0 - clip01(float(r["pos60"]) / 40.0),
        clip01(float(r["dd250"]) / 50.0),
    ]
    return round(sum(parts) / len(parts) * 100.0, 2)


def green_stats(hist: np.ndarray, end: int, last: float) -> tuple[int, float, float]:
    vals: list[float] = []
    j = end
    while j >= 0 and hist[j] < 0:
        vals.append(abs(float(hist[j])) / last * 100.0)
        j -= 1
    return len(vals), max(vals) if vals else 0.0, sum(vals)


def last_up_cross(dif: np.ndarray, dea: np.ndarray, i: int) -> int | None:
    idx = np.where((dif[1:i + 1] > dea[1:i + 1]) & (dif[:i] <= dea[:i]))[0]
    return int(idx[-1] + 1) if len(idx) else None


def scan_one(frame: pd.DataFrame, flow: pd.DataFrame, limits: pd.DataFrame, name: str, index_close: dict[str, float], index_r3: dict[str, float]) -> list[dict]:
    d = frame.sort_values("trade_date").drop_duplicates("trade_date").reset_index(drop=True)
    if len(d) < 270 or str(d.trade_date.iloc[-1]) != TARGET_DATE:
        return []
    dates = d.trade_date.astype(str).to_numpy()
    close = pd.to_numeric(d.close, errors="coerce").to_numpy(float)
    low = pd.to_numeric(d.low, errors="coerce").to_numpy(float)
    pre_close = pd.to_numeric(d.pre_close, errors="coerce").to_numpy(float)
    pct = pd.to_numeric(d.pct_chg, errors="coerce").to_numpy(float)
    vol = pd.to_numeric(d.vol, errors="coerce").fillna(0.0).to_numpy(float)
    af = pd.to_numeric(d.adj_factor, errors="coerce").fillna(1.0).to_numpy(float)
    adj = close * af / af[-1]
    low_adj = low * af / af[-1]
    if not np.isfinite(adj[-1]) or adj[-1] <= 0:
        return []
    i = len(dates) - 1
    last = float(adj[-1])
    c = pd.Series(adj)
    dif = (c.ewm(span=12, adjust=False).mean() - c.ewm(span=26, adjust=False).mean()).to_numpy(float)
    dea = pd.Series(dif).ewm(span=9, adjust=False).mean().to_numpy(float)
    hist = 2.0 * (dif - dea)
    cross = last_up_cross(dif, dea, i)
    cross_age = i - cross if cross is not None else 999
    is_just_window = cross is not None and cross_age <= 3 and dif[i] > dea[i] and hist[i] > hist[i - 1]
    gap = max(float(dea[i] - dif[i]), 0.0) / last * 100.0
    prev_gap = max(float(dea[i - 1] - dif[i - 1]), 0.0) / last * 100.0
    convergence = prev_gap - gap
    predicted = gap / convergence if convergence > 0 else 999.0
    is_pending = dif[i] <= dea[i] and dif[i] > dif[i - 1] and hist[i] > hist[i - 1] > hist[i - 2] and predicted <= 3.0
    green_end = cross - 1 if is_just_window and cross is not None else i
    gd, gp, ga = green_stats(hist, green_end, last)
    dd250 = (np.nanmax(adj[i - 249:i + 1]) - last) / np.nanmax(adj[i - 249:i + 1]) * 100.0
    lo60, hi60 = np.nanmin(adj[i - 59:i + 1]), np.nanmax(adj[i - 59:i + 1])
    pos60 = (last - lo60) / max(hi60 - lo60, 1e-12) * 100.0
    high_age = i - int(np.argmax(adj[i - 249:i + 1]))
    stable = np.nanmin(adj[i - 4:i + 1]) >= np.nanmin(adj[i - 59:i - 4]) * 0.99
    slope3 = (dif[i] - dif[i - 3]) / last / 3 * 100.0
    slope5 = (dif[i] - dif[i - 5]) / last / 5 * 100.0
    slope10 = (dif[i] - dif[i - 10]) / last / 10 * 100.0
    accel = slope5 - slope10
    hist_expand = (hist[i] - hist[i - 3]) / last / 3 * 100.0
    r3 = (adj[i] / adj[i - 3] - 1.0) * 100.0
    vr = vol[i] / max(np.nanmean(vol[i - 20:i]), 1e-12)
    price_or_vol = 0.5 <= r3 <= 8.0 or (1.3 <= vr <= 3.0 and r3 <= 8.0)
    amount_map = {str(day): float(value) for day, value in zip(dates, pd.to_numeric(d.amount, errors="coerce").to_numpy(float))}
    flow_map = {str(x.trade_date): float(x.net_mf_amount) for x in flow.itertuples(index=False) if np.isfinite(float(x.net_mf_amount))}
    def flow_window(lag: int) -> tuple[float, bool, str]:
        end_i = i - lag
        win_dates = dates[end_i - 2:end_i + 1]
        vals = [(flow_map.get(str(day)), amount_map.get(str(day))) for day in win_dates]
        complete = all(v[0] is not None and v[1] is not None and v[1] > 0 for v in vals)
        ratio = (sum(v[0] for v in vals) / sum(v[1] for v in vals)) if complete else np.nan
        return ratio, complete, str(win_dates[-1])
    current_flow, current_complete, current_flow_asof = flow_window(0)
    lag_flow, lag_complete, lag_flow_asof = flow_window(1)
    market_r3 = float(index_r3.get(TARGET_DATE, np.nan)) * 100.0
    last5_low = float(np.nanmin(low_adj[i - 4:i + 1])); prior5_low = float(np.nanmin(low_adj[i - 9:i - 4]))
    no_new_low_5 = bool(last5_low >= prior5_low * 0.99) if np.isfinite(last5_low) and np.isfinite(prior5_low) else False
    limit_map = {str(x.trade_date): float(x.up_limit) for x in limits.itertuples(index=False) if np.isfinite(float(x.up_limit))}
    limit_pct = (limit_map.get(TARGET_DATE, np.nan) / pre_close[i] - 1.0) * 100.0 if pre_close[i] > 0 and TARGET_DATE in limit_map else np.nan
    heat = pct[i] / limit_pct if np.isfinite(limit_pct) and limit_pct > 0 else np.nan
    run = 0
    for j in range(i, -1, -1):
        up = limit_map.get(str(dates[j]))
        if up is None or not np.isfinite(up) or close[j] < up * 0.995:
            break
        run += 1
    not_overheated = (not np.isfinite(heat) or heat < 0.80) and run < 2
    base = {
        "ts_code": str(d.ts_code.iloc[0]), "name": name, "signal_trade_date": TARGET_DATE,
        "signal_state": "just_cross" if is_just_window else ("pending" if is_pending else "other"),
        "cross_age": cross_age, "predicted_cross_days": round(predicted, 3), "dd250": round(dd250, 3),
        "high_age": high_age, "pos60": round(pos60, 3), "stable": stable, "green_days": gd,
        "green_peak_pct": round(gp, 3), "green_area_pct": round(ga, 3), "slope3_pct": round(slope3, 4),
        "slope_accel_pct": round(accel, 4), "hist_expand_pct": round(hist_expand, 4), "r3_pct": round(r3, 3),
        "daily_pct": round(float(pct[i]), 3), "vol_ratio": round(float(vr), 3), "market_r3_pct": round(market_r3, 3),
        "flow3_ratio_current": current_flow, "flow3_complete_current": current_complete, "flow_asof_current": current_flow_asof,
        "flow3_ratio_lagged": lag_flow, "flow3_complete_lagged": lag_complete, "flow_asof_lagged": lag_flow_asof,
        "no_new_low_5": no_new_low_5, "limit_pct": round(float(limit_pct), 3) if np.isfinite(limit_pct) else np.nan,
        "heat_ratio": round(float(heat), 3) if np.isfinite(heat) else np.nan, "consecutive_limit_up": run,
    }
    base["shape_score"] = shape_score(base)
    pure = (is_pending or is_just_window) and gd >= 8 and gp >= 1 and ga >= 8 and slope3 >= .03 and accel >= .04 and hist_expand >= .20 and pos60 < 40 and dd250 >= 20
    early = is_pending and predicted <= 3 and gd >= 7 and gp >= 1 and ga >= 8 and slope3 >= .03 and accel >= .04 and hist_expand >= .20 and pos60 < 30 and dd250 >= 20 and price_or_vol
    l0 = is_just_window and cross_age <= 3 and dd250 >= 30 and high_age >= 45 and pos60 < 30 and stable and slope3 >= .20 and hist_expand >= .40 and gd >= 8 and (dif[i] / last * 100.0) <= -3.0 and (r3 >= 3.0 or vr >= 1.5)
    rows = []
    if l0:
        rows.append({**base, "strategy": "L0_SALTLAKE_EXACT", "ranking_score": base["shape_score"], "data_status": "today_close"})
    if pure:
        rows.append({**base, "strategy": "L1_CROSS_WINDOW_PURE", "ranking_score": base["shape_score"], "data_status": "today_close"})
    flow_current = early and current_complete and current_flow >= .008 and r3 >= 4.0 and market_r3 > 0
    flow_lagged = early and lag_complete and lag_flow >= .008 and r3 >= 4.0 and market_r3 > 0
    plus_current = flow_current and no_new_low_5 and not_overheated
    plus_lagged = flow_lagged and no_new_low_5 and not_overheated
    for strategy, passed, status, fr in [
        ("L2_EARLY_FLOW_MARKET", flow_current, "today_close_full_flow", current_flow),
        ("L2_EARLY_FLOW_MARKET", flow_lagged, "today_close_lagged_flow_to_20260828", lag_flow),
        ("L3_EARLY_FLOW_MARKET_PLUS", plus_current, "today_close_full_flow", current_flow),
        ("L3_EARLY_FLOW_MARKET_PLUS", plus_lagged, "today_close_lagged_flow_to_20260828", lag_flow),
    ]:
        if passed:
            score = base["shape_score"] * .60 + clip01(float(fr) / .02) * 25.0 + clip01(r3 / 8.0) * 10.0 + clip01(market_r3 / 3.0) * 5.0
            rows.append({**base, "strategy": strategy, "ranking_score": round(score, 2), "data_status": status})
    return rows


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    uni = pd.read_csv(UNIVERSE, dtype={"symbol": str})
    uni["symbol"] = uni["symbol"].astype(str)
    uni["name"] = uni["name"].fillna("").astype(str)
    uni = uni[~uni.name.str.contains("ST|退", regex=True)].copy()
    uni = uni[~uni.symbol.str.startswith(("4", "8", "9"))].copy()
    symbols = uni.symbol.drop_duplicates().tolist()
    names = dict(zip(uni.symbol, uni.name))
    client = DataClient(project="Serenity-macd-current-scan", release_id=RELEASE, runtime_root=OUT)
    idx = client.index.daily(symbols=["000001.SH"], start_date=START, end_date=END)
    idx["trade_date"] = idx.trade_date.astype(str); idx["close"] = pd.to_numeric(idx.close, errors="coerce"); idx["r3"] = idx.close.pct_change(3)
    index_close = dict(zip(idx.trade_date, idx.close)); index_r3 = dict(zip(idx.trade_date, idx.r3))
    rows: list[dict] = []; coverage = {}
    for start in range(0, len(symbols), 600):
        chunk = symbols[start:start + 600]
        factor = client.market.stk_factor(symbols=chunk, start_date=START, end_date=END)
        money = client.market.moneyflow(symbols=chunk, start_date="20260826", end_date=END)
        limits = client.market.price_limits(symbols=chunk, start_date="20260826", end_date=END)
        for x in (factor, money):
            x["ts_code"] = x.ts_code.astype(str); x["trade_date"] = x.trade_date.astype(str)
        if len(limits):
            limits["ts_code"] = limits.ts_code.astype(str); limits["trade_date"] = limits.trade_date.astype(str)
        for day, count in money.groupby("trade_date").ts_code.nunique().items(): coverage[str(day)] = coverage.get(str(day), 0) + int(count)
        flows = {s: g for s, g in money.groupby("ts_code")}; lims = {s: g for s, g in limits.groupby("ts_code")} if len(limits) else {}
        for s, frame in factor.groupby("ts_code"):
            rows.extend(scan_one(frame, flows.get(s, pd.DataFrame(columns=["trade_date", "net_mf_amount", "amount"])), lims.get(s, pd.DataFrame(columns=["trade_date", "up_limit"])), names.get(s, ""), index_close, index_r3))
        print(f"scanned {min(start + 600, len(symbols))}/{len(symbols)}")
    out = pd.DataFrame(rows)
    if len(out): out = out.sort_values(["strategy", "ranking_score"], ascending=[True, False])
    out.to_csv(OUT / "current_strategy_candidates.csv", index=False, encoding="utf-8-sig")
    meta = {"release_id": RELEASE, "target_close": TARGET_DATE, "factor_end": END, "moneyflow_query_end": END, "moneyflow_coverage": coverage, "universe": len(symbols), "rows": len(out), "ranking_note": "ranking_score is a pre-trade ordering score for display only; it was not used in the historical backtest", "strategies": sorted(out.strategy.unique().tolist()) if len(out) else []}
    (OUT / "current_scan_manifest.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(out.groupby(["strategy", "data_status"]).size().to_string() if len(out) else "no_candidates")
    print(out.groupby("strategy").head(5).to_string(index=False) if len(out) else "no_candidates")


if __name__ == "__main__":
    main()
