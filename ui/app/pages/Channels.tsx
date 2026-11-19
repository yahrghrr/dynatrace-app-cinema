import React from "react";
import { IconBadge, categoryIcon, channelIcon } from "../components/icons";
import { AiIcon, MobileIcon } from "@dynatrace/strato-icons";
import { TicketIcon } from "../components/icons";
import { useCinema } from "../data/CinemaData";
import { brand } from "../theme";
import { StatusStrip } from "../components/StatusStrip";
import { Section, healthColor } from "../components/ui";
import { Sparkline } from "../components/charts";
import { duration, hm, n, pct, rm } from "../components/format";
import { DrillLink, drill } from "../components/Drill";

export const Channels = () => {
  const { model } = useCinema();
  const { channels, incidents, sources } = model;

  // Guest journey funnel: each step's success compounds.
  const byId = (id: string) => channels.find((c) => c.id === id);
  const steps = [
    { label: "Browse showtimes", rate: 1 },
    { label: "Select seats", rate: byId("seatmap")?.successRate ?? 0.99, slow: (byId("seatmap")?.responseMs ?? 0) > 1000 },
    { label: "Pay", rate: byId("payments")?.successRate ?? 0.99, slow: (byId("payments")?.responseMs ?? 0) > 1000 },
    { label: "Booking confirmed", rate: byId("booking")?.successRate ?? 0.99 },
    { label: "Add F&B pre-order", rate: (byId("fnb")?.successRate ?? 0.97) * model.kpis.attachRate * 0.55 },
  ];
  const baseline = [1, 0.62, 0.81, 0.97, 0.36]; // typical step conversion for cinema booking journeys
  let cum = 1;
  const funnel = steps.map((s, i) => {
    const slowPenalty = s.slow ? 0.94 : 1;
    cum = i === 0 ? 1 : cum * baseline[i] * (i === 4 ? 1 : s.rate) * slowPenalty;
    return { ...s, cum };
  });
  const sessions = model.kpis.admissions / 2.3 / (funnel[3].cum || 1); // ~2.3 tickets per booking

  return (
    <div>
      <StatusStrip kicker="Guest journey · browse to popcorn" title="Digital Channels" icon={<MobileIcon size={26} />} />

      <div className="grid thirds" style={{ marginBottom: 16 }}>
        {channels.map((c) => (
          <div key={c.id + c.backedBy} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <IconBadge icon={channelIcon(c.id, 20)} color={healthColor(c.health)} size={40} solid={c.health !== "healthy"} />
                  <h3 style={{ fontSize: 16 }}>{c.name}</h3>
                </div>
                <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {c.purpose}
                </p>
              </div>
              <span
                className="pill"
                style={{ background: `${healthColor(c.health)}22`, color: healthColor(c.health) }}
              >
                {c.health}
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 16 }}>
              <Metric label="Success" value={pct(c.successRate, 2)} color={c.successRate < 0.97 ? brand.crit : c.successRate < 0.99 ? brand.warn : undefined} />
              <Metric
                label="Response"
                value={c.responseMs >= 1000 ? `${(c.responseMs / 1000).toFixed(2)}s` : `${Math.round(c.responseMs)}ms`}
                color={c.responseMs > 1000 ? brand.warn : undefined}
              />
              <Metric label="Tx / min" value={n(c.txPerMin)} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 14 }}>
              <div>
                <div className="faint" style={{ fontSize: 11 }}>
                  Revenue through channel
                </div>
                <div className="num" style={{ fontWeight: 800, color: brand.gold }}>
                  {rm(c.revenuePerHour)}/h
                </div>
              </div>
              <Sparkline values={c.spark} color={healthColor(c.health)} width={130} />
            </div>
            <div
              className="faint"
              style={{ fontSize: 11, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${brand.line}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              title={c.backedBy}
            >
              Monitored service: <span style={{ color: brand.muted }}>{c.backedBy}</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <DrillLink target={drill.service(c.entityId)} label="Open service in Dynatrace" compact />
            </div>
          </div>
        ))}
      </div>

      <div className="grid two" style={{ marginBottom: 16 }}>
        <Section icon={<AiIcon />} iconColor={brand.crit} title="Problems & revenue at risk" subtitle="Davis-detected problems, last 24 hours, priced in ringgit" source={sources.tech}>
          <div className="scroll-x">
            <table className="boc-table">
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>Channel</th>
                  <th>Type</th>
                  <th>Started</th>
                  <th className="r">Duration</th>
                  <th className="r" style={{ whiteSpace: "nowrap" }}>At risk</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {incidents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="muted">
                      No problems in the last 24 hours.
                    </td>
                  </tr>
                )}
                {incidents.slice(0, 10).map((i) => (
                  <tr key={i.id}>
                    <td>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <IconBadge icon={categoryIcon(i.category, 13)} color={i.status === "ACTIVE" ? brand.crit : brand.faint} size={24} />
                        <span style={{ fontWeight: 600 }}>{i.title}</span>
                      </div>
                      <div className="faint" style={{ fontSize: 11, marginTop: 3, paddingLeft: 16 }}>
                        {i.id} · {i.businessImpact}
                      </div>
                    </td>
                    <td className="muted">{i.channel}</td>
                    <td className="muted" style={{ fontSize: 11 }}>
                      {i.category.replace(/_/g, " ").toLowerCase()}
                    </td>
                    <td className="num muted">{hm(i.start)}</td>
                    <td className="r num" style={{ whiteSpace: "nowrap" }}>{duration(i.durationMin)}</td>
                    <td className="r num" style={{ fontWeight: 800, whiteSpace: "nowrap", color: i.revenueAtRisk > 1000 ? brand.crit : brand.text }}>
                      {rm(i.revenueAtRisk)}
                    </td>
                    <td className="r">
                      <DrillLink target={drill.problem(i.eventId)} label="Davis" compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {incidents.length > 10 && (
            <p className="faint" style={{ fontSize: 12, marginTop: 10 }}>
              + {incidents.length - 10} more problems ({rm(incidents.slice(10).reduce((s, i) => s + i.revenueAtRisk, 0))} at risk)
            </p>
          )}
        </Section>

        <Section icon={<TicketIcon />} iconColor={brand.red} title="Booking journey" subtitle="Share of sessions reaching each step today" source={sources.tech === "live" ? "modelled" : "demo"}>
          <div style={{ display: "grid", gap: 12 }}>
            {funnel.map((s, i) => (
              <div key={s.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span>
                    {s.label}
                    {s.slow && <span style={{ color: brand.warn, fontSize: 11 }}> · slow</span>}
                  </span>
                  <span className="num muted">
                    {n(sessions * s.cum)} · {pct(s.cum, 0)}
                  </span>
                </div>
                <div style={{ height: 22, borderRadius: 6, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${s.cum * 100}%`,
                      height: "100%",
                      background: i === 4 ? `linear-gradient(90deg, ${brand.gold}, #FFD24A)` : `linear-gradient(90deg, ${brand.redDeep}, ${brand.red})`,
                      borderRadius: 6,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="insight" style={{ marginTop: 16 }}>
            Every <b>1%</b> of guests rescued at seat selection or payment is worth about{" "}
            <b>{rm(model.kpis.grossRevenue * 0.01 / (funnel[3].cum || 1))}</b> today. Slow seat maps during pre-sales
            surges are the most common silent revenue leak.
          </div>
        </Section>
      </div>
    </div>
  );
};

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "8px 10px" }}>
      <div className="faint" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </div>
      <div className="num" style={{ fontWeight: 800, fontSize: 15, color: color ?? brand.text }}>
        {value}
      </div>
    </div>
  );
}
