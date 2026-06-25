'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import type { Match, Outcome } from '@/lib/wcw2026/types'

type TeamProfile = {
  tier: number
  attack: number
  defense: number
  tempo: number
  form: string
  edge: string
  star: string
}

type AnalyzedMatch = {
  match: Match
  home: TeamProfile
  away: TeamProfile
  probabilities: Record<Outcome, number>
  pick: Outcome
  pickLabel: string
  confidence: number
  expectedHomeGoals: number
  expectedAwayGoals: number
  scorePick: string
  totalGoalsPick: string
  halfFullPick: string
  handicapPick: string
  logic: string
}

type AdviceLeg = {
  match: AnalyzedMatch
  market: string
  pick: string
  note?: string
  odds?: number | null
}

type AdviceItem = {
  title: string
  stake: number
  passType: string
  legs: AdviceLeg[]
  legStakes?: number[]
  maxPayout: number | null
}

type AdviceSlate = {
  date: string
  title: string
  label: string
  status: string
  matches: AnalyzedMatch[]
  conservative: AdviceItem[]
  balanced: AdviceItem[]
  aggressive: AdviceItem[]
}

type AdviceBook = {
  defaultDate: string
  slates: AdviceSlate[]
}

const TEAM_PROFILES: Record<string, TeamProfile> = {
  巴西: p(94, 95, 86, 78, '强队稳定，前场个人能力足', '进攻', '维尼修斯 / 罗德里戈'),
  西班牙: p(93, 90, 90, 74, '控球压制强，虐菜能力较稳', '攻守平衡', '罗德里 / 亚马尔'),
  阿根廷: p(92, 89, 87, 68, '淘汰赛经验强，节奏管理好', '控制', '梅西体系余威'),
  法国: p(95, 94, 88, 82, '转换速度顶级，强强对话不虚', '反击', '姆巴佩'),
  英格兰: p(91, 88, 88, 66, '阵容厚度足，但大胜欲望不稳定', '阵地战', '贝林厄姆 / 凯恩'),
  葡萄牙: p(90, 89, 84, 75, '边路和二线火力强', '进攻', 'B费 / 莱奥'),
  德国: p(89, 88, 84, 72, '主导能力强，防线偶有波动', '压迫', '穆西亚拉 / 维尔茨'),
  荷兰: p(88, 84, 87, 68, '防守底盘好，进攻效率看临场', '防守', '范戴克 / 加克波'),
  比利时: p(86, 86, 80, 70, '进攻资源仍在，防线年龄结构偏脆', '进攻', '德布劳内 / 多库'),
  乌拉圭: p(86, 83, 85, 80, '身体和压迫强，比赛侵略性足', '防守反击', '努涅斯 / 巴尔韦德'),
  克罗地亚: p(84, 80, 85, 58, '控节奏能力强，大开大合概率低', '控制', '莫德里奇传承'),
  瑞士: p(82, 78, 83, 60, '纪律性好，容易把比赛拖进小比分', '防守', '扎卡'),
  加拿大: p(77, 75, 74, 72, '冲击力和主场氛围不错，防线抗压仍要打问号', '冲击', '戴维 / 戴维斯'),
  波黑: p(78, 77, 75, 64, '中前场支点和定位球有威胁，节奏偏慢', '支点', '哲科传承 / 皮亚尼奇体系'),
  卡塔尔: p(69, 68, 68, 64, '亚洲杯经验有，但面对欧洲强度抗压不足', '控球', '阿菲夫'),
  摩洛哥: p(83, 79, 86, 64, '防线组织强，反击质量高', '防守反击', '阿什拉夫'),
  苏格兰: p(76, 73, 78, 62, '防守韧性强，进攻依赖边路和定位球', '防守', '麦克托米奈 / 罗伯逊'),
  海地: p(64, 62, 64, 66, '身体条件尚可，整体攻防稳定性偏弱', '反击', '团队冲击'),
  库拉索: p(64, 62, 65, 66, '整体抗压和阵地推进都偏弱，主要看收缩后的反击效率', '防守反击', '团队速度'),
  科特迪瓦: p(79, 78, 77, 72, '身体强度和边路推进不错，但大胜穿深盘不宜当作稳胆', '冲击', '凯西 / 哈勒体系'),
  日本: p(82, 80, 79, 76, '节奏快，压迫和脚下衔接好', '速度', '三笘薰 / 久保建英'),
  瑞典: p(77, 75, 78, 62, '防守和高空球有底盘，比赛节奏通常不会太乱', '防守', '伊萨克 / 库卢塞夫斯基'),
  突尼斯: p(70, 68, 72, 64, '防守韧性可以，进攻上限和持续压迫不足', '防守', '团队防守'),
  美国: p(80, 79, 77, 78, '运动能力好，主场氛围加成', '冲击', '普利西奇'),
  巴拉圭: p(74, 72, 76, 62, '对抗和防守纪律不错，进攻端更依赖定位球和转换', '防守', '阿尔米隆'),
  澳大利亚: p(73, 71, 74, 66, '身体对抗稳定，杯赛常能把比赛拖进低比分', '对抗', '团队高空球'),
  挪威: p(83, 86, 75, 70, '锋线终结点强，但防守保护一般', '进攻', '哈兰德 / 厄德高'),
  墨西哥: p(79, 76, 79, 70, '主场韧性强，杯赛经验足', '主场', '希门尼斯'),
  南非: p(70, 69, 70, 68, '跑动和反击积极，但强强对抗细节不足', '反击', '团队速度'),
  韩国: p(80, 79, 78, 76, '压迫和转换速度强，边前场个人能力突出', '速度', '孙兴慜 / 李刚仁'),
  捷克: p(78, 75, 80, 62, '防线和空中对抗不错，进攻节奏偏稳', '防守', '绍切克 / 希克'),
  哥伦比亚: p(82, 82, 79, 72, '前场创造力强，容易出进球', '进攻', '迪亚斯'),
  塞内加尔: p(81, 78, 82, 70, '身体强度高，防守反击直接', '身体', '马内'),
  奥地利: p(80, 78, 80, 76, '整体压迫强，执行力稳定', '压迫', '萨比策'),
  土耳其: p(79, 81, 74, 80, '进攻有想象力，防线波动偏大', '进攻', '恰尔汗奥卢'),
  厄瓜多尔: p(78, 76, 79, 74, '对抗和跑动强，节奏不慢', '对抗', '凯塞多'),
  加纳: p(76, 75, 74, 72, '身体冲击和边路速度有威胁，但防线稳定性一般', '冲击', '库杜斯 / 托马斯'),
  伊朗: p(76, 73, 78, 62, '防守站位稳，进攻偏直接', '防守', '塔雷米'),
  埃及: p(77, 76, 75, 66, '单点爆破强，整体稳定性一般', '边路', '萨拉赫'),
  阿尔及利亚: p(76, 75, 74, 70, '边路推进和定位球有威胁', '边路', '马赫雷斯'),
  伊拉克: p(70, 68, 70, 64, '杯赛韧性不错，硬仗进攻上限有限', '防守', '团队对抗'),
  乌兹别克: p(72, 70, 73, 66, '防守纪律和反击执行力不错，面对强队主要看抗压', '防守反击', '肖穆罗多夫'),
  '刚果(金)': p(73, 72, 72, 70, '身体条件出色，比赛容易进入对抗节奏', '对抗', '巴坎布 / 团队冲击'),
  巴拿马: p(68, 66, 69, 68, '防守会压低阵型，进攻主要依赖转换和定位球', '防守反击', '团队速度'),
  约旦: p(68, 66, 69, 66, '阵型收缩明确，反击依赖效率', '反击', '团队速度'),
  沙特: p(71, 69, 70, 68, '能守能跑，但面对顶级强队抗压难', '反击', '多萨里'),
  佛得角: p(70, 68, 72, 62, '纪律性尚可，阵地进攻火力有限', '防守', '团队防守'),
  新西兰: p(66, 63, 68, 60, '身体对抗够，创造力偏弱', '高空球', '伍德'),
}

const DEFAULT_PROFILE = p(74, 72, 72, 68, '基础信息有限，按中游强度估算', '均衡', '团队发挥')

function p(
  tier: number,
  attack: number,
  defense: number,
  tempo: number,
  form: string,
  edge: string,
  star: string,
): TeamProfile {
  return { tier, attack, defense, tempo, form, edge, star }
}

export function DailyBettingAdvice({ matches }: { matches: Match[] }) {
  const adviceBook = useMemo(() => buildAdviceBook(matches), [matches])
  const [selectedDate, setSelectedDate] = useState('')
  const [riskMode, setRiskMode] = useState<'balanced' | 'conservative' | 'aggressive'>('balanced')
  const advice =
    adviceBook.slates.find((slate) => slate.date === selectedDate) ||
    adviceBook.slates.find((slate) => slate.date === adviceBook.defaultDate) ||
    adviceBook.slates[0]

  useEffect(() => {
    setSelectedDate((current) =>
      adviceBook.slates.some((slate) => slate.date === current)
        ? current
        : adviceBook.defaultDate,
    )
  }, [adviceBook])

  if (!advice) {
    return (
      <section className="daily-advice" id="daily-advice">
        <p className="section-label">中国体彩 · 每日建议</p>
        <h2 className="font-display text-3xl text-[var(--text)]">暂无可推荐赛程</h2>
      </section>
    )
  }

  return (
    <section className="daily-advice" id="daily-advice">
      <div className="advice-header">
        <div>
          <p className="section-label">中国体彩 · 每日建议</p>
          <h2 className="font-display text-3xl text-[var(--text)]">
            {advice.title}
          </h2>
          <p className="advice-status">
            {advice.status} · {oddsStatus(advice.matches)}
          </p>
        </div>
        <div className="advice-budget">
          <span>预算</span>
          <strong>100 元</strong>
        </div>
      </div>

      <p className="advice-note">
        每个比赛日作为独立期次保留，可切换近期回顾；默认展示下一期全部可售场次。只做轻量决策辅助：纸面强弱、风格克制、近期状态、球星强点、小组形势和出线规则；赔率以体彩临场为准。
        复盘修正：前两期主要风险不是“不敢买热门”，而是把低赔热门和深盘强行串关，容错太低；今天保守方案改为单关分散，适中只保留一张小串，比分和半全场只放激进。
      </p>

      <div className="slate-tabs" role="tablist" aria-label="推荐期次">
        {adviceBook.slates.map((slate) => (
          <button
            key={slate.date}
            role="tab"
            aria-selected={slate.date === advice.date}
            className={`slate-tab ${slate.date === advice.date ? 'is-active' : ''}`}
            onClick={() => setSelectedDate(slate.date)}
          >
            <span>{slate.label}</span>
            <small>{slate.matches.length} 场</small>
          </button>
        ))}
      </div>

      <div className="advice-section-head">
        <p className="section-label">单场分析</p>
        <h3 className="font-display text-2xl text-[var(--text)]">方向、比分与节奏参考</h3>
      </div>

      <div className="match-brief-grid">
        {advice.matches.map((match) => (
          <article key={match.match.id} className="match-brief">
            <p className="section-label">
              M{match.match.sporttery_match_num || match.match.source_match_number || '--'} · {formatKickoff(match.match)}
            </p>
            <h3>
              {match.match.home_team}
              <span>vs</span>
              {match.match.away_team}
            </h3>
            <div className="brief-picks">
              <span>{match.pickLabel}</span>
              <span>比分 {match.scorePick}</span>
              <span>{match.totalGoalsPick}</span>
              {match.match.odds_h && (
                <span>
                  胜平负 {match.match.odds_h}/{match.match.odds_d}/{match.match.odds_a}
                </span>
              )}
            </div>
            <p>{match.logic}</p>
          </article>
        ))}
      </div>

      <div className="advice-section-head advice-plan-title">
        <p className="section-label">100 元投注方案</p>
        <h3 className="font-display text-2xl text-[var(--text)]">按风险偏好执行</h3>
      </div>

      <div className="risk-tabs" role="tablist" aria-label="风险偏好">
        <button
          role="tab"
          aria-selected={riskMode === 'balanced'}
          className={`risk-tab ${riskMode === 'balanced' ? 'is-active' : ''}`}
          onClick={() => setRiskMode('balanced')}
        >
          适中
        </button>
        <button
          role="tab"
          aria-selected={riskMode === 'conservative'}
          className={`risk-tab ${riskMode === 'conservative' ? 'is-active' : ''}`}
          onClick={() => setRiskMode('conservative')}
        >
          保守
        </button>
        <button
          role="tab"
          aria-selected={riskMode === 'aggressive'}
          className={`risk-tab ${riskMode === 'aggressive' ? 'is-active' : ''}`}
          onClick={() => setRiskMode('aggressive')}
        >
          激进
        </button>
      </div>

      <div className="advice-grid">
        {riskMode === 'conservative' && (
          <AdvicePlan title="保守" items={advice.conservative} tone="safe" />
        )}
        {riskMode === 'balanced' && (
          <AdvicePlan title="适中" items={advice.balanced} tone="balanced" />
        )}
        {riskMode === 'aggressive' && (
          <AdvicePlan title="激进" items={advice.aggressive} tone="wild" />
        )}
      </div>

      <MysticEntrance matches={advice.matches} />
    </section>
  )
}

function AdvicePlan({
  title,
  items,
  tone,
}: {
  title: string
  items: AdviceItem[]
  tone: 'safe' | 'balanced' | 'wild'
}) {
  const totalMaxPayout = sumPayout(items)
  return (
    <article className={`advice-plan advice-plan-${tone}`}>
      <div className="advice-plan-head">
        <h3 className="font-display text-2xl">{title}</h3>
        <span>
          {items.reduce((sum, item) => sum + item.stake, 0)} 元 · 最高{' '}
          {totalMaxPayout == null ? '--' : money(totalMaxPayout)} 元
        </span>
      </div>
      <div className="advice-items">
        {items.map((item) => (
          <div key={`${item.title}-${item.stake}`} className="advice-item">
            <div className="advice-item-main">
              <strong>{item.title}</strong>
              <span>{item.passType}</span>
              <b>
                {item.stake} 元 / {item.maxPayout == null ? '--' : money(item.maxPayout)}
              </b>
            </div>
            <ul>
              {item.legs.map((leg) => (
                <li key={`${item.title}-${leg.match.match.id}-${leg.market}-${leg.pick}`}>
                  <span>{leg.match.match.home_team} vs {leg.match.match.away_team}</span>
                  <em>{leg.market} · {leg.pick}</em>
                  {leg.odds ? (
                    <small>
                      {item.legStakes ? `${item.legStakes[item.legs.indexOf(leg)]}元 ` : ''}@{leg.odds}
                    </small>
                  ) : (
                    <small>临场赔率</small>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  )
}

function MysticEntrance({ matches }: { matches: AnalyzedMatch[] }) {
  const [matchId, setMatchId] = useState(matches[0]?.match.id || '')
  const selected = matches.find((item) => item.match.id === matchId) || matches[0]

  useEffect(() => {
    setMatchId((current) =>
      matches.some((item) => item.match.id === current)
        ? current
        : matches[0]?.match.id || '',
    )
  }, [matches])

  if (!selected) return null

  return (
    <div className="mystic-entry">
      <div className="mystic-entry-head">
        <div>
          <p className="section-label">玄学入口</p>
          <h3 className="font-display text-2xl">弹球比分转盘</h3>
        </div>
      </div>
      <div className="mystic-panel">
        <label className="field mystic-select">
          <span>选择比赛</span>
          <select
            className="input"
            value={selected.match.id}
            onChange={(event) => setMatchId(event.target.value)}
          >
            {matches.map((item) => (
              <option key={item.match.id} value={item.match.id}>
                {item.match.home_team} vs {item.match.away_team}
              </option>
            ))}
          </select>
        </label>
        <GoalWheel match={selected.match} />
      </div>
    </div>
  )
}

function GoalWheel({ match }: { match: Match }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const stateRef = useRef<WheelState | null>(null)
  const [running, setRunning] = useState(false)
  const [minute, setMinute] = useState(0)
  const [score, setScore] = useState({ home: 0, away: 0 })
  const [lastGoal, setLastGoal] = useState('')

  useEffect(() => {
    setScore({ home: 0, away: 0 })
    setMinute(0)
    setLastGoal('')
    stateRef.current = null
    drawWheel(canvasRef.current, match, stateRef.current)
  }, [match])

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  const start = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    const initial = createWheelState(canvasRef.current)
    stateRef.current = initial
    setScore({ home: 0, away: 0 })
    setMinute(0)
    setLastGoal('')
    setRunning(true)

    const tick = (now: number) => {
      const state = stateRef.current
      if (!state) return
      if (!state.startedAt) state.startedAt = now
      const elapsed = now - state.startedAt
      const progress = Math.min(1, elapsed / 20000)
      const nextMinute = Math.min(90, Math.floor(progress * 90))
      updateWheel(state, (team) => {
        setLastGoal(team === 'home' ? `${match.home_team} 进球` : `${match.away_team} 进球`)
        setScore((current) =>
          team === 'home'
            ? { ...current, home: current.home + 1 }
            : { ...current, away: current.away + 1 },
        )
      })
      drawWheel(canvasRef.current, match, state)
      setMinute(nextMinute)
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(tick)
      } else {
        setRunning(false)
        animationRef.current = null
      }
    }
    animationRef.current = requestAnimationFrame(tick)
  }

  const reset = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    animationRef.current = null
    stateRef.current = null
    setRunning(false)
    setMinute(0)
    setScore({ home: 0, away: 0 })
    setLastGoal('')
    drawWheel(canvasRef.current, match, null)
  }

  return (
    <div className="goal-wheel-wrap">
      <div className="scoreboard">
        <span>{match.home_team}</span>
        <strong>{score.home} : {score.away}</strong>
        <span>{match.away_team}</span>
        <b>{minute}'</b>
      </div>
      <div className={`goal-flash ${lastGoal ? 'is-active' : ''}`}>
        {lastGoal || '等待进球'}
      </div>
      <canvas ref={canvasRef} className="goal-wheel" width={720} height={360} />
      <div className="goal-wheel-actions">
        <button className="primary-button" disabled={running} onClick={start}>
          {running ? '模拟中…' : '开始 20 秒模拟'}
        </button>
        <button className="secondary-button" onClick={reset}>重置</button>
      </div>
    </div>
  )
}

type WheelBall = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  team: 'home' | 'away'
  trail: Array<{ x: number; y: number }>
}

type WheelState = {
  startedAt: number
  cx: number
  cy: number
  radius: number
  balls: WheelBall[]
  goalCooldown: number
}

function createWheelState(canvas: HTMLCanvasElement | null): WheelState {
  const width = canvas?.width || 720
  const height = canvas?.height || 360
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) * 0.42
  return {
    startedAt: 0,
    cx,
    cy,
    radius,
    balls: [
      makeBall(cx - 58, cy - 24, 'home'),
      makeBall(cx + 34, cy + 24, 'away'),
    ],
    goalCooldown: 0,
  }
}

function makeBall(
  x: number,
  y: number,
  team: 'home' | 'away',
  aimGoal = false,
): WheelBall {
  const angle = aimGoal
    ? (Math.random() - 0.5) * 1.15
    : Math.random() * Math.PI * 2
  const speed = 3.25 + Math.random() * 1.65
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: 12,
    team,
    trail: [],
  }
}

function updateWheel(
  state: WheelState,
  onGoal: (team: 'home' | 'away') => void,
) {
  const goalHalfHeight = 25
  state.goalCooldown = Math.max(0, state.goalCooldown - 1)
  for (const ball of state.balls) {
    ball.trail = [...ball.trail.slice(-9), { x: ball.x, y: ball.y }]
    ball.vx += (Math.random() - 0.5) * 0.1
    ball.vy += (Math.random() - 0.5) * 0.1
    const speed = Math.hypot(ball.vx, ball.vy)
    if (speed < 2.7) {
      ball.vx *= 1.08
      ball.vy *= 1.08
    }
    if (speed > 5.8) {
      ball.vx *= 0.94
      ball.vy *= 0.94
    }
    ball.x += ball.vx
    ball.y += ball.vy

    const dx = ball.x - state.cx
    const dy = ball.y - state.cy
    const distance = Math.hypot(dx, dy)
    const goalX = state.cx + state.radius - 26
    const inGoalMouth =
      ball.x + ball.r > goalX &&
      Math.abs(ball.y - state.cy) < goalHalfHeight &&
      ball.vx > 0

    if (inGoalMouth && state.goalCooldown === 0) {
      state.goalCooldown = 36
      onGoal(ball.team)
      const fresh = makeBall(state.cx + (Math.random() - 0.5) * 36, state.cy + (Math.random() - 0.5) * 46, ball.team)
      Object.assign(ball, fresh)
      continue
    } else if (inGoalMouth) {
      ball.vx = -Math.abs(ball.vx) * 0.88
      ball.vy += (Math.random() - 0.5) * 1.1
    }

    if (distance + ball.r > state.radius) {
      const nx = dx / distance
      const ny = dy / distance
      const dot = ball.vx * nx + ball.vy * ny
      ball.vx -= 2 * dot * nx
      ball.vy -= 2 * dot * ny
      ball.x = state.cx + nx * (state.radius - ball.r)
      ball.y = state.cy + ny * (state.radius - ball.r)
    }
  }

  const [first, second] = state.balls
  const dx = second.x - first.x
  const dy = second.y - first.y
  const distance = Math.hypot(dx, dy)
  const minDistance = first.r + second.r
  if (distance > 0 && distance < minDistance) {
    const nx = dx / distance
    const ny = dy / distance
    const overlap = minDistance - distance
    first.x -= nx * overlap * 0.5
    first.y -= ny * overlap * 0.5
    second.x += nx * overlap * 0.5
    second.y += ny * overlap * 0.5
    const firstAlong = first.vx * nx + first.vy * ny
    const secondAlong = second.vx * nx + second.vy * ny
    first.vx += (secondAlong - firstAlong) * nx
    first.vy += (secondAlong - firstAlong) * ny
    second.vx += (firstAlong - secondAlong) * nx
    second.vy += (firstAlong - secondAlong) * ny
  }
}

function drawWheel(
  canvas: HTMLCanvasElement | null,
  match: Match,
  state: WheelState | null,
) {
  if (!canvas) return
  const context = canvas.getContext('2d')
  if (!context) return
  const width = canvas.width
  const height = canvas.height
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) * 0.42
  const balls = state?.balls || [
    { x: cx - 58, y: cy - 24, r: 12, team: 'home' as const, trail: [] },
    { x: cx + 34, y: cy + 24, r: 12, team: 'away' as const, trail: [] },
  ]

  context.clearRect(0, 0, width, height)
  const background = context.createLinearGradient(0, 0, width, height)
  background.addColorStop(0, '#fbf7ed')
  background.addColorStop(1, '#e7ddca')
  context.fillStyle = background
  context.fillRect(0, 0, width, height)

  context.save()
  context.beginPath()
  context.arc(cx, cy, radius, 0, Math.PI * 2)
  context.clip()
  context.fillStyle = '#d8ead6'
  context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)
  for (let x = cx - radius; x < cx + radius; x += 34) {
    context.fillStyle = x / 34 % 2 > 1 ? 'rgba(47, 128, 85, 0.08)' : 'rgba(255, 253, 248, 0.18)'
    context.fillRect(x, cy - radius, 34, radius * 2)
  }
  context.strokeStyle = 'rgba(255, 253, 248, 0.74)'
  context.lineWidth = 2
  context.beginPath()
  context.arc(cx, cy, 46, 0, Math.PI * 2)
  context.stroke()
  context.beginPath()
  context.moveTo(cx, cy - radius)
  context.lineTo(cx, cy + radius)
  context.stroke()
  context.restore()

  context.beginPath()
  context.arc(cx, cy, radius, 0, Math.PI * 2)
  context.lineWidth = 3
  context.strokeStyle = '#c9c0b0'
  context.stroke()

  context.fillStyle = '#f7f2e7'
  context.fillRect(cx + radius - 13, cy - 30, 31, 60)
  context.strokeStyle = '#1e1d19'
  context.lineWidth = 2
  context.strokeRect(cx + radius - 13, cy - 30, 31, 60)
  context.strokeStyle = 'rgba(30, 29, 25, 0.24)'
  context.lineWidth = 1
  for (let y = cy - 24; y <= cy + 24; y += 12) {
    context.beginPath()
    context.moveTo(cx + radius - 13, y)
    context.lineTo(cx + radius + 18, y)
    context.stroke()
  }
  for (let x = cx + radius - 5; x <= cx + radius + 14; x += 8) {
    context.beginPath()
    context.moveTo(x, cy - 30)
    context.lineTo(x, cy + 30)
    context.stroke()
  }

  for (const ball of balls) {
    ball.trail.forEach((point, index) => {
      context.beginPath()
      context.arc(point.x, point.y, ball.r * (0.28 + index * 0.045), 0, Math.PI * 2)
      context.fillStyle =
        ball.team === 'home'
          ? `rgba(197, 111, 82, ${0.05 + index * 0.018})`
          : `rgba(69, 101, 141, ${0.05 + index * 0.018})`
      context.fill()
    })
    const ballGradient = context.createRadialGradient(
      ball.x - 4,
      ball.y - 5,
      2,
      ball.x,
      ball.y,
      ball.r,
    )
    ballGradient.addColorStop(0, '#fffdf8')
    ballGradient.addColorStop(0.35, ball.team === 'home' ? '#e09a7f' : '#7b98bf')
    ballGradient.addColorStop(1, ball.team === 'home' ? '#a9573e' : '#34557c')
    context.beginPath()
    context.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2)
    context.fillStyle = ballGradient
    context.fill()
    context.lineWidth = 2
    context.strokeStyle = '#fffdf8'
    context.stroke()
  }

  context.fillStyle = '#1e1d19'
  context.font = '600 18px Avenir Next, sans-serif'
  context.textAlign = 'center'
  context.fillText(match.home_team, cx - 110, 38)
  context.fillText(match.away_team, cx + 110, 38)
}

function buildAdviceBook(matches: Match[]): AdviceBook {
  const sorted = [...matches].sort((a, b) =>
    (a.kickoff_at || a.match_date).localeCompare(b.kickoff_at || b.match_date),
  )
  const today = shanghaiDateKey()
  const grouped = new Map<string, Match[]>()
  sorted
    .filter((match) => !match.home_team.includes('席位') && !match.away_team.includes('席位'))
    .forEach((match) => {
      grouped.set(match.match_date, [...(grouped.get(match.match_date) || []), match])
    })
  const allDates = [...grouped.keys()].sort()
  const focusDate =
    allDates.find((date) => date > today) ||
    allDates.find((date) => date >= today) ||
    allDates.at(-1) ||
    today
  const focusIndex = Math.max(0, allDates.indexOf(focusDate))
  const visibleDates = allDates.slice(
    Math.max(0, focusIndex - 5),
    Math.min(allDates.length, focusIndex + 8),
  )
  const slates = visibleDates.map((date) =>
    buildAdviceSlate(date, grouped.get(date) || [], today, date === focusDate),
  )

  return {
    defaultDate: focusDate,
    slates,
  }
}

function buildAdviceSlate(
  selectedDate: string,
  matches: Match[],
  today: string,
  isDefault: boolean,
): AdviceSlate {
  const dayMatches = matches.map(analyzeMatch)
  const ranked = [...dayMatches].sort((a, b) => b.confidence - a.confidence)
  const winRanked = ranked.filter(hasWinOdds)
  const primary = winRanked[0] || ranked[0] || dayMatches[0]
  const secondary = winRanked[1] || ranked[1] || primary
  const third = winRanked[2] || ranked[2] || secondary
  const conservativeLegs = winRanked.slice(0, 3).map(winLeg)
  const balancedSingleLegs = [winLeg(primary), lowVariancePropLeg(third)]
  const dominant = ranked[0] || primary
  const nonDominant = ranked.find((match) => match.match.id !== dominant.match.id) || third
  const aggressiveDirectionLegs = buildHighOddsLegs([
    handicapLeg(primary),
    handicapLeg(secondary),
    handicapLeg(third),
    handicapLeg(nonDominant),
  ], 10)
  const aggressiveSpecialLegs = buildHighOddsLegs([
    scoreLeg(dominant),
    halfFullLeg(secondary),
    goalsLeg(third),
    handicapLeg(nonDominant),
  ], 10)

  return {
    date: selectedDate,
    title: `${selectedDate.slice(5).replace('-', '/')} ${dayMatches.length} 场投注建议`,
    label: `${selectedDate.slice(5).replace('-', '/')}${isDefault ? ' 下一期' : ''}`,
    status: slateStatus(selectedDate, today, matches),
    matches: dayMatches,
    conservative: [
      item('单关分散票', 100, '单关合并', conservativeLegs, splitStake(100, conservativeLegs.length)),
    ],
    balanced: [
      item('单关缓冲票', 40, '单关合并', balancedSingleLegs, splitStake(40, balancedSingleLegs.length)),
      item('核心 2 串 1', 60, '2串1', [winLeg(primary), winLeg(secondary)]),
    ],
    aggressive: [
      item('高倍方向串', 60, `${aggressiveDirectionLegs.length}串1`, aggressiveDirectionLegs),
      item('高赔玩法串', 40, `${aggressiveSpecialLegs.length}串1`, aggressiveSpecialLegs),
    ],
  }
}

function slateStatus(date: string, today: string, matches: Match[]) {
  if (matches.length === 0) return '暂无该期赛程'
  if (matches.every((match) => match.match_status === 'finished')) return '回顾期 · 已完赛'
  if (date < today) return '回顾期 · 赛果可能未录完'
  if (date === today) return '当日期 · 可临场调整'
  return '下一期 · 默认展示'
}

function oddsStatus(matches: AnalyzedMatch[]) {
  const latest = matches
    .map((item) => item.match.sporttery_updated_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1)
  return latest ? `体彩赔率 ${latest}` : '体彩赔率待临场确认'
}

function item(
  title: string,
  stake: number,
  passType: string,
  legs: AdviceLeg[],
  legStakes?: number[],
): AdviceItem {
  const cleanLegs = legs.filter(Boolean)
  const cleanLegStakes =
    legStakes && legStakes.length === cleanLegs.length ? legStakes : undefined
  return {
    title,
    stake,
    passType,
    legs: cleanLegs,
    legStakes: cleanLegStakes,
    maxPayout: estimatePayout(stake, cleanLegs, cleanLegStakes),
  }
}

function splitStake(total: number, count: number) {
  if (count <= 0) return undefined
  const stakes = Array.from({ length: count }, () => 2)
  let remaining = total - stakes.reduce((sum, stake) => sum + stake, 0)
  let index = 0
  while (remaining > 0) {
    stakes[index % count] += 2
    remaining -= 2
    index += 1
  }
  return stakes
}

function analyzeMatch(match: Match): AnalyzedMatch {
  const home = TEAM_PROFILES[match.home_team] || DEFAULT_PROFILE
  const away = TEAM_PROFILES[match.away_team] || DEFAULT_PROFILE
  const ratingDelta = home.tier + 3 - away.tier
  const model = modelProbabilities(ratingDelta)
  const odds = oddsProbabilities(match)
  const probabilities = blendProbabilities(model, odds)
  const pick = bestOutcome(probabilities)
  const expectedHomeGoals = clamp(
    1.25 + (home.attack - away.defense) * 0.026 + ratingDelta * 0.018 + (home.tempo + away.tempo - 136) * 0.006,
    0.4,
    3.5,
  )
  const expectedAwayGoals = clamp(
    1.18 + (away.attack - home.defense) * 0.026 - ratingDelta * 0.018 + (home.tempo + away.tempo - 136) * 0.006,
    0.35,
    3.2,
  )
  const scorePick = scoreFromGoals(expectedHomeGoals, expectedAwayGoals, pick)
  const totalGoals = Math.max(0, Math.min(7, Math.round(expectedHomeGoals + expectedAwayGoals)))
  const qualification = qualificationNote(match)

  return {
    match,
    home,
    away,
    probabilities,
    pick,
    pickLabel: `胜平负 ${outcomeLabel(pick)}`,
    confidence: probabilities[pick],
    expectedHomeGoals,
    expectedAwayGoals,
    scorePick,
    totalGoalsPick: `总进球 ${totalGoals}球`,
    halfFullPick: halfFullFromPick(pick, probabilities[pick]),
    handicapPick: handicapFromMatch(match, scorePick),
    logic: `${match.home_team}偏${home.edge}，${match.away_team}偏${away.edge}；${home.star} 对 ${away.star}。${home.form}，${away.form}。${qualification}`,
  }
}

function qualificationNote(match: Match) {
  if (match.stage === 'group' && match.round_number === 3) {
    const group = match.group_name ? `${match.group_name}组` : '本组'
    return `末轮形势：${group}两场同时开球，前二直接晋级，成绩最好的 8 个小组第三也进 32 强；投注上更重视不败、净胜球和控风险，深盘穿盘不能简单当稳胆。`
  }
  if (match.stage === 'group' && match.round_number === 2) {
    return '第二轮形势：抢分会明显影响末轮压力，领先方未必持续追大比分，落后方需要考虑搏分。'
  }
  return ''
}

function modelProbabilities(delta: number): Record<Outcome, number> {
  const homeRaw = Math.exp(delta / 18)
  const awayRaw = Math.exp(-delta / 18)
  const drawRaw = 0.82 + Math.exp(-Math.abs(delta) / 18) * 0.56
  const total = homeRaw + drawRaw + awayRaw
  return { H: homeRaw / total, D: drawRaw / total, A: awayRaw / total }
}

function oddsProbabilities(match: Match): Record<Outcome, number> | null {
  if (!match.odds_h || !match.odds_d || !match.odds_a) return null
  const h = 1 / match.odds_h
  const d = 1 / match.odds_d
  const a = 1 / match.odds_a
  const total = h + d + a
  return { H: h / total, D: d / total, A: a / total }
}

function blendProbabilities(
  model: Record<Outcome, number>,
  odds: Record<Outcome, number> | null,
): Record<Outcome, number> {
  if (!odds) return model
  return {
    H: model.H * 0.45 + odds.H * 0.55,
    D: model.D * 0.45 + odds.D * 0.55,
    A: model.A * 0.45 + odds.A * 0.55,
  }
}

function bestOutcome(probabilities: Record<Outcome, number>): Outcome {
  return (Object.entries(probabilities) as Array<[Outcome, number]>).sort(
    (a, b) => b[1] - a[1],
  )[0][0]
}

function winLeg(match: AnalyzedMatch): AdviceLeg {
  const odds =
    match.pick === 'H'
      ? match.match.odds_h
      : match.pick === 'D'
        ? match.match.odds_d
        : match.match.odds_a
  return {
    match,
    market: '胜平负',
    pick: outcomeLabel(match.pick),
    odds,
  }
}

function hasWinOdds(match: AnalyzedMatch) {
  return Boolean(
    match.pick === 'H'
      ? match.match.odds_h
      : match.pick === 'D'
        ? match.match.odds_d
        : match.match.odds_a,
  )
}

function playableDirectionLeg(match: AnalyzedMatch) {
  return hasWinOdds(match) ? winLeg(match) : handicapLeg(match)
}

function lowVariancePropLeg(match: AnalyzedMatch) {
  const goals = goalsLeg(match)
  return goals.odds ? goals : playableDirectionLeg(match)
}

function uniqueMatchLegs(legs: AdviceLeg[]) {
  const seen = new Set<string>()
  return legs.filter((leg) => {
    if (!leg.odds || seen.has(leg.match.match.id)) return false
    seen.add(leg.match.match.id)
    return true
  })
}

function buildHighOddsLegs(legs: AdviceLeg[], minOdds: number) {
  const selected: AdviceLeg[] = []
  let multiple = 1
  for (const leg of uniqueMatchLegs(legs)) {
    selected.push(leg)
    multiple *= Number(leg.odds)
    if (multiple >= minOdds) break
  }
  return selected
}

function handicapLeg(match: AnalyzedMatch): AdviceLeg {
  return {
    match,
    market: '让球胜平负',
    pick: match.handicapPick,
    odds: handicapOdds(match),
  }
}

function goalsLeg(match: AnalyzedMatch): AdviceLeg {
  const goals = match.totalGoalsPick.replace('总进球 ', '').replace('球', '')
  return {
    match,
    market: '总进球',
    pick: `${goals}球`,
    odds: match.match.odds_total_goals?.[goals],
  }
}

function scoreLeg(match: AnalyzedMatch): AdviceLeg {
  return {
    match,
    market: '比分',
    pick: match.scorePick,
    odds: match.match.odds_score?.[match.scorePick],
  }
}

function halfFullLeg(match: AnalyzedMatch): AdviceLeg {
  return {
    match,
    market: '半全场',
    pick: match.halfFullPick,
    odds: match.match.odds_half_full?.[match.halfFullPick],
  }
}

function handicapOdds(match: AnalyzedMatch) {
  const pick = handicapOutcomeFromScore(match.match, match.scorePick)
  return pick === 'H'
    ? match.match.odds_handicap_h
    : pick === 'D'
      ? match.match.odds_handicap_d
      : match.match.odds_handicap_a
}

function handicapFromMatch(match: Match, scorePick: string) {
  if (match.handicap_value == null) {
    return `临场让球按 ${scorePick} 反推`
  }
  return `让${formatHandicap(match.handicap_value)} ${outcomeLabel(handicapOutcomeFromScore(match, scorePick))}`
}

function handicapOutcomeFromScore(match: Match, scorePick: string): Outcome {
  const [home, away] = scorePick.split(':').map(Number)
  const adjustedHome = home + (match.handicap_value || 0)
  return adjustedHome > away ? 'H' : adjustedHome < away ? 'A' : 'D'
}

function scoreFromGoals(homeGoals: number, awayGoals: number, pick: Outcome) {
  let home = Math.max(0, Math.round(homeGoals))
  let away = Math.max(0, Math.round(awayGoals))
  if (pick === 'H' && home <= away) home = away + 1
  if (pick === 'A' && away <= home) away = home + 1
  if (pick === 'D') {
    const value = Math.max(0, Math.round((home + away) / 2))
    home = value
    away = value
  }
  return `${Math.min(home, 5)}:${Math.min(away, 5)}`
}

function halfFullFromPick(pick: Outcome, confidence: number) {
  const final = hafuLabel(pick)
  if (pick === 'D') return '平/平'
  return confidence > 0.5 ? `${final}/${final}` : `平/${final}`
}

function outcomeLabel(outcome: Outcome) {
  return outcome === 'H' ? '主胜' : outcome === 'A' ? '客胜' : '平'
}

function hafuLabel(outcome: Outcome) {
  return outcome === 'H' ? '胜' : outcome === 'A' ? '负' : '平'
}

function estimatePayout(stake: number, legs: AdviceLeg[], legStakes?: number[]) {
  if (!legs.length || legs.some((leg) => !leg.odds)) return null
  if (legStakes) {
    return roundMoney(
      legs.reduce(
        (sum, leg, index) => sum + (legStakes[index] || 0) * Number(leg.odds),
        0,
      ),
    )
  }
  return roundMoney(
    stake * legs.reduce((product, leg) => product * Number(leg.odds), 1),
  )
}

function sumPayout(items: AdviceItem[]) {
  if (items.some((item) => item.maxPayout == null)) return null
  return roundMoney(items.reduce((sum, item) => sum + Number(item.maxPayout), 0))
}

function money(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 2,
  }).format(value)
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

function formatHandicap(value: number) {
  if (value === 0) return '0'
  return value > 0 ? `+${value}` : String(value)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function shanghaiDateKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function formatKickoff(match: Match) {
  if (!match.kickoff_at) return match.match_date.slice(5).replace('-', '/')
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(match.kickoff_at))
}
