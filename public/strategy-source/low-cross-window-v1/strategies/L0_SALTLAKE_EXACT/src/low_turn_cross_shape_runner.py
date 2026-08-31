# coding: utf-8
"""Low-position breakout shape definition experiment (research only).

Tests five independent rule families on the 5,263-row scored universe as-of
2026-08-26 using the pinned accepted QDataHub release. Mirrors the feature
formulas of run_relaxed_tiers.py (S2_visible_watch baseline) so results are
comparable, then adds the new features required by each family.

No trades, no writes outside this directory, no strategy/account changes.
"""
from __future__ import annotations

import hashlib
import json
import sys
import traceback
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, r"G:\AI\Project\QDataHub\src")
from qdata import DataClient  # noqa: E402

RELEASE = None  # 动态获取（2026-08-30修复：此前硬编码 qdh-bj-20260828T123148 导致多日输出相同）
AS_OF = None    # 动态获取
START = "20250101"
PACKAGE_DIR = Path(__file__).resolve().parents[1]
RELEASE_META = Path(r"G:\AI\Project\QDataHub\runtime_data\external_release_announcement.json")


def resolve_release():
    """读取最新 release_id + as_of。优先 release 公告文件，回退到最近一次 runs 目录的 manifest。"""
    # 1) release 公告文件
    try:
        with open(RELEASE_META, encoding="utf-8") as f:
            d = json.load(f)
        rid = (d.get("release", {}).get("release_id")
               or d.get("complete_update", {}).get("release_id")
               or None)
        if rid and rid.startswith("qdh-bj-"):
            as_of = rid.split("-")[2][:8]
            return rid, as_of
        print(f"⚠️ release 公告文件无 qdh-bj-* 格式 release_id（{rid}），回退到最近 runs 目录")
    except Exception as e:
        print(f"⚠️ 读取 release 公告文件失败: {e}，回退到最近 runs 目录")
    # 2) 回退：最近一次 runs/YYYYMMDD/experiment_manifest.json
    runs_dir = PACKAGE_DIR / "runs"
    if runs_dir.exists():
        dates = sorted([d for d in os.listdir(str(runs_dir)) if d.isdigit()])
        if dates:
            latest = dates[-1]
            manifest = runs_dir / latest / "experiment_manifest.json"
            if manifest.exists():
                try:
                    m = json.load(open(manifest, encoding="utf-8-sig"))
                    rid = m.get("release_id")
                    if rid:
                        return rid, latest
                except Exception:
                    pass
            return None, latest  # 至少用日期目录，release 置空
    raise SystemExit("❌ 无法解析 release：release 公告文件与 runs 目录均不可用")


RELEASE, AS_OF = resolve_release()
print(f"   [release] {RELEASE}  as_of={AS_OF}")
TASK_DIR = PACKAGE_DIR / "runs" / AS_OF


def _sort_key(gen: str) -> str:
    """统一排序 key：提取所有数字字符（ISO 8601 与目录名混合格式可比）。"""
    digits = "".join(ch for ch in gen if ch.isdigit())
    return digits


def _find_latest_all_scored() -> Path:
    """动态发现最新的 all_scored.csv，避免硬编码 8/26 快照导致 8/26 后新形成的金叉票漏网。

    扫描 strategy_runs/*/ 下所有 all_scored.csv，按 manifest.json 的 generated_at 排序取最新；
    无 manifest 的目录按目录名日期排序回退。找不到则抛错提示重跑 technical_v2。
    """
    runs_root = Path(r"G:\AI\Project\Serenity\runtime_data\strategy_runs")
    candidates: list[tuple[str, Path]] = []
    for csv_path in runs_root.rglob("all_scored.csv"):
        manifest = csv_path.parent / "manifest.json"
        gen = ""
        if manifest.exists():
            try:
                gen = json.loads(manifest.read_text(encoding="utf-8")).get("generated_at", "")
            except Exception:
                gen = ""
        if not gen:
            gen = csv_path.parent.parent.name if csv_path.parent.parent.name[:8].isdigit() else csv_path.parent.name
        candidates.append((_sort_key(gen), csv_path))
    if not candidates:
        raise FileNotFoundError(
            "未找到任何 all_scored.csv。请先运行 technical_v2 runner 生成候选池：\n"
            "  python 低位反转技术面选股_V2/src/run_qdh_v2.py --as-of <最新交易日> --release-id <最新release>"
        )
    candidates.sort(key=lambda x: x[0], reverse=True)
    chosen = candidates[0][1]
    print(f"   [universe] 使用最新候选池: {chosen}  (sort_key={candidates[0][0]})")
    return chosen


UNIVERSE = _find_latest_all_scored()
REFERENCE_RUN = Path(r"G:\AI\Project\Serenity\runtime_data\strategy_runs\20260826_saltlake_relaxation\run_relaxed_tiers.py")
S2_WATCH = Path(r"G:\AI\Project\Serenity\runtime_data\strategy_runs\20260826_saltlake_relaxation\S2_visible_watch.csv")
DATA_ACCESS = PACKAGE_DIR / "docs" / "DATA_ACCESS.md"
CHUNK = 700  # symbols per stk_factor call

FAMILIES = ["exact", "angle_gap", "acceleration", "base_break", "pre_cross_watch"]


# --------------------------------------------------------------------------
# feature computation (identical formulas to run_relaxed_tiers.py)
# --------------------------------------------------------------------------
def crosses(dif: pd.Series, dea: pd.Series):
    up = (dif > dea) & (dif.shift(1) <= dea.shift(1))
    down = (dif <= dea) & (dif.shift(1) > dea.shift(1))
    up_i = np.flatnonzero(up.fillna(False).to_numpy())
    down_i = np.flatnonzero(down.fillna(False).to_numpy())
    return up_i, down_i


def calc_features(frame: pd.DataFrame, seed: dict):
    """Replicate run_relaxed_tiers.calc() and add family features.

    Returns (dict|None, warn) - warn carries the drop reason when None.
    """
    s = frame.sort_values("trade_date").drop_duplicates("trade_date", keep="last").tail(250).reset_index(drop=True)
    if len(s) < 120:
        return None, f"history_bars={len(s)}<120"
    last_trade_date = str(s["trade_date"].iloc[-1])
    close = pd.to_numeric(s["close"], errors="coerce")
    vol = pd.to_numeric(s["vol"], errors="coerce")
    af = pd.to_numeric(s["adj_factor"], errors="coerce")
    n_na_af = int(af.isna().sum())
    af = af.fillna(1.0)
    n_na_close = int(close.isna().sum())
    adj = close.to_numpy(dtype=float) * af.to_numpy(dtype=float) / float(af.iloc[-1])
    if not np.isfinite(adj).all() or adj[-1] <= 0:
        return None, f"non_finite_or_nonpositive_adjusted_close (na_close={n_na_close})"
    n_na_vol = int(vol.isna().sum())
    vol = vol.fillna(0.0)
    last = float(adj[-1])
    hi_i = int(np.argmax(adj))
    dd250 = (float(adj.max()) - last) / float(adj.max()) * 100.0
    high_age = len(adj) - 1 - hi_i
    lo60, hi60 = float(adj[-60:].min()), float(adj[-60:].max())
    pos60 = (last - lo60) / max(hi60 - lo60, 1e-12) * 100.0
    stable = float(adj[-5:].min()) >= float(adj[-60:-5].min()) * 0.99

    c = pd.Series(adj)
    dif = c.ewm(span=12, adjust=False).mean() - c.ewm(span=26, adjust=False).mean()
    dea = dif.ewm(span=9, adjust=False).mean()
    hist = 2.0 * (dif - dea)
    up_i, down_i = crosses(dif, dea)
    cross_age = None
    green_days = None
    state = "其他"
    # cross_age_direct = age of the most recent actual up cross (any age,
    # NOT capped at 3 like the reference state label) - used by angle_gap/
    # acceleration families which allow up to 5 sessions.
    cross_age_direct = None
    if len(up_i):
        last_up = int(up_i[-1])
        cross_age_direct = len(c) - 1 - last_up
        if cross_age_direct <= 3 and dif.iloc[-1] > dif.iloc[-2] and hist.iloc[-1] > hist.iloc[-2]:
            state = "刚金叉"
            cross_age = cross_age_direct
            prev_down = down_i[down_i < last_up]
            if len(prev_down):
                green_days = int(last_up - prev_down[-1])
    gap = max(float(dea.iloc[-1] - dif.iloc[-1]), 0.0) / last * 100.0
    previous_gap = max(float(dea.iloc[-2] - dif.iloc[-2]), 0.0) / last * 100.0
    convergence = previous_gap - gap
    predicted = gap / convergence if convergence > 0 else 999.0
    if state == "其他" and dif.iloc[-1] <= dea.iloc[-1] and dif.iloc[-1] > dif.iloc[-2] and hist.iloc[-1] > hist.iloc[-2] > hist.iloc[-3] and gap <= 1.0 and predicted <= 3.0:
        state = "准备金叉"
        cross_age = 0
    slope = (float(dif.iloc[-1]) - float(dif.iloc[-4])) / last / 3.0 * 100.0
    hist_expand = (float(hist.iloc[-1]) - float(hist.iloc[-4])) / last / 3.0 * 100.0
    dif_pct = float(dif.iloc[-1]) / last * 100.0
    gap_pct = abs(float(dif.iloc[-1] - dea.iloc[-1])) / last * 100.0
    r3 = (last / float(adj[-4]) - 1.0) * 100.0
    r1 = (last / float(adj[-2]) - 1.0) * 100.0
    vol_ratio = float(vol.iloc[-1] / max(float(vol.iloc[-6:-1].mean()), 1e-12))

    # ---- family-specific features (not in the reference run) --------------
    slope5 = (float(dif.iloc[-1]) - float(dif.iloc[-6])) / 5.0 / last * 100.0
    slope10 = (float(dif.iloc[-1]) - float(dif.iloc[-11])) / 10.0 / last * 100.0
    slope_acceleration = slope5 - slope10
    hist_pos = float(hist.iloc[-1]) > 0.0
    hist_rising2 = bool(hist.iloc[-1] > hist.iloc[-2] > hist.iloc[-3])
    ma5 = float(np.mean(adj[-5:]))
    close_above_ma5 = adj[-1] > ma5
    # normalized DIF-DEA gap today vs at the last up cross (same price norm)
    gap_at_cross = None
    post_cross_gap_change = None
    pre_cross_green_days = 0
    pre_cross_green_peak_pct = 0.0
    pre_cross_green_area_pct = 0.0
    if len(up_i) and cross_age_direct is not None and cross_age_direct <= 3:
        ci = int(up_i[-1])
        gap_at_cross = abs(float(dif.iloc[ci] - dea.iloc[ci])) / last * 100.0
        post_cross_gap_change = gap_pct - gap_at_cross
        green_end = ci - 1
    elif dif.iloc[-1] <= dea.iloc[-1]:
        # For a pending cross, measure the negative-histogram run ending at t.
        # This is deliberately separate from green_days, which is the interval
        # between the prior down-cross and the latest up-cross.
        green_end = len(c) - 1
    else:
        green_end = -1
    if green_end >= 0:
        j = green_end
        green_hist = []
        while j >= 0 and float(hist.iloc[j]) < 0.0:
            green_hist.append(abs(float(hist.iloc[j])) / last * 100.0)
            j -= 1
        pre_cross_green_days = len(green_hist)
        if green_hist:
            pre_cross_green_peak_pct = max(green_hist)
            pre_cross_green_area_pct = sum(green_hist)
    # 5-day no-new-low base (5 sessions strictly before today) and breakout
    base_low = float(np.min(adj[-6:-1]))
    base_high = float(np.max(adj[-6:-1]))
    prior_low = float(np.min(adj[-11:-6]))
    no_new_low = base_low >= prior_low
    base_break = bool(adj[-1] > base_high)
    vol_conf_base = bool(vol_ratio >= 1.3)

    return {
        "symbol": seed["symbol"], "name": seed["name"],
        "last_trade_date": last_trade_date,
        "state": state, "cross_age": cross_age if cross_age is not None else 999,
        "cross_age_direct": cross_age_direct if cross_age_direct is not None else 999,
        "after_cross": bool(dif.iloc[-1] > dea.iloc[-1]),
        "dd250": round(dd250, 4), "high_age": high_age, "pos60": round(pos60, 4),
        "stable": bool(stable), "slope": round(slope, 6), "hist_expand": round(hist_expand, 6),
        "dif_pct": round(dif_pct, 6), "gap_pct": round(gap_pct, 6),
        "pending_gap_pct": round(gap, 6), "gap_convergence_pct": round(convergence, 6),
        "predicted_cross_days": round(predicted, 4),
        "green_days": green_days if green_days is not None else 0,
        "r1": round(r1, 4), "r3": round(r3, 4), "vol_ratio": round(vol_ratio, 4),
        "slope5": round(slope5, 6), "slope10": round(slope10, 6),
        "slope_acceleration": round(slope_acceleration, 6),
        "hist_pos": hist_pos, "hist_rising2": hist_rising2, "close_above_ma5": close_above_ma5,
        "gap_at_cross": gap_at_cross,
        "post_cross_gap_change": None if post_cross_gap_change is None else round(post_cross_gap_change, 6),
        "pre_cross_green_days": pre_cross_green_days,
        "pre_cross_green_peak_pct": round(pre_cross_green_peak_pct, 6),
        "pre_cross_green_area_pct": round(pre_cross_green_area_pct, 6),
        "base_low": round(base_low, 6), "base_high": round(base_high, 6), "prior_low": round(prior_low, 6),
        "no_new_low": bool(no_new_low), "base_break": base_break, "vol_conf_base": vol_conf_base,
        "warn_na_af": n_na_af, "warn_na_close": n_na_close, "warn_na_vol": n_na_vol,
    }, None


# --------------------------------------------------------------------------
# rule families: each returns (pass, [failed gate labels])
# --------------------------------------------------------------------------
def fam_exact(r):
    gates = [
        ("state_just_cross", r["state"] == "刚金叉"),
        ("cross_age<=3", r["cross_age"] <= 3),
        ("dd250>=30", r["dd250"] >= 30),
        ("high_age>=45", r["high_age"] >= 45),
        ("pos60<30", r["pos60"] < 30),
        ("stable", r["stable"]),
        ("slope>=0.20", r["slope"] >= 0.20),
        ("hist_expand>=0.40", r["hist_expand"] >= 0.40),
        ("green_days>=8", r["green_days"] >= 8),
        ("dif_pct<=-3.0", r["dif_pct"] <= -3.0),
        ("price_vol_conf_r3>=3|vr>=1.5", (r["r3"] >= 3.0) or (r["vol_ratio"] >= 1.5)),
    ]
    return all(v for _, v in gates), [k for k, v in gates if not v]


def fam_angle_gap(r):
    gates = [
        ("after_cross", r["after_cross"]),
        ("cross_age_direct<=3", r["cross_age_direct"] <= 3),
        ("slope>=0.15", r["slope"] >= 0.15),
        ("hist_pos", r["hist_pos"]),
        ("hist_rising2", r["hist_rising2"]),
        ("gap_pct>=0.10", r["gap_pct"] >= 0.10),
        ("gap_increasing_postcross", (r["post_cross_gap_change"] is not None) and (r["post_cross_gap_change"] >= 0.0)),
    ]
    return all(v for _, v in gates), [k for k, v in gates if not v]


def fam_acceleration(r):
    gates = [
        ("after_cross", r["after_cross"]),
        ("cross_age_direct<=5", r["cross_age_direct"] <= 5),
        ("slope5>0", r["slope5"] > 0),
        ("slope_acc>=0.05", r["slope_acceleration"] >= 0.05),
        ("hist_rising2", r["hist_rising2"]),
        ("hist_expand>=0.15", r["hist_expand"] >= 0.15),
        ("close_above_ma5", r["close_above_ma5"]),
    ]
    return all(v for _, v in gates), [k for k, v in gates if not v]


def fam_base_break(r):
    gates = [
        ("dd250>=25", r["dd250"] >= 25),
        ("high_age>=30", r["high_age"] >= 30),
        ("pos60<40", r["pos60"] < 40),
        ("no_new_low_base5", r["no_new_low"]),
        ("close_above_base_high", r["base_break"]),
        ("vol_conf>=1.3", r["vol_conf_base"]),
    ]
    return all(v for _, v in gates), [k for k, v in gates if not v]


def fam_pre_cross(r):
    gates = [("state_pre_cross", r["state"] == "准备金叉")]
    return all(v for _, v in gates), [k for k, v in gates if not v]


FAM_FUNCS = {
    "exact": fam_exact,
    "angle_gap": fam_angle_gap,
    "acceleration": fam_acceleration,
    "base_break": fam_base_break,
    "pre_cross_watch": fam_pre_cross,
}

REQ_COLS = ["family", "symbol", "name", "last_trade_date", "state", "cross_age", "dd250", "pos60", "slope",
            "slope_acceleration", "hist_expansion", "gap_pct", "post_cross_gap_change",
            "base_break", "volume_confirmation", "pass", "rejection_reasons"]
EXTRA_COLS = ["in_candidate_universe", "high_age", "stable", "green_days", "dif_pct",
              "after_cross", "cross_age_direct", "hist_pos", "hist_rising2", "slope5", "slope10",
              "r1", "r3", "vol_ratio",
              "close_above_ma5", "gap_at_cross", "no_new_low", "base_low", "base_high",
              "pending_gap_pct", "gap_convergence_pct", "predicted_cross_days",
              "pre_cross_green_days", "pre_cross_green_peak_pct", "pre_cross_green_area_pct",
              "warn_na_af", "warn_na_close", "warn_na_vol", "data_na_reason"]


def md5(p: Path) -> str:
    return hashlib.md5(p.read_bytes()).hexdigest()


def main() -> None:
    notes: dict = {}
    warnings: list = []
    for p in (UNIVERSE, REFERENCE_RUN, S2_WATCH, DATA_ACCESS):
        notes[str(p.name)] = {"path": str(p), "md5": md5(p)}

    universe = pd.read_csv(UNIVERSE, encoding="utf-8-sig")
    universe = universe.drop_duplicates("symbol", keep="first").reset_index(drop=True)
    universe["symbol"] = universe["symbol"].astype(str)
    universe["name"] = universe["name"].fillna("").astype(str)
    is_cand = (universe["low_pass"] == True) & (universe["macd_primary"] == True)  # noqa: E712
    cand_flags = {str(s): bool(v) for s, v in zip(universe["symbol"], is_cand)}
    names = {str(r.symbol): {"symbol": str(r.symbol), "name": r["name"]} for _, r in universe.iterrows()}
    symbols = sorted(names)
    n_universe = len(symbols)
    n_candidate = int(is_cand.sum())
    notes["universe"] = {"rows_in_csv": 5263 if len(universe) == 5263 else len(universe),
                         "unique_symbols": n_universe, "candidate_low_pass_and_macd_primary": n_candidate}
    print(f"universe={n_universe} candidate={n_candidate}")

    dc = DataClient(project="Serenity-lowbreakout-shape-tests", release_id=RELEASE, runtime_root=TASK_DIR)
    frames = []
    for i in range(0, len(symbols), CHUNK):
        chunk = symbols[i:i + CHUNK]
        frames.append(dc.market.stk_factor(symbols=chunk, start_date=START, end_date=AS_OF))
        print(f"fetched {i + len(chunk)}/{len(symbols)}")
    raw = pd.concat(frames, ignore_index=True)
    raw["ts_code"] = raw["ts_code"].astype(str)
    raw_trade_dates = pd.to_datetime(raw["trade_date"], errors="coerce")
    notes["query"] = {"dataset": "market.a_share.stk_factor",
                       "client": "qdata.DataClient(market.stk_factor)",
                       "release_id": RELEASE, "start_date": START, "end_date": AS_OF,
                       "symbol_chunks": CHUNK, "rows_returned": int(len(raw)),
                       "max_returned_trade_date": (
                           None if raw_trade_dates.isna().all()
                           else raw_trade_dates.max().strftime("%Y%m%d")
                       ),
                       "source": "local_derivation.market.a_share.daily_plus_adjustment_factor_history"}

    rows = []
    na_dropped = []
    per_symbol = {str(k): v for k, v in raw.groupby("ts_code")}
    for s in symbols:
        feats, warn = calc_features(per_symbol.get(s, raw[raw["ts_code"] == s]), names[s])
        if feats is None:
            na_dropped.append({"symbol": s, "name": names[s]["name"], "reason": warn})
            continue
        feats["in_candidate_universe"] = cand_flags[s]
        rows.append(feats)
    df = pd.DataFrame(rows)
    print(f"featured={len(df)} data_na={len(na_dropped)}")

    # ---- family evaluation -------------------------------------------------
    out_rows = []
    counts = {}
    for fam in FAMILIES:
        func = FAM_FUNCS[fam]
        n_pass = 0
        n_pass_cand = 0
        for _, r in df.iterrows():
            ok, failed = func(r)
            if ok:
                n_pass += 1
                if r["in_candidate_universe"]:
                    n_pass_cand += 1
            rec = {
                "family": fam, "symbol": r["symbol"], "name": r["name"], "state": r["state"],
                "cross_age": r["cross_age"], "dd250": r["dd250"], "pos60": r["pos60"],
                "slope": r["slope"], "slope_acceleration": r["slope_acceleration"],
                "hist_expansion": r["hist_expand"], "gap_pct": r["gap_pct"],
                "post_cross_gap_change": r["post_cross_gap_change"],
                "base_break": r["base_break"],
                "volume_confirmation": ((r["r3"] >= 3.0) or (r["vol_ratio"] >= 1.5)) if fam in ("exact", "angle_gap", "acceleration") else r["vol_conf_base"],
                "pass": ok, "rejection_reasons": "" if ok else ";".join(failed),
            }
            # Most rows have no data-na reason; keep the column but do not fail
            # while serializing a clean row.
            rec.update({k: r.get(k, "") for k in EXTRA_COLS})
            out_rows.append(rec)
        counts[fam] = {"pass_full_universe": int(n_pass), "pass_candidate_subset": int(n_pass_cand)}
        print(fam, counts[fam])

    # DATA_NA rows: one row per family so nothing is silently dropped
    for d in na_dropped:
        for fam in FAMILIES:
            rec = {"family": fam, "symbol": d["symbol"], "name": d["name"], "state": "DATA_NA",
                   "cross_age": 999, "pass": False,
                   "rejection_reasons": f"DATA_NA:{d['reason']}", "data_na_reason": d["reason"],
                   "in_candidate_universe": cand_flags.get(d["symbol"], False)}
            out_rows.append(rec)

    res = pd.DataFrame(out_rows)
    res["pass"] = res["pass"].astype(bool)
    res = res[REQ_COLS + [c for c in EXTRA_COLS if c in res.columns]]
    res.to_csv(TASK_DIR / "experiment_results.csv", index=False, encoding="utf-8-sig")

    # ---- self-check vs reference run (S2_visible_watch.csv) ----------------
    s2 = pd.read_csv(S2_WATCH, encoding="utf-8-sig")
    s2["symbol"] = s2["symbol"].astype(str)
    check = []
    for _, row in s2.iterrows():
        mine = df[(df["symbol"] == row["symbol"])]
        if len(mine) == 0:
            check.append({"symbol": row["symbol"], "match": "NO_DATA"})
            continue
        m = mine.iloc[0]
        ok = all(abs(float(m[k]) - float(row[k])) <= 0.01 for k in
                 ["dd250", "pos60", "slope", "hist_expand", "dif_pct", "gap_pct", "r3", "vol_ratio"])
        check.append({"symbol": row["symbol"], "name": m["name"], "state": m["state"],
                      "dd250": m["dd250"], "pos60": m["pos60"], "slope": m["slope"],
                      "hist_expand": m["hist_expand"], "dif_pct": m["dif_pct"], "gap_pct": m["gap_pct"],
                      "r3": m["r3"], "vol_ratio": m["vol_ratio"], "match": "OK" if ok else "MISMATCH"})
    check_df = pd.DataFrame(check)
    check_df.to_csv(TASK_DIR / "s2_reference_check.csv", index=False, encoding="utf-8-sig")

    manifest = {
        "status": "PASS_RESEARCH_ONLY",
        "release_id": RELEASE,
        "as_of": AS_OF,
        "input_hashes": notes,
        "universe": {"scored_csv_unique_symbols": n_universe, "candidate_subset_low_pass_macd_primary": n_candidate,
                     "featured_count": int(len(df)),
                     "data_na_count": int(len(na_dropped)), "data_na_symbols": na_dropped},
        "counts": counts,
        "family_definitions": {
            "exact": "state=刚金叉 & cross_age<=3 & dd250>=30 & high_age>=45 & pos60<30 & stable & slope>=0.20 & hist_expand>=0.40 & green_days>=8 & dif_pct<=-3.0 & (r3>=3 or vol_ratio>=1.5)",
            "angle_gap": "after_cross(dif>dea) & cross_age_direct<=3 & slope>=0.15 & hist[-1]>0 & hist[-1]>hist[-2]>hist[-3] & gap_pct>=0.10 & post_cross_gap_change>=0 (no 3d-return gate)",
            "acceleration": "after_cross(dif>dea) & cross_age_direct<=5 & slope5>0 & (slope5-slope10)>=0.05 & hist[-1]>hist[-2]>hist[-3] & hist_expand_3d>=0.15 & close>MA5",
            "base_break": "dd250>=25 & high_age>=30 & pos60<40 & min(adj[-6:-1])>=min(adj[-11:-6]) & close>max(adj[-6:-1]) & vol_ratio>=1.3",
            "pre_cross_watch": "state=准备金叉 (dif<=dea, dif rising, hist rising 3 sessions, gap<=1.0, predicted<=3.0); never action-ready",
        },
        "adjustment": {"close": "raw close * adj_factor / adj_factor[-1] (front-adjusted, normalized to latest trade day)",
                       "missing_af_filled": 1.0},
        "macd": {"dif": "EMA12-EMA26 adjust=False", "dea": "EMA9(dif)", "hist": "2*(dif-dea)",
                 "window": "last 250 sessions, min 120 required", "start_date": START},
        "warnings": warnings,
        "s2_reference_check": check_df.to_dict("records"),
        "notes": "Research diagnostics only. No trades, no strategy/account modifications, no external messages.",
    }
    (TASK_DIR / "experiment_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    print("DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        sys.exit(1)
