# -*- coding: utf-8 -*-
"""真实QDH财务质量判定 QUALITY_FN（替代4只硬编码demo）
读 G:\\AI\\Data\\QDataHub\\data_store\\financial\\<code>\\income.parquet。
按报告as-of筛选已经披露的最新半年/年度报告，再与去年同期比较归母净利。
判定：净利yoy>50% 错杀(低位+高增) / 净利下滑(负yoy) 正确定价(伪便宜) /
      中报未披露 待验证 / 亏损 亏损待验证。
未披露/无数据 → 待验证（严格fail-safe，绝不硬凑）。
"""
import os
from pathlib import Path

_DATA_ROOT = Path(r'G:\AI\Data\QDataHub\data_store\financial')

# 内存缓存避免重复读parquet
_cache = {}
_df_cache = {}
_ASOF = None

def _norm_date(value):
    """统一QDH日期字段，避免Pandas把YYYYMMDD读成浮点数。"""
    s = str(value).strip()
    if s.endswith('.0'):
        s = s[:-2]
    return s[:8] if len(s) >= 8 and s[:8].isdigit() else ''

def set_asof(asof):
    """设置本次机制运行的可见日期，禁止读取该日之后才披露的财务数据。"""
    global _ASOF
    _ASOF = _norm_date(asof) or None
    _cache.clear()

def _read_income(code):
    if code in _df_cache:
        return _df_cache[code]
    d = _DATA_ROOT / code / 'income.parquet'
    if not d.exists():
        _df_cache[code] = None
        return None
    try:
        import pandas as pd
        df = pd.read_parquet(d)
        if 'end_date' not in df.columns:
            _df_cache[code] = None
            return None
        df = df.copy()
        df['_end_key'] = df['end_date'].map(_norm_date)
        df['_ann_key'] = df['f_ann_date'].map(_norm_date) if 'f_ann_date' in df.columns else ''
        _df_cache[code] = df
        return df
    except Exception:
        _df_cache[code] = None
        return None

def _visible(df, asof=None):
    """只保留as-of当日已经可见的报告；无公告日的记录按严格口径排除。"""
    if df is None or df.empty:
        return df
    cutoff = _norm_date(asof) if asof else _ASOF
    out = df[df['_end_key'] != ''].copy()
    if cutoff:
        out = out[(out['_ann_key'] != '') & (out['_ann_key'] <= cutoff)]
    return out

def resolve_periods(code, asof=None):
    """返回(asof可见的最新半年/年度期, 去年同期期)。"""
    df = _visible(_read_income(code), asof)
    if df is None or df.empty:
        return (None, None)
    # 质量门只比较半年或年度，避免把一季度和全年/半年混在一起。
    eligible = df[df['_end_key'].str.endswith(('0630', '1231'))]
    periods = sorted(set(eligible['_end_key']))
    if not periods:
        return (None, None)
    latest = periods[-1]
    prior = f'{int(latest[:4]) - 1}{latest[4:]}'
    return latest, prior

def _latest_net_profit(code):
    """返回 (end_date, n_income_attr_p 归母净利) 最新一期；无数据返回None"""
    if code in _cache:
        return _cache[code]
    try:
        import pandas as pd
        df = _visible(_read_income(code), _ASOF)
        if df is None or df.empty:
            _cache[code] = None; return None
        # 归母净利: n_income_attr_p 优先, 退化用 n_income
        col = 'n_income_attr_p' if 'n_income_attr_p' in df.columns else 'n_income'
        df = df.sort_values(['_end_key', '_ann_key']).drop_duplicates(subset='_end_key', keep='last')
        if len(df) == 0:
            _cache[code] = None; return None
        last = df.iloc[-1]
        _cache[code] = (str(last['_end_key']), float(last[col]) if pd.notna(last[col]) else None)
        return _cache[code]
    except Exception:
        _cache[code] = None
        return None

def _period_net_profit(code, period, asof=None):
    try:
        import pandas as pd
        df = _visible(_read_income(code), asof)
        if df is None or df.empty: return None
        col = 'n_income_attr_p' if 'n_income_attr_p' in df.columns else 'n_income'
        row = df[df['_end_key'] == _norm_date(period)].sort_values('_ann_key')
        if row.empty: return None
        v = float(row.iloc[-1][col])
        return v if pd.notna(v) else None
    except Exception:
        return None

def quality_fn(ts_code, asof=None):
    """QDH真实财务质量判定 → '错杀'|'正确定价'|'待验证'|'亏损待验证'|'扭亏'
    CC(9/3)修正: pri<0(去年同期亏损)+cur>0(今年扭亏) → 归'扭亏'(中性), 不标'错杀'。
    否则负基数倒置算出虚高yoy(+196%)会误导成"爆发式错杀"。只有正基数+高yoy才是真"错杀"。
    """
    latest, prior_period = resolve_periods(ts_code, asof)
    if latest is None or prior_period is None:
        return '待验证'
    cur = _period_net_profit(ts_code, latest, asof)
    if cur is None:
        # 中报未披露 → 待验证（不硬凑）
        return '待验证'
    if cur < 0:
        return '亏损待验证'
    pri = _period_net_profit(ts_code, prior_period, asof)
    if pri is None or pri == 0:
        return '待验证'
    # ⚠️ CC修正: 去年同期亏损(pri<0) → 扭亏为盈, 中性对待, 不算"错杀"
    if pri < 0:
        return '扭亏'
    yoy = (cur - pri) / abs(pri) * 100
    if yoy > 50:
        return '错杀'          # 低位+正基数高增 = 错杀, 升一档
    if yoy < 0:
        return '正确定价'      # 净利下滑低位的伪便宜, 剔除
    return '待验证'            # 0-50%增长, 不算爆发, 谨慎不荐

def period_label(code, asof=None):
    """返回实际采用的报告期标签，供报告层避免把年报写成中报。"""
    latest, _ = resolve_periods(code, asof)
    if latest is None:
        return '财报'
    if latest.endswith('0630'):
        return '中报'
    if latest.endswith('1231'):
        return '年报'
    return latest

if __name__ == '__main__':
    codes = ['688100.SH','003021.SZ','688041.SH','688088.SH','300528.SZ']
    for c in codes:
        print(f'{c}: {quality_fn(c)}')
