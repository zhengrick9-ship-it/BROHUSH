# -*- coding: utf-8 -*-
"""每日统一报告生成器 v2 (2026-09-03 用户重构顺序)
报告结构(用户指定顺序):
  1. 顶部市场温度卡(多因子完整: 温度+赚钱/量能/情绪三因子, 不折叠)
  2. 温度计情况说明(不折叠)
  3. 市场分析段落(主要板块/今日热门/遇冷/投资机会所在)
  4. 折叠的全板块+主题两个列表
  5. 策略运行结果 + 对应分析
  6. 作战计划(含持仓) — 折叠
读: 机制JSON(温度门控机制_<date>.json) + 温度计多窗口CSV + 温度多因子(thermo_market_conditions) + 作战计划数据(内嵌)
输出: 每日A股综合报告_<date>.html
"""
import json, os, html, glob, datetime, sys
from pathlib import Path
import pandas as pd

REPORTS = Path(r'G:\HM\hermes-home\reports')
THERMO = Path(r'G:\HM\hermes-home\cache\thermometer')
SCRIPTS = Path(r'G:\HM\hermes-home\scripts')
_REPORT_ASOF = None

def esc(x): return html.escape(str(x))

# ---------- 数据加载 ----------
def _norm_trade_date(value):
    s = str(value).strip()
    if s.endswith('.0'):
        s = s[:-2]
    return s[:8] if len(s) >= 8 and s[:8].isdigit() else ''

def load_mechanism_json():
    # 优先生产命名的日期文件；旧的“演示”文件只作为兼容回退，避免同日旧JSON遮蔽新结果。
    jsons = sorted(glob.glob(str(REPORTS / '温度门控机制_[0-9]*.json')))
    if not jsons:
        jsons = sorted(glob.glob(str(REPORTS / '温度门控机制_演示_*.json')))
    if not jsons: return {}
    try: return json.load(open(jsons[-1], encoding='utf-8'))
    except Exception: return {}

def load_thermo_latest(cat):
    """读 多窗口_行业.csv / 多窗口_主题.csv 的最新交易日截面"""
    f = THERMO / (f'多窗口_{cat}.csv')
    if not f.exists(): return pd.DataFrame()
    df = pd.read_csv(f, encoding='utf-8-sig')
    if df.empty: return df
    d = df['trade_date'].max()
    out = df[df['trade_date'] == d].copy()
    out.attrs['trade_date'] = _norm_trade_date(d) or str(d)
    return out

def load_temp_conditions():
    """读市场温度多因子(赚钱/量能/情绪三因子分位)"""
    try:
        sys.path.insert(0, str(SCRIPTS))
        import thermo_market_conditions as mkt
        r = mkt.compute()
        return r or {}
    except Exception:
        return {}

# ---- 候选因子数据 (读 Serenity 源CSV: pos60/斜率/绿柱/形状分等) ----
# v3.6(2026-09-04 CC复审N1根治): 源头目录日期不能写死(20260902), 用glob取最新
#   macd_strategy_four_way 目录, 否则下个交易日重扫后"54只"会幻影沿用昨日快照。
import glob as _glob
def _latest_serenity_csv():
    pat = r'G:\AI\Project\Serenity\runtime_data\reports\*_macd_strategy_four_way\current_strategy_candidates_with_industry.csv'
    files = sorted(_glob.glob(pat))
    return files[-1] if files else ''
SERENITY_CSV = _latest_serenity_csv()
_serenity_df = None
def load_serenity_candidates():
    """读源头扫描候选CSV → {ts_code: {因子字段}}"""
    global _serenity_df
    if _serenity_df is None:
        try:
            _serenity_df = pd.read_csv(SERENITY_CSV, encoding='utf-8-sig', dtype={'ts_code': str})
        except Exception:
            _serenity_df = pd.DataFrame()
    return _serenity_df

def candidate_factor(ts_code, field):
    """取单只候选的某个技术因子(源头扫描值)"""
    df = load_serenity_candidates()
    if df.empty: return None
    row = df[df['ts_code'] == ts_code]
    if row.empty or field not in df.columns: return None
    v = row.iloc[0][field]
    return v if pd.notna(v) else None

# ---- 净利yoy (读QDH财务/质量判定) ----
_net_cache = {}
def candidate_yoy(ts_code):
    """读中报净利yoy%"""
    cache_key = (ts_code, _REPORT_ASOF)
    if cache_key in _net_cache: return _net_cache[cache_key]
    try:
        sys.path.insert(0, str(SCRIPTS))
        from quality_fn_qdh import _period_net_profit, resolve_periods
        latest, prior = resolve_periods(ts_code, _REPORT_ASOF)
        if latest is None or prior is None:
            _net_cache[cache_key] = None
            return None
        cur = _period_net_profit(ts_code, latest, _REPORT_ASOF)
        pri = _period_net_profit(ts_code, prior, _REPORT_ASOF)
        if cur is None or pri is None or pri == 0: _net_cache[cache_key] = None
        else: _net_cache[cache_key] = (cur - pri) / abs(pri) * 100
    except Exception:
        _net_cache[cache_key] = None
    return _net_cache[cache_key]

def validate_input_asof(mechanism):
    """报告只接受与机制温度同一交易日的候选源，拒绝静默复用旧快照。"""
    temp_asof = _norm_trade_date((mechanism.get('温度') or {}).get('asof'))
    sdf = load_serenity_candidates()
    if not temp_asof or sdf.empty or 'signal_trade_date' not in sdf.columns:
        raise RuntimeError('报告输入缺少机制asof或候选源signal_trade_date')
    dates = sorted({_norm_trade_date(v) for v in sdf['signal_trade_date'].dropna()})
    dates = [v for v in dates if v]
    if dates != [temp_asof]:
        raise RuntimeError(f'报告候选源日期{dates or "空"}与机制asof{temp_asof}不一致，拒绝生成')
    trace = mechanism.get('溯源') or {}
    trace_dates = trace.get('src_signal_trade_dates')
    if trace_dates and [_norm_trade_date(v) for v in trace_dates] != [temp_asof]:
        raise RuntimeError('机制JSON溯源日期与温度asof不一致，拒绝生成')
    return {'asof': temp_asof, 'signal_trade_dates': dates, 'rows': int(len(sdf)), 'unique': int(sdf['ts_code'].nunique()) if 'ts_code' in sdf.columns else None}

def build_select_reason(ts_code, name, quality=None):
    """生成"选中原因"量化+财务说明
    CC(9/3): quality='扭亏'时(去年同期亏损今年扭亏), 不显示虚高yoy%, 改标"扭亏为盈"中性表述。
    """
    pos60 = candidate_factor(ts_code, 'pos60'); dd250 = candidate_factor(ts_code, 'dd250')
    gd = candidate_factor(ts_code, 'green_days'); gp = candidate_factor(ts_code, 'green_peak_pct')
    slope = candidate_factor(ts_code, 'slope3_pct'); accel = candidate_factor(ts_code, 'slope_accel_pct')
    shape = candidate_factor(ts_code, 'shape_score'); yoy = candidate_yoy(ts_code)
    try:
        from quality_fn_qdh import period_label
        report_label = period_label(ts_code, _REPORT_ASOF)
    except Exception:
        report_label = '财报'
    parts = []
    if pos60 is not None: parts.append(f'60日位置仅{pos60:.0f}%(低位)')
    if dd250 is not None: parts.append(f'距250日高点回撤{dd250:.0f}%')
    if gd is not None: parts.append(f'MACD绿柱{gd:.0f}天(水下蓄势)')
    if slope is not None and accel is not None: parts.append(f'DIF斜率{slope*10:.0f}‰+加速{accel*10:.0f}‰(拐头)')
    if shape is not None: parts.append(f'形态分{shape:.0f}')
    # ⚠️ CC修正: 扭亏(去年同期亏损)不显示虚高yoy%, 用中性表述; 只有真"错杀"才显示高增%
    if quality == '扭亏':
        parts.append(f'{report_label}扭亏为盈(去年同期亏损,非同比高增)')
    elif yoy is not None:
        parts.append(f'{report_label}净利yoy+{yoy:.0f}%(错杀)')
    tech = '；'.join(parts)
    return tech

# ---------- HTML 组件 ----------
def collapse(title, body, default_open=False):
    """折叠块: <details> 默认收起"""
    open_attr = ' open' if default_open else ''
    return (f'<details{open_attr} class="fold">'
            f'<summary>{esc(title)} <span class="fold-hint">▾ 展开</span></summary>'
            f'<div class="fold-body">{body}</div></details>')

# ---- 板块详情弹卡 (点击板块行弹出) ----
# 注意: 这些是纯字符串常量(非f-string), JS花括号不用转义。
MODAL_HTML = """<div class="detail-overlay" id="detailOverlay" onclick="if(event.target===this)closeDetail()">
  <div class="detail-card">
    <button class="dc-close" onclick="closeDetail()">&times;</button>
    <h4 id="dcName"></h4>
    <div class="dc-sub" id="dcCat"></div>
    <div class="dc-badges"><span class="dc-bag" id="dcLv"></span><span class="dc-bag" id="dcHotbag"></span></div>
    <div class="dc-heat">热度 <span id="dcHeat"></span></div>
    <div id="dcRows"></div>
  </div>
</div>
<script>
function showDetail(el){
  var name=el.getAttribute('data-name')||'';
  var cat=el.getAttribute('data-cat')||'';
  var heat=el.getAttribute('data-heat')||'—';
  var lv=el.getAttribute('data-lv')||'';
  var chg=el.getAttribute('data-chg')||'—';
  var winStr=el.getAttribute('data-win')||'';
  var rows=winStr.split('|');
  document.getElementById('dcName').textContent=name;
  document.getElementById('dcCat').textContent=cat+'板块 ｜ '+lv+'档';
  var lvEl=document.getElementById('dcLv'); lvEl.textContent=lv;
  lvEl.className='dc-bag '+(lv==='灼热'||lv==='热'?'hot':(lv==='温'?'lukewarm':'cold'));
  document.getElementById('dcHeat').textContent=heat;
  var hotEl=document.getElementById('dcHotbag');
  var hf=parseFloat(heat); hotEl.textContent=(hf>=75?'🔥灼热':hf>=55?'🌤热':hf>=30?'🌥温':'🧊冷');
  hotEl.className='dc-bag '+(hf>=55?'hot':(hf>=30?'lukewarm':'cold'));
  var html='';
  for(var i=0;i<rows.length;i++){var p=rows[i].split(':');if(p.length===2){
    var v=isNaN(parseFloat(p[1]))?'—':p[1]+'%';
    var col=parseFloat(p[1])>=0?'#c56f52':'#3b7a57';
    html+='<div class="dc-row"><span>'+p[0]+'窗口</span><b style="color:'+col+'">'+v+'</b></div>';
  }}
  document.getElementById('dcRows').innerHTML=html;
  document.getElementById('detailOverlay').classList.add('open');
}
function closeDetail(){document.getElementById('detailOverlay').classList.remove('open');}
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeDetail();});
</script>"""

def build_temp_card(temp, c):
    """顶部市场温度卡: 多因子完整(不折叠)"""
    # temp = 机制JSON里的温度; c = thermo_market_conditions 多因子
    up = c.get('up_ratio_pctile'); amt = c.get('amt_pctile'); emo = c.get('emo_score')
    delta = c.get('delta')
    def pct(v): return f'{v}' if v is not None else '—'
    # 三因子行
    fac = ('<div class="metric-row sub-factors">'
           f'<div class="metric"><div class="label">💰 赚钱效应(40%)</div><div class="val">{pct(up)}<span class="unit">分位</span></div></div>'
           f'<div class="metric"><div class="label">📈 量能(30%)</div><div class="val">{pct(amt)}<span class="unit">分位</span></div></div>'
           f'<div class="metric"><div class="label">🔥 情绪(30%)</div><div class="val">{pct(emo)}<span class="unit">分位</span></div></div>'
           f'<div class="metric"><div class="label">↕ 较昨日</div><div class="val" style="color:{"#a5322a" if (delta or 0)<0 else "#1b6ca8"}">{"" if delta is None else ("+"+str(delta) if delta>=0 else str(delta))}</div></div>'
           '</div>')
    delta_txt = f'（较昨日{("+"+str(delta)) if (delta or 0)>=0 else str(delta)}）' if delta is not None else ''
    display_temp = temp.get('temp', '?')
    display_level = temp.get('level', '?')
    display_asof = _norm_trade_date(temp.get('asof')) or str(temp.get('asof', '?'))
    factor_asof = _norm_trade_date(c.get('date')) if c else ''
    factor_note = f'｜ 因子计算asof {factor_asof}' if factor_asof and factor_asof != display_asof else ''
    body = ('<div class="metric-row">'
            f'<div class="metric"><div class="label">🌡️ 市场温度</div><div class="val big">{display_temp}°</div></div>'
            f'<div class="metric"><div class="label">温度档</div><div class="val" style="color:{"#a5322a" if display_level in ("偏冷","极冷","过热") else "#1b6ca8"}">{display_level}</div></div>'
            f'<div class="metric"><div class="label">数据asof</div><div class="val" style="font-size:15px">{display_asof}</div></div>'
            '</div>'
            + fac
            + '<div class="note">上涨占比 <b>' + esc(str(c.get('up_ratio','?'))) + '%</b> ｜ 中位涨跌 <b>' + esc(str(c.get('med','?'))) + '%</b> ｜ 成交 ' + esc(f"{c.get('amt_yi',0):.0f}") + '亿 ｜ 涨停 ' + esc(str(c.get('lim_up','?'))) + ' 跌停 ' + esc(str(c.get('lim_down','?'))) + ' ｜ 三因子=各指标在近60日分位数' + factor_note + '</div>')
    return body

def build_market_analysis(df_industry):
    """市场分析段落(基于真实板块数据): 主要板块/热门/遇冷/机会所在"""
    x = df_industry.drop_duplicates('名称')
    # 热门: 今日涨幅+3日确认; 遇冷: 今日跌幅
    hot = x.sort_values('今', ascending=False).head(6)
    cold = x.sort_values('今', ascending=True).head(6)
    # 机会: 低温但3日/1周真涨(未爆炒但资金进入) + 灼热中的强者
    def _li(r):
        name = esc(r['名称']); j = esc(f"{r['今']:+.1f}")
        d3 = esc(f"{r['3日']:+.1f}"); w1 = esc(f"{r['1周']:+.1f}")
        hh = esc(f"{r['热度']:.0f}"); dv = esc(r['档位'])
        return f'<li><b>{name}</b> 今{j}% 3日{d3}% 1周{w1}% <span class="muted">热{hh}·{dv}</span></li>'
    h_rows = ''.join(_li(r) for _,r in hot.iterrows())
    c_rows = ''.join(_li(r) for _,r in cold.iterrows())
    # 机会: 低温但3日/1周真涨(未爆炒但资金进场)
    opp = x[(x['热度']<70)&(x['3日']>1)&(x['1周']>1)].sort_values('1周', ascending=False).head(6)
    o_rows = ''.join(_li(r) for _,r in opp.iterrows())
    # 3日连跌(回避/观察)
    cold3 = x[(x['热度']>20)&(x['3日']<-3)].sort_values('3日').head(5)
    c3_rows = ''.join(_li(r) for _,r in cold3.iterrows())
    # 3日连跌(回避/观察) note: 动态取cold3实际数据, 不硬编码板块名/数字
    if not cold3.empty:
        worst_parts = []
        for _, r in cold3.head(3).iterrows():
            nm = esc(r['名称']); d3 = f"{r['3日']:+.1f}"
            worst_parts.append(f"{nm}(3日{d3}%)")
        avoid_note = '3日累计下跌已破位，趋势走弱，偏冷日不接飞刀：' + '、'.join(worst_parts)
    else:
        avoid_note = '3日累计下跌板块较少，今日无明确破位回避标的'
    return ('<div class="card"><h3>🏆 今日热门板块</h3><ul>' + h_rows + '</ul></div>'
            '<div class="card"><h3>🧊 今日遇冷板块</h3><ul>' + c_rows + '</ul></div>'
            '<div class="card"><h3>💎 投资机会所在（低温 + 3日/1周真涨）</h3><ul>' + o_rows + '</ul>'
            '<div class="note">这些板块热度不高(未爆炒)但资金已连续进驻(3日/1周涨幅真实为正)，是"生气但没被疯抢"的潜在机会区。'
            '<b>结合温度计纪律：偏冷档只低吸、不追高。</b></div></div>'
            '<div class="card"><h3>⛔ 需回避 / 观察（3日连跌）</h3><ul>' + c3_rows + '</ul>'
            '<div class="note">' + esc(avoid_note) + '</div></div>')

def build_thermo_blocks(df_ind, df_ths):
    """折叠的全板块+主题列表, 每行可点击弹出详情卡片(全窗口涨幅+热度+档位+变化)"""
    allwins = ['今','3日','1周','2周','1月','2月','3月','6月','YTD']  # 全部窗口供详情弹卡
    def table(cat_df, title, cat_cls):
        if cat_df.empty: return f'<div class="note">温度计 {title} 数据缺失</div>'
        win = ['今','3日','1周']
        band = {'灼热':'🔥','热':'🔥','温':'🌤','冷':'🧊'}
        rows = ''
        for _, r in cat_df.sort_values('热度', ascending=False).iterrows():
            chg = f"{r['变化']:+.0f}" if pd.notna(r['变化']) else 'NA'
            chgcol = '#3fb950' if (pd.notna(r['变化']) and r['变化']>0) else '#f85149'
            w = ''.join(f"<td>{r[c]:+.1f}%</td>" if pd.notna(r[c]) else '<td>NA</td>' for c in win)
            # 详情卡数据: 全窗口涨幅|热度|档位|变化|名称
            win_attr = '|'.join(f"{c}:{r[c]:+.1f}" if pd.notna(r[c]) else f"{c}:NA" for c in allwins)
            name_esc = html.escape(str(r['名称']))
            heat = f"{r['热度']:.0f}"
            lv = str(r['档位'])
            # 板块行 → 点击弹详情
            rows += (f"<tr class='srow' onclick=\"showDetail(this)\" data-cat='{cat_cls}' "
                     f"data-name='{name_esc}' data-heat='{heat}' data-lv='{lv}' data-chg='{chg}' data-win='{win_attr}'>"
                     f"<td><span class='cat-link'>{band.get(r['档位'],'')} {name_esc}</span></td>"
                     f"<td><b>{heat}</b></td><td>{esc(lv)}</td>"
                     f"<td style='color:{chgcol}'>{chg}</td>{w}</tr>")
        hdr = '<tr><th>板块(点击看详情)</th><th>热度</th><th>档位</th><th>变化</th><th>今</th><th>3日</th><th>1周</th></tr>'
        return f'<table class="srow-tbl">{hdr}{rows}</table>'
    ind_date = df_ind.attrs.get('trade_date', '未知') if not df_ind.empty else '缺失'
    ths_date = df_ths.attrs.get('trade_date', '未知') if not df_ths.empty else '缺失'
    h = [collapse(f'🏭 申万行业(二级) 全板块（{len(df_ind) if not df_ind.empty else 0}个，截至{ind_date}）', table(df_ind,'行业','行业'))]
    h.append(collapse(f'💎 同花顺题材 全列表（{len(df_ths) if not df_ths.empty else 0}个，截至{ths_date}）', table(df_ths,'主题','主题')))
    return ''.join(h)

def build_mechanism(d):
    """策略运行结果 + 分析: 温度→门控→策略→候选 因果链 + 按策略分组的候选(带选中原因/投资分析)"""
    from collections import Counter
    temp = d.get('温度', {}); gate = d.get('门控', {}); cb = d.get('熔断', {})
    cand = d.get('候选', {}) or {}
    # asof双轨(CC必做项1): 温度asof来自机制JSON, 策略信号asof来自源头CSV的signal_trade_date
    temp_asof = _norm_trade_date(temp.get('asof')) or str(temp.get('asof', '?'))
    strat_asof = '?'
    sdf = load_serenity_candidates()
    if not sdf.empty and 'signal_trade_date' in sdf.columns:
        dates = sorted({_norm_trade_date(v) for v in sdf['signal_trade_date'].dropna()})
        dates = [v for v in dates if v]
        strat_asof = dates[0] if len(dates) == 1 else ('混合日期' if dates else '?')
    # v3.7(CC全面审查#14修复): 源头已重扫到当日(strat==temp)时说"已重扫候选",
    #   否则说"未重扫"(T-1快照)。修正旧的"未重扫候选"模板在已重扫日自我否定的错误。
    has_rescanned = (strat_asof == temp_asof and strat_asof != '?')
    asof_state = '已重扫候选至当日' if has_rescanned else f'{strat_asof}收盘未重扫候选(T-1快照)'
    h = []
    # ── 因果链卡(不折叠, 核心逻辑) ──
    gate_lv = gate.get('档', '?')
    # v3.6(v3.7 CC复审C残留修复): 源头L1扫描数动态读取Serenity CSV(不再硬编码"54只")。
    #  v3.7: 同一票可命中多策略(L0+L1)在CSV重复行, 按ts_code去重后计数, 与机制JSON口径一致(防"29只实为28只")。
    src_l1 = 0
    sdf_l1 = load_serenity_candidates()
    if not sdf_l1.empty:
        src_l1 = sdf_l1['ts_code'].nunique() if 'ts_code' in sdf_l1.columns else len(sdf_l1)
    l1_txt = f'{src_l1}只低位金叉形态' if src_l1 else '源头L1候选'
    gate_txt = '、'.join(str(x) for x in gate.get('策略', [])) or '无'
    source_strategy_counts = Counter(str(x) for x in sdf_l1.get('strategy', []) if str(x) not in ('', 'nan')) if not sdf_l1.empty else Counter()
    source_strategy_txt = '、'.join(f'{k} {v}行' for k, v in sorted(source_strategy_counts.items())) or '无可用策略标签'
    cand_strategy_counts = Counter(src for v in cand.values() for src in (v.get('src') or ['?']))
    cand_quality_counts = Counter(str(v.get('质量', '?')) for v in cand.values())
    cand_tier_counts = Counter(str(v.get('档位', '?')) for v in cand.values())
    cand_strategy_txt = '、'.join(f'{k} {v}只' for k, v in sorted(cand_strategy_counts.items())) or '无'
    cand_quality_txt = '、'.join(f'{k} {v}只' for k, v in sorted(cand_quality_counts.items())) or '无'
    cand_tier_txt = '、'.join(f'{k} {v}只' for k, v in sorted(cand_tier_counts.items())) or '无'
    chain = ('<div class="card chain"><h3>🧭 选股逻辑链</h3><div class="chain-flow">'
             f'<div class="chain-step"><div class="chain-icon">🌡️</div><b>温度</b><br>{esc(str(temp.get("temp","?")))}°·{esc(gate_lv)}</div>'
             '<div class="chain-arrow">→</div>'
             f'<div class="chain-step"><div class="chain-icon">🚦</div><b>门控</b><br>{esc(gate_lv)}档<br><span class="muted">{esc("、".join(gate.get("策略",[])))}</span></div>'
             '<div class="chain-arrow">→</div>'
             f'<div class="chain-step"><div class="chain-icon">🎯</div><b>策略筛选</b><br>{esc("、".join(gate.get("策略",[])))}<br><span class="muted">全市场逐只扫描</span></div>'
             '<div class="chain-arrow">→</div>'
             f'<div class="chain-step"><div class="chain-icon">✅</div><b>质量核验</b><br>财务质量门<br><span class="muted">错杀/扭亏/待验证</span></div>'
             '<div class="chain-arrow">→</div>'
              f'<div class="chain-step"><div class="chain-icon">📋</div><b>候选</b><br>{len(cand)}只<br><span class="muted">{esc(cand_tier_txt)}</span></div>'
             '</div>'
              f'<div class="note">逻辑：<b>温度决定门控</b>（本次放行：{esc(gate_txt)}）→ <b>门控决定策略范围</b>→ '
              f'<b>源头扫描</b>（去重后{l1_txt}；原始策略分布：{esc(source_strategy_txt)}）→ '
              f'<b>财务质量核验</b>→ <b>{len(cand)}只通过</b>（候选策略：{esc(cand_strategy_txt)}；质量：{esc(cand_quality_txt)}）。<br>'
             '<span class="muted">⏱️ asof双轨：温度 {{TEMP_ASOF}}收盘 ｜ 策略技术信号 {{STRAT_ASOF}}收盘（{{ASOF_STATE}}，仅供当日盘前决策参考）</span></div></div>')
    chain = chain.replace('{{TEMP_ASOF}}', temp_asof).replace('{{STRAT_ASOF}}', strat_asof).replace('{{ASOF_STATE}}', asof_state)
    h.append(chain)

    # ── 运行概览卡(不折叠) ──
    h.append('<div class="card"><div class="metric-row">'
             f'<div class="metric"><div class="label">门控档</div><div class="val">{esc(gate.get("档","?"))}</div></div>'
             f'<div class="metric"><div class="label">启用策略</div><div class="val" style="font-size:16px">{esc("、".join(gate.get("策略",[])))}</div></div>'
             f'<div class="metric"><div class="label">总仓上限</div><div class="val">≤{esc(gate.get("总仓上限%","?"))}%</div></div>'
             f'<div class="metric"><div class="label">熔断</div><div class="val" style="color:{"#a5322a" if cb.get("触发") else "#1b6ca8"}">{"⚠️ 触发" if cb.get("触发") else "无"}</div></div>'
             '</div></div>')

    # ── 候选: 按策略分组 + 选中原因 + 投资分析 ──
    if cand:
        # 按策略来源分组
        from collections import defaultdict
        by_strat = defaultdict(list)
        for c, hh in cand.items():
            if not isinstance(hh, dict): continue
            src = hh.get('src') or ['L1']
            strat_key = 'L1低位金叉' if 'L1' in src else '+'.join(src)
            by_strat[strat_key].append((c, hh))
        strat_blocks = ''
        for strat_key, items in by_strat.items():
            rows = ''
            for c, hh in sorted(items, key=lambda x: -(x[1].get('score',0))):
                name = hh.get('name', c)
                q = hh.get('质量', '')
                reason = build_select_reason(c, name, q)
                op = hh.get('档位', '')
                v = hh.get('V型分批') or {}
                pos60 = candidate_factor(c, 'pos60')
                # 投资分析文字
                invest = ('<span class="muted">选中：</span>' + (esc(reason) if reason else '低位+错杀')
                          + ' ｜ <span class="muted">档位</span> ' + esc(op)
                          + ' ｜ <span class="muted">质量</span> ' + esc(q)
                          + ' ｜ <span class="muted">仓位</span> ' + esc(str(hh.get('仓位%',''))) + '%'
                          + ' ｜ <span class="muted">V型</span> 首' + esc(str(v.get('首笔','-'))) + '%+加' + esc(str(v.get('加仓','-'))) + '%')
                rows += (f'<tr><td><b>{esc(name)}</b><br><span class="muted">{esc(c)}</span></td>'
                         f'<td><span class="src-badge">{esc(strat_key)}</span></td>'
                         f'<td>S={esc(hh.get("score",""))}</td><td>{esc(op)}</td><td>{esc(q)}</td>'
                         f'<td class="reason">{invest}</td></tr>')
            strat_blocks += ('<div class="strat-group"><h4>🎯 ' + esc(strat_key) + ' 候选（' + str(len(items)) + '只）</h4>'
                             f'<table><tr><th>标的</th><th>来源策略</th><th>共振S</th><th>档位</th><th>质量</th><th>选中原因 / 投资分析</th></tr>{rows}</table></div>')
        cand_html = strat_blocks
    else:
        cand_html = (f'<div class="note"><b>候选为空</b>（{esc(gate_lv)}档：真实候选经质量核验均未达买入标准）'
                     f'<br>这是机制 fail-safe 的诚实表现——{esc(gate_lv)}档不强行荐票。</div>')
    h.append(collapse('🎯 策略筛选出的候选（' + str(len(cand)) + '只）', cand_html, default_open=bool(cand)))

    # ── 策略结果分析段(不折叠) ──
    n_cand = len(cand)
    n_core = sum(1 for hh in cand.values() if isinstance(hh,dict) and hh.get('档位')=='核心出击')
    n_obs = sum(1 for hh in cand.values() if isinstance(hh,dict) and hh.get('档位')=='观察')
    mode_note = '；'.join([
        f'门控放行 {gate_txt}',
        f'总仓上限≤{gate.get("总仓上限%", "?")}%',
        f'T系数={gate.get("T", "?")}'
    ])
    if n_cand:
        conclusion = (f'通过候选的来源为 <b>{esc(cand_strategy_txt)}</b>，质量分布为 <b>{esc(cand_quality_txt)}</b>；'
                      f'当前属于观察/研究结果，不等同于买入信号，执行上受“{esc(mode_note)}”约束。')
    else:
        conclusion = '本次没有通过质量门的候选，机制保持空结果，不因缺少候选而人工补票。'
    analysis = ('<div class="card"><h3>📊 策略结果分析</h3><p style="line-height:1.9">'
                f'今日温度 <b>{esc(str(temp.get("temp","?")))}°·{esc(gate_lv)}</b>，{esc(mode_note)}。'
                f'源头候选去重后 {l1_txt}，原始策略分布为 <b>{esc(source_strategy_txt)}</b>；经真实财务质量核验后，最终 <b>{n_cand}只</b>通过（{n_obs}观察/{n_core}核心）。'
                f'<br><b>结论</b>：{conclusion}'
                f'今日熔断{"⚠️已触发(冻结新开仓)" if cb.get("触发") else "未触发"}。<br>'
                f'<span class="muted">⏱️ asof双轨：温度 {temp_asof}收盘 ｜ 策略技术信号 {strat_asof}收盘（{asof_state}，仅供当日盘前决策参考）</span></p></div>')
    h.append(analysis)
    return ''.join(h)

def build_battle_plan(d):
    """作战计划(含持仓) — 折叠
    v3.6(2026-09-04): ①日期动态 ②删除手工参考表(江波龙/兆易等硬编码演示标的,用户明确不要)
    ③持仓全景从当前持仓CSV动态读取。操作要点为盘前人工维护的纪律,需结合当日判断写入。
    """
    # 日期动态(用机制JSON的asof, 不再写死昨天)
    asof = str((d.get('温度') or {}).get('asof', '')) or datetime.date.today().strftime('%Y%m%d')
    try:
        import datetime
        dt = datetime.datetime.strptime(asof, '%Y%m%d')
        wd = '一二三四五六日'[dt.weekday()]
        date_str = f"{asof[:4]}-{asof[4:6]}-{asof[6:]}（周{wd}）盘前"
    except Exception:
        date_str = f"{asof[:4]}-{asof[4:6]}-{asof[6:]}盘前"

    # 持仓全景: 从当前持仓CSV读取(动态,不再硬编码昨日7只)
    holdings = []
    HOLD_PATH = r'G:\AI\Project\Serenity\runtime_data\status\current_holdings_accepted_latest.csv'
    try:
        import os as _os
        if _os.path.exists(HOLD_PATH):
            hdf = pd.read_csv(HOLD_PATH, encoding='utf-8-sig', dtype={'code': str})
            for _, r in hdf.iterrows():
                code = str(r.get('code','')); name = str(r.get('name',''))
                cost = r.get('cost_price'); ref = r.get('reference_price')
                note = str(r.get('source_note',''))
                cost_s = f"{cost:.2f}" if pd.notna(cost) else '-'
                ref_s = f"{ref:.2f}" if pd.notna(ref) else '-'
                holdings.append((name, code, ref_s, '-', '🟡持仓', note[:20]))
    except Exception as e:
        print(f"  ⚠️ 读持仓CSV失败: {e}")
    if not holdings:
        holdings = [('（无持仓数据）','-','-','-','🟡','请维护持仓CSV')]

    # 操作要点: 基于机制候选+温度档动态生成框架, 具体买卖由盘前人工确认
    gate = d.get('门控', {}); temp = d.get('温度', {})
    gate_lv = gate.get('档', '?'); t = temp.get('temp', '?')
    op_points = [
        f"温度 {t}°·{gate_lv}，门控{'、'.join(gate.get('策略',[]))}（低吸形态），总仓上限{gate.get('总仓上限%','?')}%（{gate.get('T','?')}系数）",
    ]
    cand = d.get('候选', {}) or {}
    if cand:
        op_points.append(f"机制候选{len(cand)}只均观察档：{'、'.join(str(h.get('name')) for h in cand.values())}（错杀/扭亏低位，可低吸观察）")
    else:
        op_points.append('机制候选为空(fail-safe)，不强行荐票，等温度转暖')
    op_points += [
        '持仓纪律：逻辑失效、关键支撑破位或风险收益比恶化时，执行减仓/退出；深套标的也要设反弹减仓线',
        '新增开仓：偏冷档只低吸正确标的，不追高，仓位从严',
        '回避：非机制输出/手工参考标的一律不作为买入依据',
    ]

    h = [f'<h2>🏁 作战计划 {date_str}</h2>']
    h.append('<div class="card"><ul>' + ''.join(f'<li>{esc(x)}</li>' for x in op_points) + '</ul></div>')
    hr = ''.join(f"<tr><td>{esc(n)}</td><td>{esc(c)}</td><td>{esc(p)}</td><td>{esc(t2)}</td><td>{esc(s)}</td><td>{esc(o)}</td></tr>" for n,c,p,t2,s,o in holdings)
    h.append(collapse('📋 持仓全景（'+str(len(holdings))+'只）', f'<table><tr><th>标的</th><th>代码</th><th>参考价</th><th>今日</th><th>状态</th><th>说明</th></tr>{hr}</table>'))
    # v3.6: 已删除手工参考表(江波龙/兆易等演示标的)
    h.append('<div class="card" style="border-left:3px solid var(--accent)"><p style="font-size:12.5px;color:var(--muted)">📌 作战计划由机制候选+温度档+持仓纪律动态生成，<b>不包含任何手工/演示标的</b>（江波龙/兆易等手工参考表已移除）；具体买卖点结合盘前人工判断执行。</p></div>')
    return ''.join(h)

# ---------- 主流程 ----------
def main():
    global _REPORT_ASOF
    d = load_mechanism_json()
    if not d:
        raise RuntimeError('未找到可用的温度门控机制JSON，拒绝用历史文件生成报告')
    temp = d.get('温度', {})
    asof = temp.get('asof', datetime.date.today().strftime('%Y%m%d'))
    _REPORT_ASOF = _norm_trade_date(asof) or str(asof)
    validate_input_asof(d)
    date_cn = f'{asof[:4]}-{asof[4:6]}-{asof[6:]}'
    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')

    # 数据
    c = load_temp_conditions()           # 温度多因子
    df_ind = load_thermo_latest('行业')
    df_ths = load_thermo_latest('主题')
    board_dates = [x.attrs.get('trade_date') for x in (df_ind, df_ths) if not x.empty]
    stale_board_note = ''
    if board_dates and any(x != _REPORT_ASOF for x in board_dates):
        stale_board_note = ('板块/主题相对热度表截至 <b>' + esc('、'.join(sorted(set(board_dates)))) +
                            '</b>，与机制温度 as-of ' + esc(_REPORT_ASOF) + ' 不同；以下板块表仅作观察，不作为当日门控依据。')
    elif not board_dates:
        stale_board_note = '板块/主题相对热度表缺失，本报告不据此推断板块强弱。'

    # 1. 顶部温度卡(不折叠)
    temp_body = build_temp_card(temp, c)
    # 2. 温度计情况说明(不折叠)
    report_level = str(temp.get('level', c.get('level', '?')))
    amt_pctile = c.get('amt_pctile')
    if report_level in ('偏冷', '极冷'):
        level_note = '市场偏冷，资金和风险偏好仍需观察，新增仓位应从严。'
    elif report_level in ('偏热', '过热'):
        level_note = '市场偏热，优先防止追高并关注持仓止盈纪律。'
    else:
        level_note = '市场处于中性区间，按板块强弱和策略共振程度控制仓位。'
    if amt_pctile is not None and float(amt_pctile) < 30:
        amount_note = '量能分位偏低，成交收缩。'
    elif amt_pctile is not None and float(amt_pctile) > 70:
        amount_note = '量能分位偏高，需区分放量上攻与高位换手。'
    else:
        amount_note = '量能分位处于中性区间。'
    temp_summary = ('<div class="card"><h3>🌡️ 温度计情况说明</h3>'
                    '<p style="line-height:1.9">市场综合温度 <b>' + esc(str(temp.get('temp','?'))) + '°·' + esc(report_level) + '</b>。'
                    '温度由三因子构成：<b>赚钱效应</b>' + esc(str(c.get('up_ratio_pctile','?'))) + '分位(上涨占比' + esc(str(c.get('up_ratio','?'))) + '%)、<b>量能</b>' + esc(str(c.get('amt_pctile','?'))) + '分位、<b>情绪</b>' + esc(str(c.get('emo_score','?'))) + '分位。'
                     + esc(level_note) + esc(amount_note) + stale_board_note + '</p></div>')
    # 3. 市场分析(不折叠)
    market = ('<h2>🔍 市场情况分析</h2>' + build_market_analysis(df_ind))
    # 4. 折叠的全板块/主题
    thermo_blocks = '<h2>🌈 全板块 / 全主题</h2>' + build_thermo_blocks(df_ind, df_ths)
    # 5. 策略结果
    mech = '<h2>🎛️ 策略运行结果</h2>' + build_mechanism(d)
    # 6. 作战计划(含持仓)
    battle = build_battle_plan(d)

    html_doc = f"""<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>每日A股综合报告 {date_cn}</title>
<style>
:root{{--bg:#f3efe6;--bg2:#efe9dc;--card:#fff;--border:#e2dccf;--text:#2a2730;--muted:#8a8f98;--accent:#c56f52;--green:#1b6ca8;--red:#a5322a;}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{background:var(--bg);color:var(--text);font-family:'Songti SC','Georgia','PingFang SC','Microsoft YaHei',serif;line-height:1.7;padding:28px 16px}}
.container{{max-width:1100px;margin:0 auto}}
.top-tags{{font-size:12px;color:var(--accent);letter-spacing:.05em;margin-bottom:10px}}
h1{{font-size:26px;margin-bottom:4px}}.sub{{color:var(--muted);font-size:12.5px;margin-bottom:14px}}
h2{{font-size:19px;margin:22px 0 10px;padding-left:12px;border-left:4px solid var(--accent)}}
h3{{font-size:15.5px;margin:4px 0 8px;color:var(--text)}}
.card{{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:14px}}
.hero{{background:linear-gradient(135deg,#fff,#f8f2e8)}}
.metric-row{{display:flex;gap:28px;flex-wrap:wrap}}
.metric-row.sub-factors{{margin-top:12px;padding-top:12px;border-top:1px dashed var(--border)}}
.metric .label{{font-size:12px;color:var(--muted);margin-bottom:2px}}
.metric .val{{font-size:20px;font-weight:700}}
.metric .val.big{{font-size:34px;color:var(--accent)}}
.metric .unit{{font-size:11px;color:var(--muted);font-weight:400;margin-left:2px}}
table{{width:100%;border-collapse:collapse;font-size:13px}}th,td{{padding:7px 9px;text-align:left;border-bottom:1px solid var(--border)}}
th{{color:var(--muted);font-weight:600;font-size:12px}}
.muted{{color:var(--muted)}}
.note{{font-size:12px;color:var(--muted);line-height:1.8;background:#faf7f0;padding:10px 12px;border-radius:6px}}
ul{{margin-left:20px;line-height:2}}
.success{{color:var(--green)}}.danger{{color:var(--red)}}
details.fold{{background:var(--card);border:1px solid var(--border);border-radius:8px;margin-bottom:12px;overflow:hidden}}
details.fold summary{{cursor:pointer;padding:12px 16px;font-weight:700;font-size:14.5px;background:var(--bg2);list-style:none;display:flex;justify-content:space-between;align-items:center}}
details.fold summary::-webkit-details-marker{{display:none}}
details.fold summary .fold-hint{{font-size:11px;color:var(--muted);font-weight:400}}
details.fold .fold-body{{padding:12px 16px;overflow-x:auto}}
.chain-flow{{display:flex;align-items:stretch;gap:6px;flex-wrap:wrap;margin:10px 0 14px}}
.chain-step{{flex:1;min-width:120px;background:#faf7f0;border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center;font-size:13px;line-height:1.5}}
.chain-step b{{font-size:14px}}
.chain-icon{{font-size:20px;display:block;margin-bottom:4px}}
.chain-arrow{{align-self:center;font-size:20px;color:var(--accent);font-weight:700}}
.src-badge{{display:inline-block;background:#f3e1d8;color:var(--accent);font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px}}
.strat-group{{margin-bottom:10px}}
.strat-group h4{{margin:10px 0 6px;font-size:14px;color:var(--accent)}}
td.reason{{font-size:12.5px;line-height:1.7;max-width:520px}}
/* 板块详情弹卡 */
.srow{{cursor:pointer;transition:background .15s}}
.srow:hover{{background:#faf4ec}}
.cat-link{{color:var(--accent);font-weight:600}}
.detail-overlay{{display:none;position:fixed;inset:0;background:rgba(42,39,48,.45);z-index:1000;align-items:center;justify-content:center}}
.detail-overlay.open{{display:flex}}
.detail-card{{background:#fff;border:1px solid var(--border);border-radius:10px;padding:20px 24px;max-width:440px;width:92%;box-shadow:0 12px 40px rgba(0,0,0,.25)}}
.detail-card h4{{font-size:18px;margin:0 0 2px;color:var(--text)}}
.detail-card .dc-sub{{font-size:12px;color:var(--muted);margin-bottom:12px}}
.detail-card .dc-close{{float:right;cursor:pointer;font-size:20px;color:var(--muted);border:none;background:none}}
.dc-row{{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px}}
.dc-row span{{color:var(--muted)}}
.dc-heat{{font-size:22px;font-weight:800;color:var(--accent);margin:4px 0 10px}}
.dc-badges .dc-bag{{display:inline-block;padding:2px 9px;border-radius:10px;font-size:11.5px;font-weight:700;margin-right:6px}}
.dc-bag.hot{{background:#f3d5d2;color:#a5322a}}.dc-bag.lukewarm{{background:#fdf0dc;color:#b0710a}}
.dc-bag.cold{{background:#e2e5e8;color:#5f6b7a}}
.footer{{color:var(--muted);font-size:11px;margin-top:20px;text-align:center;border-top:1px solid var(--border);padding-top:12px}}
</style></head><body><div class="container">
<div class="top-tags">· 每日A股综合报告 ·</div>
<h1>📊 每日A股综合报告 {date_cn}</h1>
<div class="sub">温度计 + 市场分析 + 策略结果 + 作战计划 ｜ 个人研究非投资建议 ｜ 生成 {now} ｜ 数据以当天收盘+盘后为准</div>
{temp_body}
{temp_summary}
{market}
{thermo_blocks}
{mech}
{battle}
<div class="footer">每日A股综合报告 · 生成于 {now} ｜ 个人研究非投资建议 ｜ 温度计+市场分析+策略+作战计划</div>
{MODAL_HTML}
</div></body></html>"""

    out = REPORTS / f'每日A股综合报告_{asof}.html'
    out.write_text(html_doc, encoding='utf-8')
    print(f'HTML: {out} ({out.stat().st_size/1024:.1f} KB)')
    c2 = out.read_text(encoding='utf-8')
    assert '每日A股综合报告' in c2 and '赚钱效应' in c2 and '市场情况分析' in c2
    print('验证通过: 含温度多因子 + 市场分析')

if __name__ == '__main__':
    main()
