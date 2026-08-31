# coding: utf-8
"""Apply the unified low-turning-point shape gates to a completed run.

This module is technical-shape research only. It does not place orders, read
account state, or change QDataHub. The input is the CSV produced by
low_turn_cross_shape_runner.py.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import pandas as pd


JUST_GATES = {
    "state": "刚金叉",
    "cross_age_direct_max": 3,
    "pre_cross_green_days_min": 10,
    "pre_cross_green_peak_pct_min": 0.5,
    "pre_cross_green_area_pct_min": 5.0,
    "slope_min": 0.15,
    "slope_acceleration_min": 0.03,
    "hist_expansion_min": 0.10,
    "pos60_max_exclusive": 70.0,
    "dd250_min": 10.0,
}

PENDING_GATES = {
    "state": "准备金叉",
    "predicted_cross_days_max": 3,
    "pre_cross_green_days_min": 10,
    "pre_cross_green_peak_pct_min": 0.5,
    "pre_cross_green_area_pct_min": 5.0,
    "slope5_min_exclusive": 0.0,
    "slope_acceleration_min": 0.03,
    "hist_expansion_min": 0.10,
    "pos60_max_exclusive": 70.0,
    "dd250_min": 10.0,
}

# This is deliberately not a relaxed buy list.  It catches the earlier part of
# the requested "deep green histogram -> clear turn -> near cross" shape: the
# most recent three sessions are improving, but a five-session DIF slope can
# still be negative because it includes the preceding sell-off.  Candidates in
# this layer are observation-only and must not be merged into strict_pre_cross.
EARLY_PENDING_GATES = {
    "state": "准备金叉",
    "predicted_cross_days_max": 3,
    "pre_cross_green_days_min": 7,
    "pre_cross_green_peak_pct_min": 1.0,
    "pre_cross_green_area_pct_min": 8.0,
    "slope3_min": 0.03,
    "slope_acceleration_min": 0.04,
    "hist_expansion_min": 0.20,
    "pos60_max_exclusive": 30.0,
    "dd250_min": 20.0,
    "price_or_volume_confirmation": "r3>=3 or vol_ratio>=1.5",
}


def number(frame: pd.DataFrame, column: str) -> pd.Series:
    return pd.to_numeric(frame[column], errors="coerce")


def clean_universe(frame: pd.DataFrame) -> pd.DataFrame:
    symbol = frame["symbol"].astype(str)
    name = frame["name"].fillna("").astype(str)
    is_bj = symbol.str.endswith(".BJ")
    is_st = name.str.contains(r"(?:^|\s)(?:ST|\*ST)", regex=True, case=False, na=False)
    return frame.loc[~is_bj & ~is_st].copy()


def just_cross(frame: pd.DataFrame) -> pd.DataFrame:
    return frame.loc[
        (frame["state"] == JUST_GATES["state"])
        & (number(frame, "cross_age_direct") <= JUST_GATES["cross_age_direct_max"])
        & (number(frame, "pre_cross_green_days") >= JUST_GATES["pre_cross_green_days_min"])
        & (number(frame, "pre_cross_green_peak_pct") >= JUST_GATES["pre_cross_green_peak_pct_min"])
        & (number(frame, "pre_cross_green_area_pct") >= JUST_GATES["pre_cross_green_area_pct_min"])
        & (number(frame, "slope") >= JUST_GATES["slope_min"])
        & (number(frame, "slope_acceleration") >= JUST_GATES["slope_acceleration_min"])
        & (number(frame, "hist_expansion") >= JUST_GATES["hist_expansion_min"])
        & (number(frame, "pos60") < JUST_GATES["pos60_max_exclusive"])
        & (number(frame, "dd250") >= JUST_GATES["dd250_min"])
    ].copy()


def pending(frame: pd.DataFrame) -> pd.DataFrame:
    return frame.loc[
        (frame["state"] == PENDING_GATES["state"])
        & (number(frame, "predicted_cross_days") <= PENDING_GATES["predicted_cross_days_max"])
        & (number(frame, "pre_cross_green_days") >= PENDING_GATES["pre_cross_green_days_min"])
        & (number(frame, "pre_cross_green_peak_pct") >= PENDING_GATES["pre_cross_green_peak_pct_min"])
        & (number(frame, "pre_cross_green_area_pct") >= PENDING_GATES["pre_cross_green_area_pct_min"])
        & (number(frame, "slope5") > PENDING_GATES["slope5_min_exclusive"])
        & (number(frame, "slope_acceleration") >= PENDING_GATES["slope_acceleration_min"])
        & (number(frame, "hist_expansion") >= PENDING_GATES["hist_expansion_min"])
        & (number(frame, "pos60") < PENDING_GATES["pos60_max_exclusive"])
        & (number(frame, "dd250") >= PENDING_GATES["dd250_min"])
    ].copy()


def early_pending_watch(frame: pd.DataFrame) -> pd.DataFrame:
    """Early-turn observation layer; intentionally separate from strict entry."""
    return frame.loc[
        (frame["state"] == EARLY_PENDING_GATES["state"])
        & (number(frame, "predicted_cross_days") <= EARLY_PENDING_GATES["predicted_cross_days_max"])
        & (number(frame, "pre_cross_green_days") >= EARLY_PENDING_GATES["pre_cross_green_days_min"])
        & (number(frame, "pre_cross_green_peak_pct") >= EARLY_PENDING_GATES["pre_cross_green_peak_pct_min"])
        & (number(frame, "pre_cross_green_area_pct") >= EARLY_PENDING_GATES["pre_cross_green_area_pct_min"])
        & (number(frame, "slope") >= EARLY_PENDING_GATES["slope3_min"])
        & (number(frame, "slope_acceleration") >= EARLY_PENDING_GATES["slope_acceleration_min"])
        & (number(frame, "hist_expansion") >= EARLY_PENDING_GATES["hist_expansion_min"])
        & (number(frame, "pos60") < EARLY_PENDING_GATES["pos60_max_exclusive"])
        & (number(frame, "dd250") >= EARLY_PENDING_GATES["dd250_min"])
        & ((number(frame, "r3") >= 3.0) | (number(frame, "vol_ratio") >= 1.5))
    ].copy()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", type=Path, required=True)
    ap.add_argument("--output-dir", type=Path, required=True)
    args = ap.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    raw = pd.read_csv(args.input, encoding="utf-8-sig")
    if "family" in raw.columns:
        raw = raw.loc[raw["family"] == "exact"].copy()
    cleaned = clean_universe(raw)
    just = just_cross(cleaned)
    pre = pending(cleaned)
    early_pre = early_pending_watch(cleaned)

    keep = sorted(set(just["symbol"].astype(str)) | set(pre["symbol"].astype(str)))
    just.sort_values(["slope", "pre_cross_green_area_pct"], ascending=False).to_csv(
        args.output_dir / "strict_just_cross.csv", index=False, encoding="utf-8-sig"
    )
    pre.sort_values(["slope5", "pre_cross_green_area_pct"], ascending=False).to_csv(
        args.output_dir / "strict_pre_cross.csv", index=False, encoding="utf-8-sig"
    )
    early_pre.sort_values(["slope_acceleration", "pre_cross_green_area_pct"], ascending=False).to_csv(
        args.output_dir / "early_pre_cross_watch.csv", index=False, encoding="utf-8-sig"
    )
    summary = {
        "input": str(args.input),
        "input_rows": int(len(raw)),
        "clean_rows": int(len(cleaned)),
        "strict_just_cross": int(len(just)),
        "strict_pre_cross": int(len(pre)),
        "early_pre_cross_watch": int(len(early_pre)),
        "strict_union": int(len(keep)),
        "excluded_bj_or_st": int(len(raw) - len(cleaned)),
        "gates": {
            "just_cross": JUST_GATES,
            "pending": PENDING_GATES,
            "early_pre_cross_watch": EARLY_PENDING_GATES,
        },
    }
    (args.output_dir / "strict_filter_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
