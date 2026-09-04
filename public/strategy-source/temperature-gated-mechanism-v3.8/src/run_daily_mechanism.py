# -*- coding: utf-8 -*-
"""每日A股综合报告 一键封装入口 (2026-09-03)

串联跑完整温度门控决策机制，一次命令产出每日A股综合报告：
  步骤1: 市场温度计(刷新行业/主题多窗口热度) → 多窗口_行业.csv / 多窗口_主题.csv
  步骤2: 机制流水线(温度→门控→策略→共振→质量核验→仓位) → 温度门控机制_<date>.json
  步骤3: 报告生成器(温度+市场分析+策略结果+作战计划 三合一) → 每日A股综合报告_<date>.html

用法:
  python run_daily_mechanism.py              # 全流程跑
  python run_daily_mechanism.py --stop-after temp     # 只跑温度计
  python run_daily_mechanism.py --stop-after mech     # 跑到机制JSON
  python run_daily_mechanism.py --dry-run             # 只看会跑哪些脚本, 不执行

依赖: QDataHub venv (G:/AI/Project/QDataHub/.venv), 需含 pandas/tushare。
  入口脚本用系统python跑(仅标准库), 实际计算脚本都用QDH venv跑。
"""
import sys, os, subprocess, glob, argparse
from datetime import date, timedelta

SCRIPTS = r"G:\HM\hermes-home\scripts"
REPORTS = r"G:\HM\hermes-home\reports"
THERMO_CACHE = r"G:\HM\hermes-home\cache\thermometer"
QDH_PY = r"G:\AI\Project\QDataHub\.venv\Scripts\python.exe"

def steps():
    """返回有序步骤列表: (名称, 脚本相对SCRIPTS名, 用QDH venv吗, 失败是否致命)"""
    return [
        # 1. 温度计链路 (刷新多窗口CSV供报告引用) — 非致命: 若失败, 报告用已有CSV
        ("市场温度计", "thermometer_run.py", True, False),
        # 2. 机制流水线 (生成温度门控机制_<date>.json) — 致命: 报告依赖它
        ("机制决策流水线", "daily_investment_pipeline.py", True, True),
        # 3. 报告生成器 (合成每日A股综合报告_<date>.html) — 致命
        ("报告生成", "generate_daily_report.py", True, True),
    ]

def today_str(): return date.today().strftime("%Y%m%d")

def run_script(name, script, use_qdh, env_extra=None):
    """运行单个脚本, 返回(成功bool, 输出摘要)"""
    py = QDH_PY if use_qdh else sys.executable
    env = dict(os.environ)
    if env_extra:
        env.update(env_extra)
    print(f"\n{'='*56}\n▶ [{name}] {script}\n{'='*56}")
    try:
        r = subprocess.run([py, os.path.join(SCRIPTS, script)], env=env,
                           capture_output=True, text=True, encoding="utf-8", errors="replace",
                           timeout=1500)
        if r.stdout: print(r.stdout[-3000:])
        if r.returncode != 0:
            print(f"  ⚠️ 退出码 {r.returncode}")
            if r.stderr: print(f"  STDERR: {r.stderr[-2000:]}")
            return False, r.stdout[-500:]
        return True, r.stdout[-500:]
    except subprocess.TimeoutExpired:
        print(f"  ⚠️ 超时(25分钟)")
        return False, ""
    except Exception as e:
        print(f"  ⚠️ 运行异常: {e}")
        return False, ""

def latest_report():
    """找最新的每日A股综合报告"""
    files = sorted(glob.glob(os.path.join(REPORTS, "每日A股综合报告_*.html")), key=os.path.getmtime)
    return files[-1] if files else None

def main():
    ap = argparse.ArgumentParser(description="每日A股综合报告 一键封装")
    ap.add_argument("--stop-after", choices=["temp", "mech", "report"], default="report",
                    help="跑到哪一步停: temp=温度计 / mech=机制JSON / report=全流程(默认)")
    ap.add_argument("--dry-run", action="store_true", help="只打印步骤不执行")
    args = ap.parse_args()

    stop_map = {"temp": 1, "mech": 2, "report": 3}
    stop_at = stop_map[args.stop_after]

    if not os.path.exists(QDH_PY):
        print(f"❌ 找不到QDH venv: {QDH_PY}\n   温度计/机制/报告都依赖它, 请先确认QDataHub已安装。")
        sys.exit(1)

    print("="*56)
    print("📊 每日A股综合报告 · 一键生成")
    print(f"  日期基准: {today_str()} ｜ 数据源: QDataHub")
    print("="*56)

    s = steps()
    if args.dry_run:
        print("【DRY-RUN】将依次执行:")
        for i, (name, script, _, fatal) in enumerate(s, 1):
            if i > stop_at: break
            print(f"  {i}. [{name}] {script}{' (QDH venv)' if True else ''}{' [非致命]' if not fatal else ''}")
        return

    fails = []
    fatal_failed = False
    for i, (name, script, use_qdh, fatal) in enumerate(s, 1):
        if i > stop_at: break
        ok, _ = run_script(name, script, use_qdh)
        if not ok:
            fails.append(name)
            if fatal:
                fatal_failed = True
                print(f"\n❌ 致命步骤 [{name}] 失败, 中止。后续报告无法可靠生成。")
                break
            else:
                print(f"\n  ↳ [{name}] 失败(非致命), 继续后续步骤(报告将用已有缓存数据)。")

    # 汇总
    print("\n" + "="*56)
    if fails:
        print("部分步骤失败:")
        for f in fails: print(f"  ✗ {f}")
    if fatal_failed:
        print("❌ 本次未宣称生成新报告；保留磁盘上的历史报告，不将其冒充为本次结果。")
        print("="*56)
        sys.exit(1)
    rpt = latest_report()
    if rpt:
        print(f"✅ 最新报告: {rpt}  ({os.path.getsize(rpt)/1024:.0f} KB)")
    else:
        print("⚠️ 未找到每日A股综合报告, 请检查 generate_daily_report.py 是否成功。")
    print("="*56)

if __name__ == "__main__":
    main()
