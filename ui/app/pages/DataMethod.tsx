import React from "react";
import { useCinema } from "../data/CinemaData";
import { brand } from "../theme";
import { StatusStrip } from "../components/StatusStrip";
import { Section, SourceTag } from "../components/ui";
import { pct } from "../components/format";

const TICKET_EVENT = `{
  "event.provider": "cinema.booking",
  "event.type": "cinema.ticket.purchase",
  "booking.id": "BK-2026-11-19-88412",
  "site": "Kuala Lumpur City Centre",
  "film.id": "doomsday",
  "format": "IMAX",
  "channel": "mobile-app",
  "payment.method": "e-wallet",
  "quantity": 2,
  "amount": 46.00,
  "currency": "MYR"
}`;

const FNB_EVENT = `{
  "event.provider": "cinema.fnb",
  "event.type": "cinema.fnb.order",
  "order.id": "FB-771203",
  "booking.id": "BK-2026-11-19-88412",
  "site": "Kuala Lumpur City Centre",
  "channel": "mobile-preorder",
  "items": "Doomsday Collector Helm Bucket; Soft drink L",
  "quantity": 2,
  "amount": 67.90,
  "currency": "MYR"
}`;

export const DataMethod = () => {
  const { model, assumptions } = useCinema();
  return (
    <div>
      <StatusStrip kicker="Transparency" title="Data & Method" />

      <div className="grid thirds" style={{ marginBottom: 16 }}>
        <ModeCard
          tag="live"
          title="Live"
          body="Read directly from Grail: service request volume, failure rate and response time; Davis problems; and — if present — cinema business events."
        />
        <ModeCard
          tag="modelled"
          title="Modelled"
          body="Live telemetry multiplied by the business assumptions (ticket price, spend per head, margins). Accurate in shape and timing; scale depends on the assumptions."
        />
        <ModeCard
          tag="demo"
          title="Demo"
          body="A synthetic 11-site Malaysian cinema chain with realistic evening demand curves, film slate and F&B mix. Use it when the tenant has no suitable data."
        />
      </div>

      <div className="grid halves" style={{ marginBottom: 16 }}>
        <Section title="Where each view gets its data" subtitle={`Currently: ${model.mode === "live" ? "Live mode" : "Demo mode"}`}>
          <table className="boc-table">
            <tbody>
              <Row label="Revenue, admissions, F&B" src={model.sources.revenue} />
              <Row label="Digital channel health" src={model.sources.tech} />
              <Row label="Problems & revenue at risk" src={model.sources.tech} />
              <Row label="Film slate, sites, F&B items" src={model.sources.merchandising} />
            </tbody>
          </table>
          <div className="insight" style={{ marginTop: 14 }}>
            In live mode the six busiest monitored services are mapped, in order of volume, onto the six cinema channels
            (booking, seat map, payments, F&amp;B pre-order, loyalty, kiosks). Revenue at risk = problem duration × revenue per
            minute × impact of the problem type (availability 60%, error 30%, slowdown 12%…), reduced to 25% when the problem
            is not on a mapped channel.
          </div>
        </Section>

        <Section title="Current business assumptions" subtitle="Edit with the ⚙ button in the header">
          <table className="boc-table">
            <tbody>
              <tr>
                <td>Average ticket price</td>
                <td className="r num">RM {assumptions.avgTicketPrice.toFixed(2)}</td>
              </tr>
              <tr>
                <td>F&amp;B spend per head</td>
                <td className="r num">RM {assumptions.fnbSpendPerHead.toFixed(2)}</td>
              </tr>
              <tr>
                <td>F&amp;B attach rate</td>
                <td className="r num">{pct(assumptions.fnbAttachRate, 0)}</td>
              </tr>
              <tr>
                <td>Ticket margin after film rental</td>
                <td className="r num">{pct(assumptions.ticketMargin, 0)}</td>
              </tr>
              <tr>
                <td>F&amp;B gross margin</td>
                <td className="r num">{pct(assumptions.fnbMargin, 0)}</td>
              </tr>
              <tr>
                <td>Admissions per monitored request (live)</td>
                <td className="r num">{assumptions.admissionsPerRequest}</td>
              </tr>
            </tbody>
          </table>
        </Section>
      </div>

      <Section
        title="Make revenue exact: send cinema business events"
        subtitle="Send these from the booking and F&B services (OneAgent business-event capture, OpenPipeline or the Business Events API). The app picks them up automatically."
      >
        <div className="grid halves">
          <Code title="cinema.ticket.purchase" body={TICKET_EVENT} />
          <Code title="cinema.fnb.order" body={FNB_EVENT} />
        </div>
      </Section>
    </div>
  );
};

function ModeCard({ tag, title, body }: { tag: "live" | "modelled" | "demo"; title: string; body: string }) {
  return (
    <div className="card">
      <SourceTag source={tag} />
      <h3 style={{ fontSize: 18, marginTop: 10 }}>{title}</h3>
      <p className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
        {body}
      </p>
    </div>
  );
}

function Row({ label, src }: { label: string; src: "live" | "modelled" | "demo" }) {
  return (
    <tr>
      <td>{label}</td>
      <td className="r">
        <SourceTag source={src} />
      </td>
    </tr>
  );
}

function Code({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 8, color: brand.gold }}>
        {title}
      </div>
      <pre
        style={{
          margin: 0,
          background: "#07070A",
          border: `1px solid ${brand.line}`,
          borderRadius: 10,
          padding: 14,
          fontSize: 12,
          color: "#D9D9E3",
          overflowX: "auto",
        }}
      >
        {body}
      </pre>
    </div>
  );
}
