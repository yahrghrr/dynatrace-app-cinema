# Box Office Command

A Dynatrace AppEngine app for cinema executives during blockbuster season. It connects digital experience
(booking, seat maps, payments, F&B pre-order, loyalty, kiosks) to what the board cares about: **ticket +
food & beverage revenue, gross profit and revenue at risk**.

## Pages
| Page | What it answers |
|---|---|
| **Executive Overview** | How much are we making today, vs last week, and what is putting revenue at risk right now? Includes a countdown to *Avengers: Doomsday*. |
| **Blockbuster Watch** | Slate performance (*Godzilla Minus Zero*, *Hunger Games*, *Jumanji 3*, *Avengers: Doomsday*, *Dune: Part Three*), themed collector-bucket sell-through, opening-night capacity readiness, the 18 Dec clash. |
| **Food & Beverage** | Spend per head, attach rate, top items with margin, a site league table, order/payment mix and an **uplift simulator** (what +RM 1 SPH is worth per year). |
| **Digital Channels** | Health of each guest-journey channel, Davis problems priced in ringgit, and the booking funnel. |
| **Observability** | A **business impact map** that ties each board KPI (ticket conversion, payment completion, F&B spend per head, opening-night capacity, cost of downtime…) to the signal behind it, plus tabs for services & SLOs/error budgets, hosts & Kubernetes, logs, problems & MTTR, real user experience and synthetic monitoring. Every row drills into the standard Dynatrace app. |
| **Data & Method** | Where every number comes from, the assumptions, and the business-event schema. |

## Data modes (toggle in the header)
- **Live**: Channel health and incidents come straight from Grail (`dt.service.request.*` metrics and `dt.davis.problems`).
  The six busiest services are mapped onto the six cinema channels. Revenue is **modelled** from real transaction
  volume × business assumptions, or is **live** when the tenant sends `cinema.ticket.purchase` / `cinema.fnb.order` business events.
- **Demo**: A synthetic Malaysian cinema chain with realistic evening demand curves. No tenant data needed.
  Live mode falls back to demo automatically if queries fail or there is no service traffic.

**Drilldowns:** links use Dynatrace intents to open Problems (Davis root cause), Services, Infrastructure & Operations,
Kubernetes, Logs, Notebooks, SLOs, Synthetic and Experience Vitals in context. In live mode they target the exact
problem, service, host or workload; in demo mode they open the app's landing page.

Each panel carries a **Live / Modelled / Demo** badge, so nobody mistakes a model for a measurement.
Business assumptions (ticket price, SPH, margins, scaling) can be edited from the ⚙ button.

## Develop & deploy
```bash
npm install
npm run start     # local dev server
npm run build
npm run deploy    # deploys to the environment in app.config.json
```
