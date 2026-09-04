# -*- coding: utf-8 -*-
"""温度计门控的A股决策机制 DAG流水线 v2 (2026-09-03 CC第二轮审查后修正)
L1温度 -> L2门控 -> L3策略并行扫描 -> L4逐票共振加权+QDH核验 -> L5三档分级+仓位+熔断+报告
【v2修正】(CC审查) 1.fail-safe不新开仓 2.真共振加权(去共线/共享1.5/追高一票否决) 3.完整熔断先于推荐 4.组合约束执行 5.动态日期禁用硬编码
"""
import json, os, sys, datetime, glob
REPORTS = r'G:\HM\hermes-home\reports'
PIPELINE = {}
FAIL_SAFE = {'ok': False, 'data': {'触发': True, '原因': ['上游层失败，fail-safe冻结新开仓']}}
_SOURCE_META = {}

def _norm_trade_date(value):
    """把CSV/JSON/Pandas中的交易日统一为YYYYMMDD；无法识别则返回空串。"""
    s = str(value).strip()
    if s.endswith('.0'):
        s = s[:-2]
    return s[:8] if len(s) >= 8 and s[:8].isdigit() else ''

def _latest_qd():
    days = sorted([os.path.basename(f).split('.')[0] for f in glob.glob(r'G:\AI\Data\QDataHub\data_store\daily_by_date\*.parquet')])
    return days[-1] if days else None

def stage(name, fn):
    try:
        print(f'\n=== L[{name}] ===')
        r = fn()
        PIPELINE[name] = {'ok': True, 'data': r}
        return r
    except Exception as e:
        import traceback; traceback.print_exc()
        PIPELINE[name] = {'ok': False, 'error': str(e)}
        return None

# == L1 温度 ==
def l1_temperature():
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import thermo_market_conditions as mkt
    r = mkt.compute()
    if not r: raise ValueError('温度计算失败')
    return {'temp': r['temp'], 'level': r['level'], 'asof': mkt._latest_qdh_date()}

# == L2 门控 ==
GATES = [(80,'过热',['stop_gain_only'],'防御',50,0.4),(60,'偏热',['lc_just_cross','codex_just_cross'],'进攻',70,0.8),
         (40,'温和',['L1','L3','L2','LC','Codex','USmap'],'进攻均衡',75,1.0),(20,'偏冷',['L3','L1'],'防御均衡',50,0.5),
         (-1,'极冷',['lowbuy_leaders'],'防御',30,0.3)]
def l2_gate(temp):
    for lo,n,s,mode,cap,t in GATES:
        if temp>=lo: return {'档':n,'策略':s,'总仓上限%':cap,'T':t}

# == L3 策略输出协议: 各策略落JSON再聚合 (真实运行由各策略填充) ==
# ⚠️ v3.2(CC无条件通过冲刺): l3_scan 接入真实策略候选(Serenity four_way CSV, 带industry+pos60),
#    使: 单行业≤20%(用industry) 与 追高/过热否决(用pos60位置分) 真实驱动, 消除死路径。
STRAT_TAG = {'L3':'L3','L1':'L1','L2':'L2','LC':'LC','Codex':'Codex','USmap':'USmap'}
# v3.6(2026-09-04 CC复审N1根治): 源头目录日期不能写死(20260902), 用glob取最新, 防下个交易日幻影沿用昨日快照
import glob as _g
def _latest_serenity_csv():
    _files = sorted(_g.glob(r'G:\AI\Project\Serenity\runtime_data\reports\*_macd_strategy_four_way\current_strategy_candidates_with_industry.csv'))
    return _files[-1] if _files else ''
SERENITY_CSV = _latest_serenity_csv()
def _load_real_candidates(asof):
    """读 Serenity 真实策略候选(带 industry/pos60/strategy)。
    若文件缺失→返回空(触发fail-safe,绝不硬凑)。真实运行时也可替换为各策略实时落盘JSON。"""
    global _SOURCE_META
    import os
    if not os.path.exists(SERENITY_CSV):
        _SOURCE_META = {'状态': '缺失', 'src_file': SERENITY_CSV or None}
        raise FileNotFoundError(f'真实候选源缺失: {os.path.basename(SERENITY_CSV)}')
    import pandas as pd
    d = pd.read_csv(SERENITY_CSV, encoding='utf-8-sig', dtype={'ts_code': str})
    expected = _norm_trade_date(asof)
    if 'signal_trade_date' not in d.columns:
        _SOURCE_META = {'状态': '缺少signal_trade_date', 'src_file': os.path.abspath(SERENITY_CSV)}
        raise ValueError('候选源缺少 signal_trade_date，拒绝把未知日期数据标为当日')
    source_dates = sorted({_norm_trade_date(v) for v in d['signal_trade_date'].dropna()})
    source_dates = [v for v in source_dates if v]
    _SOURCE_META = {
        '状态': '待校验',
        'src_file': os.path.abspath(SERENITY_CSV),
        'src_signal_trade_dates': source_dates,
        'src_rows': int(len(d)),
        'src_unique_symbols': int(d['ts_code'].nunique()) if 'ts_code' in d.columns else None,
    }
    if len(source_dates) != 1 or source_dates[0] != expected:
        _SOURCE_META['状态'] = '日期不一致，已拒绝'
        raise ValueError(f'候选源日期 {source_dates or "空"} 与机制asof {expected or asof} 不一致，拒绝沿用旧快照')
    _SOURCE_META['状态'] = '通过'
    out = []
    for _, r in d.iterrows():
        code = str(r['ts_code']); sname = str(r['name'])
        strategy_raw = str(r['strategy'])
        # v3.7(2026-09-04 CC全面审查#12修复): 修正标签映射。
        #   L0_SALTLAKE_EXACT 是更严格的金叉形态(同属低位金叉低吸族), 应映射到 L1 类(低吸),
        #   不能落 else 被误标成"L3"(语义完全不同, L3是资金流+大盘因子)。
        #   合法映射: 含L0/L1/L2/L3 → L1(都是低位金叉族,门控偏冷档的低吸形态) | 含LC/LOW → LC | 其余 → L3
        if ('L0' in strategy_raw) or ('L1' in strategy_raw) or ('L2' in strategy_raw) or ('L3' in strategy_raw):
            tag = 'L1'   # 低位金叉族统一视为 L1 低吸形态(门控偏冷档白名单含L1)
        elif 'LC' in strategy_raw or 'LOW' in strategy_raw:
            tag = 'LC'
        else:
            tag = 'L3'
        pos60 = float(r['pos60']) if pd.notna(r['pos60']) else None
        industry = str(r['industry']) if pd.notna(r.get('industry')) else None
        # 追高/过热判定: pos60高(>80) = 追高/过热 → 标记(由L4一票否决)
        hot = bool(pos60 is not None and pos60 > 80)
        out.append({'ts_code': code, 'name': sname, 'strategy': tag,
                    'asof': asof, '行业': industry, 'pos60': pos60,
                    '过热': hot, '追高': hot,
                    '_strategy_raw': strategy_raw,   # 保留原始策略名供审计
                    'src_file': os.path.basename(SERENITY_CSV)})
    # v3.7(CC全面审查#3修复): 按 ts_code 去重——同一票可同时命中 L0+L1 等多策略(如南网科技),
    #    只保留策略优先级最高的一行(原始strategy排序: L0最严>L1>L2>L3), 避免"筛出29只实为28只"重复计数虚高。
    prio = {'L0': 0, 'L1': 1, 'L2': 2, 'L3': 3}
    def _orig_prio(rec):
        sr = rec.get('_strategy_raw', '')
        for k in ('L0_SALTLAKE_EXACT', 'L1_CROSS_WINDOW_PURE', 'L2_EARLY_FLOW_MARKET', 'L3_EARLY_FLOW_MARKET_PLUS'):
            if k in sr:
                return prio.get(k.split('_')[0], 9)
        return 9
    out.sort(key=lambda rec: (rec['ts_code'], _orig_prio(rec)))
    seen = set(); dedup = []
    for rec in out:
        if rec['ts_code'] in seen:
            continue
        seen.add(rec['ts_code']); dedup.append(rec)
    _SOURCE_META['dedup_unique_symbols'] = int(len(dedup))
    _SOURCE_META['duplicate_rows_removed'] = int(len(out) - len(dedup))
    return dedup

def l3_scan(gate, asof):
    """扫描并按门控白名单过滤。
    ⚠️ 真实数据源: 接 Serenity 四策略候选(带行业+pos60)。
    ⚠️ 2026-09-04 修复: 移除硬编码 usmap_demo(江波龙/兆易创新) 演示标的——
        用户明确要求报告不放手工/演示标的。真实运行时USmap策略也应落同一JSON协议,不硬编码。"""
    real = _load_real_candidates(asof)
    # 2026-09-04 删除: usmap_demo 硬编码(江波龙301308/兆易603986), 见上注释
    known = real
    whitelist = gate['策略']  # 如 ['L3','L1'] / ['L3','L2','LC','Codex','USmap']
    out = []
    for s in known:
        if s['strategy'] == 'USmap' and 'USmap' not in whitelist:
            continue            # 偏冷/极冷/偏热/过热: 禁美股映射追涨, 只有温和放行
        if s['strategy'] not in whitelist:
            continue            # 策略标签不在白名单则不进入
        out.append(s)
    if not out:
        print(f'  ⚠️ 门控白名单={whitelist}, 无白名单内信号(风控生效,暂不荐)')
    return out

# == L4 共振加权(真实现) ==
W = {'L3':2.0, 'tech_shared':1.5, 'USmap':1.0, 'board':0.5}
# ⚠️ 质量判定注入点: 可注入函数 ts_code->('错杀'|'正确定价'|'待验证'|'亏损待验证')
#    默认None→所有候选'待验证'→剔除(严格fail-safe)。真实运行时接QDH财务表实现。
QUALITY_FN = None
def set_quality_fn(fn):
    """注入质量判定函数(如从QDH财务数据算错杀vs正确定价)。"""
    global QUALITY_FN
    QUALITY_FN = fn
def l4_resonance(signals):
    agg = {}  # ts_code -> {name, 行业, pos60, 过热, 追高, src[], score, 质量}
    for s in signals:
        code = s['ts_code']
        if code not in agg:
            agg[code] = {'name':s['name'], '行业':s.get('行业'), 'pos60':s.get('pos60'),
                         '过热':s.get('过热',False), '追高':s.get('追高',False),
                         'src':[], 'score':0.0, '质量':None}
        # 共线去重: LC/Codex 同抓金叉, 同票只计一次 tech_shared
        if s['strategy'] in ('LC','Codex'):
            if 'tech_shared' not in agg[code]['src']:
                agg[code]['src'].append('tech_shared'); agg[code]['score'] += W['tech_shared']
        elif s['strategy'] in W:
            agg[code]['src'].append(s['strategy']); agg[code]['score'] += W[s['strategy']]
        else:
            agg[code]['src'].append(s['strategy']); agg[code]['score'] += 1.0
    # QDH质量核验(硬规则: 错杀vs正确定价)
    # ⚠️ v3.2: 质量判定改为可注入函数 QUALITY_FN(ts_code)->str, 默认读已核实的临时表;
    #    真实运行时接 QDH 财务表(净利yoy/营收)自动算错杀vs正确定价。
    #    未核实候选默认'待验证'→剔除(不硬凑,不虚报)。
    for c,h in agg.items():
        # ⚠️ v3.4(CC复审): 追高/过热一票否决必须【先于】质量否决。
        #    否则生产默认QUALITY_FN=None→全'待验证'→质量先剔, 追高路径被遮蔽永远不可达。
        #    追高是更硬的反向信号, 先剔追高, 质量再判。
        if h.get('过热') or h.get('追高'):
            h['质量'] = QUALITY_FN(c) if QUALITY_FN else '待验证'
            h['score'] = -999; h['档位'] = '剔除'; h['否决'] = '追高/过热,一票否决'
            continue
        h['质量'] = QUALITY_FN(c) if QUALITY_FN else '待验证'
        # 一票否决(硬规则):
        # ② 业绩差正确定价 / 待验证 / 亏损待验证 → 剔除(未核实不荐)
        if h['质量'] in ('正确定价','待验证','亏损待验证'):
            h['score'] = -999; h['档位'] = '剔除'; h['否决'] = f"质量={h['质量']},硬规则剔除"
            continue
        # 错杀升一档(质量加分)
        if h['质量'] == '错杀': h['score'] += 0.5
        h['档位'] = '核心出击' if h['score']>=3 else '重点' if h['score']>=2 else '观察' if h['score']>=1 else '剔除'
    return agg

# == L5 仓位 + 熔断(先于推荐) ==
# ⚠️ 熔断生效范围必须诚实标注。当前(v3.1)实现的熔断:
#   [已实接] 过热/极冷冻结新开仓、核心>3集中降档、fail-safe冻结、上游失败冻结
#   [声明为限制·未接入,需订阅行情/持仓事件源方能启用] 组合回撤-8%/-15%、单票破位联动、
#     温度跨两档突变强制降仓、止跌确认前不恢复仓、板块跌>3%
#   —— 未接入项不虚报为已生效,在文档/files中标"当前未接入"。
def _circuit(gate, agg, temp_prev=None, board_breadth=None):
    cb = {'触发': False, '原因': [], '生效范围': [
        '已实接:过热/极冷冻结新开仓 核心>3降档 fail-safe冻结 上游失败冻结',
        '未接入:组合回撤-8%/-15% 破位联动 温度突变 止跌确认 板块跌>3%']}
    if gate['档'] in ('过热','极冷'):
        cb['触发']=True; cb['原因'].append(f"温度档{gate['档']},冻结新开仓")
    ncore = len([h for h in agg.values() if h['档位']=='核心出击'])
    if ncore > 3: cb['触发']=True; cb['原因'].append('核心出击>3只,组合集中风险,强制降档')
    # 板块跌>3%(breadth=上涨板块占比,若<某阈或传入跌幅): 有板块数据即可实接
    if board_breadth is not None and board_breadth < 0.3:
        cb['触发']=True; cb['原因'].append('市场板块普跌(上涨占比<30%),冻结新开仓')
    return cb

def l5_plan(agg, circuit, gate):
    if circuit['触发']:
        return {}, circuit  # 熔断: 不推荐任何新开仓
    coef = {'核心出击':1.2,'重点':1.0,'观察':0.6}
    plan = {}
    for code,h in agg.items():
        if h['档位']=='剔除': continue
        base = 15 * gate['T'] * coef.get(h['档位'],0.6)
        if h['质量']=='错杀': base = min(base*1.1, 15)          # 单票≤15%
        # ⚠️ v3.4: V型分批(核心仓): 总目标仓位分两笔, 首笔≤60%, 确认后再加仓
        #   (补CC指出的"skill声称V型分批已实接但代码没有")
        first_wave = round(base * 0.6, 1)   # 首笔60%
        plan[code] = {**h, '仓位%': round(base,1),
                      'V型分批': {'首笔': first_wave, '加仓': round(base-first_wave,1),
                                  '规则': '首笔60%建仓→确认(企稳/放量)后加剩余40%'}}
    # 组合约束1: 单行业≤20%(若候选带行业字段)。缺行业字段则无法硬约束,诚实标注
    # 组合约束2: 总仓≤门控上限
    def _sync_vsplit(p):
        """v3.5: 仓位%缩放后同步重算V型分批(首笔/加仓), 消除CC指出的字段失步。"""
        if 'V型分批' in p:
            p['V型分批'] = {'首笔': round(p['仓位%']*0.6, 1),
                            '加仓': round(p['仓位%']-p['仓位%']*0.6, 1),
                            '规则': '首笔60%建仓→确认(企稳/放量)后加剩余40%'}
    total = sum(p['仓位%'] for p in plan.values())
    if total > gate['总仓上限%']:
        scale = gate['总仓上限%']/total
        for p in plan.values():
            p['仓位%'] = round(p['仓位%']*scale,1); _sync_vsplit(p)
    # 单行业约束: 有候选才检查; 若候选有行业字段则真执行, 全缺行业才标注限制
    if plan and all(p.get('行业') is None for p in plan.values()):
        print('  ⚠️ 候选未带行业字段,单行业≤20%约束未执行(需接入QDH行业分类)')
    elif plan:
        # 按行业汇总,超20%按比例压 (行业字段真驱动, CC条件3)
        from collections import defaultdict
        ind_sum = defaultdict(float)
        for p in plan.values(): ind_sum[p['行业']]+=p['仓位%']
        for ind,s in ind_sum.items():
            if s>20:
                scale_ind=20/s
                for p in plan.values():
                    if p['行业']==ind:
                        p['仓位%']=round(p['仓位%']*scale_ind,1); _sync_vsplit(p)
    return plan, circuit

if __name__ == '__main__':
    # ⚠️ 质量源(真实): 接 QDH 财务表(income.parquet)算中报净利yoy.
    #    yoy>50%→错杀(低位+高增) / 净利下滑→正确定价剔除 / 中报未披露或0-50%→待验证 / 亏损→亏损待验证.
    #    替代之前的硬编码演示dict(只有4只股票,其余全误判待验证→全剔,SSR事故).
    asof = _latest_qd()
    import quality_fn_qdh
    if not asof:
        print('❌ 无法确定QDataHub最新交易日，拒绝生成机制结果。')
        sys.exit(1)
    quality_fn_qdh.set_asof(asof)
    set_quality_fn(quality_fn_qdh.quality_fn)
    print(f'# A股温度门控决策流水线 | 数据asof={asof}')
    temp = stage('1 温度', l1_temperature)
    if not temp: print('⚠️ 温度层失败 → fail-safe 冻结'); sys.exit(1)
    gate = stage('2 门控', lambda: l2_gate(temp['temp']))
    signals = stage('3 策略扫描', lambda: l3_scan(gate, temp['asof']))
    # 空列表是合法的“门控白名单与当日信号没有交集”，应落空候选JSON；
    # None 才表示上游异常，必须终止，不能把合法空结果误报成故障。
    if not gate or signals is None: print('⚠️ 上游失败 → fail-safe 冻结,不新开仓'); sys.exit(1)
    agg = stage('4 共振加权', lambda: l4_resonance(signals))
    if agg is None:
        print('⚠️ 共振层失败 → fail-safe 冻结,不落不完整JSON')
        sys.exit(1)
    circuit = stage('5 熔断', lambda: _circuit(gate, agg))
    if circuit is None:
        print('⚠️ 熔断层失败 → fail-safe 冻结,不落不完整JSON')
        sys.exit(1)
    plan, circuit = l5_plan(agg, circuit, gate)
    if isinstance(plan, dict) and plan and gate:
        gate['strategy_label'] = gate['策略']
    print(f'\n温度: {temp["temp"]}° {temp["level"]} (asof {temp["asof"]})')
    print(f'门控: 档={gate["档"]} 策略={gate["策略"]} 总仓≤{gate["总仓上限%"]}% T={gate["T"]}')
    print(f'熔断: {"⚠️触发 - "+";".join(circuit["原因"]) if circuit.get("触发") else "无"}')
    if plan:
        print('\n共振候选(最终方案):')
        for c,h in sorted(plan.items(), key=lambda x:-x[1]['score']):
            print(f"  {h['name']:<6}{c} S={h['score']:.1f} 质量={h['质量']} {h['档位']} 仓位={h['仓位%']}%")
    else:
        print('\n候选: 空(熔断/fail-safe,不新开仓)')
    out = os.path.join(REPORTS, f'温度门控机制_{asof}.json')
    os.makedirs(REPORTS, exist_ok=True)
    with open(out,'w',encoding='utf-8') as f:
        json.dump({'温度':temp,'门控':gate,'熔断':circuit,'候选':plan,'溯源':_SOURCE_META}, f, ensure_ascii=False, indent=2, default=str)
    print(f'\n结果落盘: {out}')
