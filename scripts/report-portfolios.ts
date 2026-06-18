import { settleTicket, summarizeBets } from '../lib/wcw2026/metrics.ts'
import type { TicketRecord } from '../lib/wcw2026/types.ts'

const baseUrl = process.env.REPORT_BASE_URL || 'http://localhost:3010'
const users = ['木四', '听课', '饼干', 'yang没吐气']

for (const name of users) {
  const loginResponse = await fetch(`${baseUrl}/api/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  const login = await loginResponse.json()
  const cookie = loginResponse.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
    .join('; ')
  const response = await fetch(`${baseUrl}/api/data`, {
    headers: { cookie, 'x-session-token': login.token },
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`${name}: ${JSON.stringify(data)}`)
  }

  const tickets: TicketRecord[] = data.tickets.map((ticket: TicketRecord) =>
    settleTicket(ticket, data.matches),
  )
  const summary = summarizeBets(data.bets, tickets)
  console.log(
    JSON.stringify({
      name,
      bets: data.bets.length,
      tickets: tickets.length,
      scoreLegs: tickets
        .flatMap((ticket) => ticket.legs)
        .filter((leg) => leg.market === 'score').length,
      ...summary,
    }),
  )
}
