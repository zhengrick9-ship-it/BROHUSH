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
  摩洛哥: p(83, 79, 86, 64, '防线组织强，反击质量高', '防守反击', '阿什拉夫'),
  日本: p(82, 80, 79, 76, '节奏快，压迫和脚下衔接好', '速度', '三笘薰 / 久保建英'),
  美国: p(80, 79, 77, 78, '运动能力好，主场氛围加成', '冲击', '普利西奇'),
  墨西哥: p(79, 76, 79, 70, '主场韧性强，杯赛经验足', '主场', '希门尼斯'),
  哥伦比亚: p(82, 82, 79, 72, '前场创造力强，容易出进球', '进攻', '迪亚斯'),
  塞内加尔: p(81, 78, 82, 70, '身体强度高，防守反击直接', '身体', '马内'),
  奥地利: p(80, 78, 80, 76, '整体压迫强，执行力稳定', '压迫', '萨比策'),
  土耳其: p(79, 81, 74, 80, '进攻有想象力，防线波动偏大', '进攻', '恰尔汗奥卢'),
  厄瓜多尔: p(78, 76, 79, 74, '对抗和跑动强，节奏不慢', '对抗', '凯塞多'),
  伊朗: p(76, 73, 78, 62, '防守站位稳，进攻偏直接', '防守', '塔雷米'),
  埃及: p(77, 76, 75, 66, '单点爆破强，整体稳定性一般', '边路', '萨拉赫'),
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
  const advice = useMemo(() => buildDailyAdvice(matches), [matches])

  return (
    <section className="daily-advice" id="daily-advice">
      <div className="advice-header">
        <div>
          <p className="section-label">中国体彩 · 每日建议</p>
          <h2 className="font-display text-3xl text-[var(--text)]">
            {advice.title}
          </h2>
        </div>
        <div className="advice-budget">
          <span>预算</span>
          <strong>100 元</strong>
        </div>
      </div>

      <p className="advice-note">
        只做轻量决策辅助：优先看纸面强弱、风格克制、近期状态、球星强点和小组形势。比分、总进球、半全场赔率以体彩临场为准。
      </p>

      <div className="match-brief-grid">
        {advice.matches.map((match) => (
          <article key={match.match.id} className="match-brief">
            <p className="section-label">
              M{match.match.source_match_number || '--'} · {formatKickoff(match.match)}
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
            </div>
            <p>{match.logic}</p>
          </article>
        ))}
      </div>

      <div className="advice-grid">
        <AdvicePlan title="保守" items={advice.conservative} tone="safe" />
        <AdvicePlan title="适中" items={advice.balanced} tone="balanced" />
        <AdvicePlan title="激进" items={advice.aggressive} tone="wild" />
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
  return (
    <article className={`advice-plan advice-plan-${tone}`}>
      <div className="advice-plan-head">
        <h3 className="font-display text-2xl">{title}</h3>
        <span>{items.reduce((sum, item) => sum + item.stake, 0)} 元</span>
      </div>
      <div className="advice-items">
        {items.map((item) => (
          <div key={`${item.title}-${item.stake}`} className="advice-item">
            <div className="advice-item-main">
              <strong>{item.title}</strong>
              <span>{item.passType}</span>
              <b>{item.stake} 元</b>
            </div>
            <ul>
              {item.legs.map((leg) => (
                <li key={`${item.title}-${leg.match.match.id}-${leg.market}-${leg.pick}`}>
                  <span>{leg.match.match.home_team} vs {leg.match.match.away_team}</span>
                  <em>{leg.market} · {leg.pick}</em>
                  {leg.odds ? <small>@{leg.odds}</small> : <small>临场赔率</small>}
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
  const [open, setOpen] = useState(false)
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
        <button className="secondary-button" onClick={() => setOpen((value) => !value)}>
          {open ? '收起转盘' : '打开转盘'}
        </button>
      </div>
      {open && (
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
      )}
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

  useEffect(() => {
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
    setRunning(true)

    const tick = (now: number) => {
      const state = stateRef.current
      if (!state) return
      if (!state.startedAt) state.startedAt = now
      const elapsed = now - state.startedAt
      const progress = Math.min(1, elapsed / 20000)
      const nextMinute = Math.min(90, Math.floor(progress * 90))
      updateWheel(state, match, (team) => {
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
}

type WheelState = {
  startedAt: number
  cx: number
  cy: number
  radius: number
  balls: WheelBall[]
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
      makeBall(cx - 44, cy - 18, 'home'),
      makeBall(cx + 38, cy + 18, 'away'),
    ],
  }
}

function makeBall(x: number, y: number, team: 'home' | 'away'): WheelBall {
  const angle = Math.random() * Math.PI * 2
  const speed = 3.2 + Math.random() * 2.4
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: 12,
    team,
  }
}

function updateWheel(
  state: WheelState,
  match: Match,
  onGoal: (team: 'home' | 'away') => void,
) {
  const goalHalfHeight = 34
  for (const ball of state.balls) {
    ball.x += ball.vx
    ball.y += ball.vy

    const dx = ball.x - state.cx
    const dy = ball.y - state.cy
    const distance = Math.hypot(dx, dy)
    const goalX = state.cx + state.radius - 18
    const inGoalMouth =
      ball.x > goalX &&
      Math.abs(ball.y - state.cy) < goalHalfHeight &&
      ball.vx > 0

    if (inGoalMouth) {
      onGoal(ball.team)
      const fresh = makeBall(state.cx, state.cy, ball.team)
      Object.assign(ball, fresh)
      continue
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

  void match
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
    { x: cx - 44, y: cy - 18, r: 12, team: 'home' as const },
    { x: cx + 38, y: cy + 18, r: 12, team: 'away' as const },
  ]

  context.clearRect(0, 0, width, height)
  context.fillStyle = '#faf8f3'
  context.fillRect(0, 0, width, height)
  context.beginPath()
  context.arc(cx, cy, radius, 0, Math.PI * 2)
  context.fillStyle = '#ece4d5'
  context.fill()
  context.lineWidth = 3
  context.strokeStyle = '#c9c0b0'
  context.stroke()

  context.fillStyle = '#2f8055'
  context.fillRect(cx + radius - 12, cy - 34, 30, 68)
  context.strokeStyle = '#1e1d19'
  context.strokeRect(cx + radius - 12, cy - 34, 30, 68)

  for (const ball of balls) {
    context.beginPath()
    context.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2)
    context.fillStyle = ball.team === 'home' ? '#c56f52' : '#45658d'
    context.fill()
    context.lineWidth = 2
    context.strokeStyle = '#fffdf8'
    context.stroke()
  }

  context.fillStyle = '#5e5a51'
  context.font = '18px Avenir Next, sans-serif'
  context.textAlign = 'center'
  context.fillText(match.home_team, cx - 96, 38)
  context.fillText(match.away_team, cx + 96, 38)
}

function buildDailyAdvice(matches: Match[]) {
  const sorted = [...matches].sort((a, b) =>
    (a.kickoff_at || a.match_date).localeCompare(b.kickoff_at || b.match_date),
  )
  const today = shanghaiDateKey()
  const selectedDate =
    sorted.find((match) => match.match_status !== 'finished' && match.match_date >= today)
      ?.match_date ||
    sorted.find((match) => match.match_date === today)?.match_date ||
    sorted[0]?.match_date ||
    today
  const dayMatches = sorted
    .filter((match) => match.match_date === selectedDate)
    .slice(0, 4)
    .map(analyzeMatch)
  const ranked = [...dayMatches].sort((a, b) => b.confidence - a.confidence)
  const primary = ranked[0] || dayMatches[0]
  const secondary = ranked[1] || primary
  const third = ranked[2] || secondary
  const fourth = ranked[3] || third

  return {
    title: `${selectedDate.slice(5).replace('-', '/')} ${dayMatches.length} 场投注建议`,
    matches: dayMatches,
    conservative: [
      item('稳胆单关', 50, '单关', [winLeg(primary)]),
      item('次稳单关', 30, '单关', [winLeg(secondary)]),
      item('小额 2 串 1', 20, '2串1', [winLeg(primary), doubleChanceLeg(secondary)]),
    ],
    balanced: [
      item('主思路单关', 30, '单关', [winLeg(primary)]),
      item('核心 2 串 1', 30, '2串1', [winLeg(primary), winLeg(secondary)]),
      item('让球方向', 20, '单关', [handicapLeg(primary)]),
      item('节奏补充', 20, '单关', [goalsLeg(third)]),
    ],
    aggressive: [
      item('三场方向串', 35, '3串1', [winLeg(primary), winLeg(secondary), winLeg(third)]),
      item('四场搏高赔', 25, '4串1', [winLeg(primary), winLeg(secondary), winLeg(third), winLeg(fourth)]),
      item('精准比分', 20, '单关', [scoreLeg(primary)]),
      item('半全场搏点', 20, '单关', [halfFullLeg(secondary)]),
    ],
  }
}

function item(title: string, stake: number, passType: string, legs: AdviceLeg[]): AdviceItem {
  return { title, stake, passType, legs: legs.filter(Boolean) }
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
  const totalGoals = Math.max(1, Math.min(6, Math.round(expectedHomeGoals + expectedAwayGoals)))

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
    totalGoalsPick: `总进球 ${Math.max(1, totalGoals - 1)}/${totalGoals}球`,
    halfFullPick: halfFullFromPick(pick, probabilities[pick]),
    handicapPick: handicapFromMatch(match, scorePick),
    logic: `${match.home_team}偏${home.edge}，${match.away_team}偏${away.edge}；${home.star} 对 ${away.star}。${home.form}，${away.form}。`,
  }
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

function doubleChanceLeg(match: AnalyzedMatch): AdviceLeg {
  const sorted = (Object.entries(match.probabilities) as Array<[Outcome, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([outcome]) => outcomeLabel(outcome))
  return {
    match,
    market: '容错方向',
    pick: sorted.join('/'),
  }
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
  return {
    match,
    market: '总进球',
    pick: match.totalGoalsPick.replace('总进球 ', ''),
  }
}

function scoreLeg(match: AnalyzedMatch): AdviceLeg {
  return {
    match,
    market: '比分',
    pick: match.scorePick,
  }
}

function halfFullLeg(match: AnalyzedMatch): AdviceLeg {
  return {
    match,
    market: '半全场',
    pick: match.halfFullPick,
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
  const final = outcomeLabel(pick)
  if (pick === 'D') return '平/平'
  return confidence > 0.5 ? `${final}/${final}` : `平/${final}`
}

function outcomeLabel(outcome: Outcome) {
  return outcome === 'H' ? '主胜' : outcome === 'A' ? '客胜' : '平'
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
