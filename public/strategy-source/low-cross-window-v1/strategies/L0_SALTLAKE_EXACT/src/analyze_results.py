# coding: utf-8
"""Organize experiment results into the reporting tables used by experiment_report.md."""
import sys
from pathlib import Path

import pandas as pd

sys.stdout.reconfigure(encoding="utf-8")
TASK = Path(__file__).resolve().parents[1] / "runs" / "20260826"
res = pd.read_csv(TASK / "experiment_results.csv", encoding="utf-8-sig")
def parse_bool(v):
    if isinstance(v, bool):
        return v
    return str(v).strip().lower() in {"true", "1", "yes", "y"}

res["pass"] = res["pass"].map(parse_bool)
res["in_candidate_universe"] = res["in_candidate_universe"].map(parse_bool)
FAMS = ["exact", "angle_gap", "acceleration", "base_break", "pre_cross_watch"]
CONTROLS = ["000792.SZ", "600115.SH", "601868.SH", "600884.SH", "603992.SH", "301007.SZ",
            "605016.SH", "300872.SZ", "002130.SZ", "002510.SZ", "601068.SH"]

print("== counts ==")
for fam in FAMS:
    sub = res[res["family"] == fam]
    cand = sub[sub["in_candidate_universe"] == True]  # noqa: E712
    print(f"{fam:16s} full={int(sub['pass'].sum()):5d} cand160={int(cand['pass'].sum()):4d} "
          f"total_rows={len(sub)} data_na={int((sub['state']=='DATA_NA').sum())}")

print("\n== top10 per family (pass, ordered) ==")
ORDER = {
    "exact": ["pass", "slope", "dd250"],
    "angle_gap": ["pass", "gap_pct", "slope"],
    "acceleration": ["pass", "slope_acceleration", "slope"],
    "base_break": ["pass", "dd250", "pos60"],
    "pre_cross_watch": ["pass", "gap_pct"],
}
for fam in FAMS:
    sub = res[res["family"] == fam]
    p = sub[sub["pass"]].copy()
    if len(p):
        p = p.sort_values(ORDER[fam], ascending=[False] * len(ORDER[fam])).head(10)
        print(f"\n-- {fam} ({len(p)}) --")
        print(p[["symbol", "name", "state", "cross_age", "dd250", "pos60", "slope",
                 "slope_acceleration", "hist_expansion", "gap_pct", "post_cross_gap_change",
                 "pass"]].to_string(index=False))
    else:
        print(f"\n-- {fam}: NO PASSES --")
        # show why: most common failing gate
        sub2 = sub[sub["state"] != "DATA_NA"]
        if len(sub2):
            from collections import Counter
            c = Counter()
            for _, r in sub2.iterrows():
                for g in str(r["rejection_reasons"]).split(";"):
                    if g:
                        c[g] += 1
            print("fail-gate counts:", dict(c.most_common(12)))

print("\n== control rows (all families) ==")
ctrl = res[res["symbol"].isin(CONTROLS)]
for fam in FAMS:
    sub = ctrl[ctrl["family"] == fam]
    print(f"\n-- {fam} --")
    print(sub[["symbol", "name", "state", "cross_age", "dd250", "pos60", "slope",
               "slope_acceleration", "hist_expansion", "gap_pct", "post_cross_gap_change",
               "base_break", "volume_confirmation", "pass", "rejection_reasons"]].to_string(index=False))

print("\n== overlap matrix ==")
syms_f = {}
for fam in FAMS:
    sub = res[res["family"] == fam]
    syms_f[fam] = set(sub[sub["pass"]]["symbol"])
famst = FAMS[:4]
rows = []
for a in famst:
    row = {"family": a, "count": len(syms_f[a])}
    for b in famst:
        row[f"∩{b}"] = len(syms_f[a] & syms_f[b])
    rows.append(row)
print(pd.DataFrame(rows).to_string(index=False))

print("\n== base_break nearest misses ==")
sub = res[(res["family"] == "base_break") & (res["state"] != "DATA_NA")]
sub = sub[(~sub["pass"]) & (sub["slope"].notna())].copy()
sub = sub[sub["no_new_low"] == True]  # noqa: E712
print("no_new_low but close-not-above-base or vol weak:", len(sub))
