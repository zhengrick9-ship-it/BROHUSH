# -*- coding: utf-8 -*-
"""版B: Codex四策略候选 x 温度计板块热度 联动 → 投资分析+建议+作战计划
读取最新候选CSV，并按其中的 signal_trade_date 生成对应日期的联动报告。
本脚本: 加载四策略候选CSV + 温度计板块热度 + 个股→板块成分映射, 生成联动HTML。
"""
import pandas as pd, numpy as np, glob, os, html, json
from pathlib import Path

REPORTS = r'G:\HM\hermes-home\reports'
QDH_MEMBER = r'G:\AI\Data\QDataHub\data_store\index_membership'
_cross_files = sorted(glob.glob(r'G:\AI\Project\Serenity\runtime_data\reports\*_macd_strategy_four_way\current_strategy_candidates.csv'))
if not _cross_files:
    raise FileNotFoundError('未找到Serenity四策略候选CSV')
CROSS_CSV = _cross_files[-1]
THERM_CACHE = r'G:\HM\hermes-home\cache\thermometer'

# ---------- 1. 加载四策略当日候选 ----------
cand = pd.read_csv(CROSS_CSV, encoding='utf-8-sig', dtype={'ts_code': str})
print(f"四策略候选: {len(cand)} 行")
print("策略分布:", cand['strategy'].value_counts().to_dict())
print("信号状态分布:", cand['signal_state'].value_counts().to_dict())

def _norm_date(value):
    s = str(value).strip()
    if s.endswith('.0'):
        s = s[:-2]
    return s[:8] if len(s) >= 8 and s[:8].isdigit() else ''

signal_dates = sorted({_norm_date(v) for v in cand['signal_trade_date'].dropna()}) if 'signal_trade_date' in cand.columns else []
signal_dates = [v for v in signal_dates if v]
if len(signal_dates) != 1:
    raise ValueError(f'候选CSV必须是单一signal_trade_date，实际为{signal_dates or "缺失"}')
DATA_DATE = f'{signal_dates[0][:4]}-{signal_dates[0][4:6]}-{signal_dates[0][6:]}'
N_ALL = int(len(cand))
N_L1 = int((cand['strategy'] == 'L1_CROSS_WINDOW_PURE').sum()) if 'strategy' in cand.columns else 0
STRATEGY_TXT = '、'.join(f'{k} {v}行' for k, v in cand['strategy'].value_counts().items()) if 'strategy' in cand.columns else '无'

# ---------- 1.5 code↔name 一致性校验 (2026-09-03: 防上游CSV代码错位) ----------
# 佳驰案例: 旧CSV里 ts_code 与 name 错位(佳驰科技实为688708, 却曾显示301228), 报表不起校验会把活股代码张冠李戴。
# 方法: 用腾讯 smartbox 反查 name 对应的权威代码, 与 CSV ts_code 比对, 不一致则修正+告警。
# 已验证 smartbox 返回结构: "v_hint=\"sh~688708~\\u4f73\\u9a70\\u79d1\\u6280~jckj~GP-A-KCB\"" -> 前缀在parts[0](含sh/sz), 代码在parts[1], 名称(转义)在parts[2]。
import urllib.request
def _smartbox_authoritative(name):
    """返回 (code, 'SH'/'SZ', name) 或 None。code=6位数字。"""
    from urllib.parse import quote
    url = 'https://smartbox.gtimg.cn/s3/?v=2&q=' + quote(name) + '&t=all'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    data = urllib.request.urlopen(req, timeout=8).read().decode('gbk', 'replace')
    parts = data.split('^')[0].split('~') if data else []
    # parts[0]: 'v_hint="sh' -> 提取 sh/sz; parts[1]: 6位代码; parts[2]: 转义名称
    if len(parts) >= 3 and parts[1] and parts[1].isdigit() and len(parts[1]) == 6:
        # 用更稳固的正则锚定前缀, 避免 future 结构变动漏提取交易所
        m = __import__('re').match(r'v_hint="(sh|sz)', parts[0])
        exch = (m.group(1).upper() if m else 'SH')
        return parts[1], exch, name
    return None

def verify_code_name(df_in):
    issues = []
    df_out = df_in.copy()
    for idx in df_out.index:
        nm = str(df_out.at[idx, 'name']).strip()
        code = str(df_out.at[idx, 'ts_code']).strip()
        if not nm or not code:
            continue
        try:
            auth = _smartbox_authoritative(nm)
            if not auth:
                issues.append(f"{nm}: smartbox 未返回权威代码(跳过)")
                continue
            acode, aexch, _ = auth
            auth_full = acode + '.' + aexch
            if auth_full != code:
                issues.append(f"{nm}: CSV里 ts_code={code}, 权威应为 {auth_full} —— 代码错位, 已修正")
                df_out.at[idx, 'ts_code'] = auth_full
        except Exception as e:
            issues.append(f"{nm}: 校验失败({e})")
    return df_out, issues

cand, vB_issues = verify_code_name(cand.copy())
for w in vB_issues:
    print("  [校验]", w)
if vB_issues:
    print(f"  ⚠️ {len(vB_issues)} 处 code↔name 需核对 (已按权威代码修正 ts_code)")

# 只看 L1 纯形态(当日唯一有产出的策略)
l1 = cand[cand['strategy'] == 'L1_CROSS_WINDOW_PURE'].copy()

# ---------- 2. 加载温度计板块热度 ----------
sw = pd.read_pickle(f"{THERM_CACHE}/viz_sw.pkl")
ths = pd.read_pickle(f"{THERM_CACHE}/viz_ths.pkl")
for d in (sw, ths):
    d['src'] = '行业' if 'src' not in d or d['src'].iloc[0] != '主题' else d['src']

# ---------- 3. 加载板块成分映射 (个股 → 所属题材) ----------
def load_ths_member():
    fs = glob.glob(os.path.join(QDH_MEMBER, 'ths_member', '*.parquet'))
    all_m = pd.concat([pd.read_parquet(f)[['ts_code', 'con_code', 'con_name']] for f in fs], ignore_index=True)
    return all_m.drop_duplicates()

member = load_ths_member()
# 板块名 → 成分
ths_code2name = dict(zip(ths['ts_code'].astype(str), ths['名称']))
mem_by_stock = {}
for _, r in member.iterrows():
    mem_by_stock.setdefault(str(r['con_code']), []).append(str(r['ts_code']))

# 温度计题材: 名称→热度/建议分/档位
# 复刻版A advice_score (与 thermometer_viz_v2.py 同口径, 保证两版可比)
# 2026-09-02 CC修正: 加速分+分级改用真实涨幅(3日/1周), 不用热度分变化d3(普跌日防"相对抗跌"误判)
def advice_score(df):
    df = df.copy()
    heat = df['热度']
    r3 = df['3日'].fillna(0)
    r1w = df['1周'].fillna(0)
    wm = df['1月'].fillna(0)
    hs = np.where(heat <= 35, np.clip(heat / 35, 0, 1) * 100,
          np.where(heat <= 55, 100.0, 100.0 - np.clip((heat - 55) / 45, 0, 1) * 100))
    acc_r3 = 50 + 50 * np.sign(r3) * np.clip(np.abs(r3) / 8, 0, 1)
    acc_r1w = 50 + 50 * np.sign(r1w) * np.clip(np.abs(r1w) / 12, 0, 1)
    ms = 0.55 * acc_r3 + 0.45 * acc_r1w
    over_pen = np.clip((heat - 55) / 45, 0, 1) * 40
    cold_mask = (heat < 30) & (r3 < 0)
    cold_pen = np.where(cold_mask, 20.0, 0.0)
    raw = 0.5 * hs + 0.3 * ms - over_pen - cold_pen
    df['建议分'] = np.clip(raw, 0, 100).round(1)
    def level(s, h, r3v, r1wv):
        if r3v <= 0 and r1wv <= 0:
            return '观察' if s >= 40 else '回避'
        if s >= 68 and 40 <= h <= 60 and r3v > 0 and r1wv > 0:
            return '投资级'
        if s >= 60 and r3v > 0 and r1wv > 0:
            return '推荐关注'
        if s >= 50:
            return '关注'
        if s >= 40:
            return '观察'
        return '回避'
    df['建议档'] = [level(s, h, r3v, r1wv) for s, h, r3v, r1wv in zip(df['建议分'], heat, r3, r1w)]
    return df

ths = advice_score(ths)
sw = advice_score(sw)
ths_heat_map = {}
for _, r in ths.iterrows():
    ths_heat_map[str(r['ts_code'])] = {
        '名称': r['名称'], '热度': float(r['热度']) if pd.notna(r['热度']) else 50,
        'd3': float(r['d3']) if pd.notna(r.get('d3')) else 0,
        '1周': float(r['1周']) if pd.notna(r.get('1周')) else 0,
        '建议分': float(r['建议分']) if pd.notna(r.get('建议分')) else 0,
        '建议档': r.get('建议档', '观察')}

# ---------- 4. 54候选 + 板块热度联动 ----------
# 每只股票 → 给它所属题材中"热度最高/最有代表"的那个
rows = []
for _, st in l1.iterrows():
    sym = st['ts_code']
    boards = mem_by_stock.get(sym, [])
    # 找建议档最优先的题材
    best = None
    for tcode in boards:
        b = ths_heat_map.get(tcode)
        if not b: continue
        # 优先级: 投资级 > 推荐关注 > 关注 > 观察 > 回避, 同档取热度高
        prio = {'投资级':4,'推荐关注':3,'关注':2,'观察':1,'回避':0}
        key = (prio.get(b['建议档'],0), b['热度'])
        if best is None or key > best[0]:
            best = (key, b)
    rows.append({
        'symbol': sym, 'name': st['name'], 'state': st['signal_state'],
        'pos60': st['pos60'], 'dd250': st['dd250'], 'slope3': st.get('slope3_pct',0),
        'slope_accel': st.get('slope_accel_pct',0), 'green_days': st['green_days'],
        'hist_expand': st.get('hist_expand_pct',0), 'vol_ratio': st.get('vol_ratio',0),
        'ranking': st.get('ranking_score',0),
        '板块': best[1]['名称'] if best else '未归入',
        '板块热度': best[1]['热度'] if best else 50,
        '板块建议档': best[1]['建议档'] if best else '',
        '板块建议分': best[1]['建议分'] if best else 0,
        '板块d3': best[1]['d3'] if best else 0,
        '板块1周': best[1]['1周'] if best else 0,
    })
df = pd.DataFrame(rows)
n_mapped = int((df['板块'] != '未归入').sum())
print(f"\n映射结果: {len(df)} 只, 成功归入板块 {n_mapped} 只")

# ---------- 5. 板块聚合: 每个题材下有几只L1金叉候选 ----------
board_agg = df[df['板块']!='未归入'].groupby('板块').agg(
    候选数=('name','count'),
    平均热度=('板块热度','mean'),
    平均建议分=('板块建议分','mean'),
    建议档=('板块建议档','first'),
).sort_values('候选数', ascending=False)
print("\n=== 板块聚合(候选≥2) ===")
print(board_agg[board_agg['候选数']>=2].to_string())

# ---------- 6. 渲染 HTML ----------
def tag(name, heat, d3, w1):
    lv = '灼热' if heat>=75 else '热' if heat>=55 else '温' if heat>=30 else '冷'
    d3txt = f"+{d3:.1f}" if d3>=0 else f"{d3:.1f}"
    col = '#c0392b' if heat>=55 else '#f5dcd7' if heat>=30 else '#dce6f2'
    return f'<span style="background:{col};color:#333;padding:1px 6px;border-radius:4px;font-size:10px">{name} {heat:.0f}° {lv} 3日{d3txt} 1周+{w1:.0f}</span>'

# 板块卡片
board_cards = ""
for bname, g in board_agg[board_agg['候选数']>=1].head(20).iterrows():
    stocks = df[df['板块']==bname].sort_values('ranking', ascending=False)
    st_rows = ""
    for _, s in stocks.head(5).iterrows():
        st_badge = '🟢刚金叉' if s['state']=='just_cross' else '🟡准备金叉' if s['state']=='pending' else s['state']
        poscol = '#c0392b' if 20<=s['pos60']<=60 else '#e8590c'
        st_rows += (f'<tr><td><b>{html.escape(s["name"])}</b> <span class="cat">{s["symbol"]}</span></td>'
                    f'<td>{st_badge}</td>'
                    f'<td style="color:{poscol}">{s["pos60"]:.0f}%</td>'
                    f'<td>{s["dd250"]:.0f}%</td>'
                    f'<td>{s["slope3"]:.3f}</td>'
                    f'<td>{s["green_days"]:.0f}日</td>'
                    f'<td><b>{s["ranking"]:.1f}</b></td></tr>')
    board_cards += (f'<div class="card dd-card"><h3>{html.escape(bname)} '
                    f'<span class="cat">{g["建议档"]}·{g["候选数"]}只</span></h3>'
                    f'<table><tr><th>个股</th><th>状态</th><th>60日位</th><th>距250低</th><th>斜率3</th><th>绿柱日</th><th>分</th></tr>{st_rows}</table></div>')

# 全量表格（数量由当日CSV决定）
all_rows = ""
for _, s in df.sort_values('ranking', ascending=False).iterrows():
    st_badge = '🟢' if s['state']=='just_cross' else '🟡' if s['state']=='pending' else '·'
    poscol = '#c0392b' if 20<=s['pos60']<=60 else '#e8590c'
    bcol = {'投资级':'#c0392b','推荐关注':'#d4552c','关注':'#e8590c','观察':'#8a8f98','回避':'#5f6b7a'}.get(s['板块建议档'],'#8a8f98')
    all_rows += (f'<tr><td><b>{html.escape(s["name"])}</b></td><td>{s["symbol"]}</td>'
                 f'<td>{st_badge}{html.escape(s["state"])}</td>'
                 f'<td style="color:{poscol}">{s["pos60"]:.0f}%</td>'
                 f'<td>{s["dd250"]:.0f}%</td><td>{s["slope3"]:.3f}</td><td>{s["green_days"]:.0f}</td>'
                 f'<td style="color:{bcol}">{html.escape(s["板块"])}</td>'
                 f'<td>{s["板块热度"]:.0f}°</td>'
                 f'<td><b>{s["ranking"]:.1f}</b></td></tr>')

# 投资级/推荐关注板块核心(个股所在板块里的优质题材)
core_boards = board_agg[board_agg['建议档'].isin(['投资级','推荐关注'])]
core_txt = '、'.join(f"<b>{html.escape(n)}</b>({g['候选数']}只)" for n,g in core_boards.head(10).iterrows()) if len(core_boards) else '当日无投资级板块露出'

# ---------- 6.5 投资分析与作战计划 ----------
import thermo_market_conditions as mktcond
mkt_c = mktcond.compute()
# 市场基调
if mkt_c and mkt_c['temp'] >= 60:
    tact = '🎯 进攻优先 —— 可积极布局优质板块低位金叉个股'
elif mkt_c and mkt_c['temp'] >= 40:
    tact = '⚖️ 攻守平衡 —— 只做投资级精选方向，控制仓位'
elif mkt_c and mkt_c['temp'] >= 20:
    tact = '🛡️ 防守为主 —— 轻仓试探，严格止损'
else:
    tact = '⛔ 空仓观望 —— 市场极冷，今日不宜追涨，等待企稳或只埋伏超跌龙头'
level_txt = f"{mkt_c['level']}（综合温度 {mkt_c['temp']}°）" if mkt_c else "极冷"

# 优质交集板块 → 代表个股(取ranking最高的)
def top_stocks(board_name, n=3):
    sub = df[df['板块']==board_name].sort_values('ranking', ascending=False).head(n)
    return '、'.join(f"<b>{html.escape(s['name'])}</b>({s['pos60']:.0f}%位)" for _, s in sub.iterrows())

dir_sections = ""
for bname, g in core_boards.head(6).iterrows():
    lvl = g['建议档']
    emoji = '⭐' if lvl=='投资级' else '🔥'
    dir_sections += (f"<li>{emoji} <b>{html.escape(bname)}</b>（{lvl}·{g['候选数']}只候选·板块热度{g['平均热度']:.0f}°）"
                     f"<br><span class='st-sug'>{top_stocks(bname)}</span></li>")

# 目标候选(极冷日不买,只埋伏): 投资级+推荐关注板块中 深超跌高rank 或 理想低位(15-50)
# CC修正(2026-09-02): 原pos60 15-50门槛把最高rank的深超跌(如威胜11%/幸福蓝海9%/海光12%)挡出, 与"核心板块首推"自相矛盾。
# 改为: pos60<=50 的相对低位 + ranking高位, 纳入真正的深超跌埋伏启动位。
watchlist = df[(df['板块建议档'].isin(['投资级','推荐关注'])) & (df['pos60']<=50)]
# 深超跌(<15)的高rank优先, 加上15-50的低位
watchlist = watchlist.sort_values('ranking', ascending=False).head(8)
watch_txt = '、'.join(f"{html.escape(s['name'])}({s['板块']}·{s['pos60']:.0f}%)" for _, s in watchlist.iterrows()) if len(watchlist) else '无(极冷市况候选本就稀少)'

battle_html = f"""<h2>⚔️ 机制B · 投资分析与作战计划</h2>
<div class="card summary battle">
<b style="color:#364fc7">市场基调：{level_txt}</b> — {tact}<br>
<span style="font-size:11.5px;color:var(--muted)">策略结论：当日共 {N_ALL} 行，策略分布为 {STRATEGY_TXT}。机制B结合 {level_txt} 自动调整，当前不把形态发现直接等同于买入指令。</span><br><br>
🎯 <b>高确定方向（投资级/推荐关注板块 × 金叉候选交集）</b>：<br>
<ul style="margin:6px 0 6px 18px;line-height:1.9">{dir_sections if dir_sections else '<li>当日无交集</li>'}</ul>
📌 <b>极冷日·埋伏观察清单（暂不买，等企稳）</b>：{watch_txt}<br><br>
<div class="note">
⚠️ 纪律提醒：本页是「板块×形态」双源联动研究信号，非个股买入指令。<b>正式买入前须逐股核实</b>：① 现价位置（不追高，极冷日不到 30 位置不接力）② 估值（区分错杀 vs 正确定价）③ 近期催化。市场极冷下优先控制仓位、设死止损。<br>
🧭 机制B与机制A差异：本页额外叠加了 Codex 的形态严谨度（pending_cross 动态预测、绿柱量化），但 <b>L2/L3 的追涨资金过滤在极冷日失效</b>——这正是两套机制分开的意义：机制A看板块温度，机制B看个股形态，互补不混用。<br>
个股行情请以实时数据为准；本页为个人研究，非投资建议。
</div></div>"""

now = pd.Timestamp.now().strftime('%Y-%m-%d %H:%M')
html_doc = f"""<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8">
<title>机制B · Codex四策略 x 温度计 联动 {DATA_DATE}</title>
<style>
:root{{--bg:#f3efe6;--card:#fff;--border:#e2dccf;--text:#2a2730;--muted:#8a8f98;--accent:#c56f52}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{background:var(--bg);color:var(--text);font-family:'Songti SC','Georgia','PingFang SC','Microsoft YaHei',serif;line-height:1.6;padding:32px 20px}}
.container{{max-width:none;width:96%;margin:0 auto}}
.top-tags{{font-size:12px;color:var(--accent);letter-spacing:.05em;margin-bottom:12px}}
h1{{font-size:26px;margin-bottom:4px}}
.sub{{color:var(--muted);font-size:12.5px;margin-bottom:10px}}
h2{{font-size:19px;margin:28px 0 12px;padding-left:12px;border-left:4px solid var(--accent)}}
.card{{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:14px;overflow-x:auto}}
.summary{{background:linear-gradient(180deg,#fff,#fdfaf2);border-left:4px solid var(--accent)}}
table{{width:100%;border-collapse:collapse;font-size:12.5px}}
th,td{{padding:6px 8px;text-align:left;border-bottom:1px solid var(--border)}}
th{{color:var(--muted);font-weight:600;font-size:11px}}
.cat{{font-size:10px;color:var(--muted);background:#f0ece2;padding:1px 5px;border-radius:3px;margin-left:4px}}
.dd-grid{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}}
.dd-card{{border-left:4px solid #c56f52}}
@media(max-width:700px){{.dd-grid{{grid-template-columns:1fr}}}}
.note{{font-size:11px;color:var(--muted);line-height:1.8}}
.footer{{color:var(--muted);font-size:11px;margin-top:20px;text-align:center;border-top:1px solid var(--border);padding-top:12px}}
.badge{{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700}}
</style></head><body><div class="container">
<div class="top-tags">· 机制B · 双源联动研究</div>
<h1>⚔️ Codex 四策略 × 温度计 联动</h1>
<div class="sub">候选信号日 {DATA_DATE} ｜ 生成于 {now} ｜ 四策略扫描 + 温度计板块热度 ｜ 个人研究非投资建议</div>

<div class="card summary">
<b>当日四策略扫描结论（{DATA_DATE}）</b><br>
📊 本次候选CSV共 <b>{N_ALL} 行</b>，策略分布为 <b>{STRATEGY_TXT}</b>；其中 L1 纯形态 <b>{N_L1} 行</b>（仅作形态发现，非买入信号）。<br>
🧭 温度计当日综合温度 <b>{level_txt}</b>——机制B根据温度自动调整为观察/埋伏或进攻模式，当前作战结论为：<b>{tact}</b>。<br>
🎯 <b>核心板块露出</b>：{core_txt}<br>
<div class="note">⚠️ 机制B反例价值：Codex 的 L2/L3 在追涨市况才有产出，极冷日完全失效，恰好印证 CC 审查结论「L2/L3 是追涨追资金变体，非低位反转」。温度计的"低温升温候选"才是极冷日该看的进攻方向。</div>
</div>

<h2>🧭 机制B · 板块×金叉候选聚合（按板块建议档排序）</h2>
<div class="dd-grid">{board_cards}</div>

{battle_html}

<h2>📋 全部 {N_L1} 只 L1 形态候选 · 板块热度联动</h2>
<div class="card"><table>
<tr><th>个股</th><th>代码</th><th>状态</th><th>60日位</th><th>距250低</th><th>斜率3</th><th>绿柱日</th><th>所属板块</th><th>板块热</th><th>分</th></tr>
{all_rows}</table></div>

<div class="footer">机制B：Codex 四策略当日扫描 × 温度计版面热度 双源联动 ｜ 极冷日自动降级 ｜ 个人研究非投资建议</div>
</div></body></html>"""

out = Path(REPORTS)
out.mkdir(parents=True, exist_ok=True)
path = out / f"机制B_Codex四策略x温度计_{DATA_DATE}.html"
path.write_text(html_doc, encoding='utf-8')
print(f"\nHTML: {path} ({path.stat().st_size/1024:.1f} KB)")
