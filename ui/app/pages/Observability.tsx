import React, { useState } from "react";
import { useCinema } from "../data/CinemaData";
import { latencyLoss, type ObsModel } from "../data/observability";
import { brand } from "../theme";
import { StatusStrip } from "../components/StatusStrip";
import { Bar, HealthDot, Section, SourceTag, healthColor } from "../components/ui";
import { Sparkline } from "../components/charts";
import { DrillLink, drill } from "../components/Drill";
import { duration, hm, n, pct, rm } from "../components/format";
import type { Health } from "../data/types";

const TABS = [
  { id: "services", label: "Services & SLOs" },
  { id: "infra", label: "Infrastructure & Kubernetes" },
  { id: "logs", label: "Logs" },
  { id: "problems", label: "Problems & MTTR" },
  { id: "rum", label: "User experience" },
  { id: "synthetic", label: "Synthetic" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const ms = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${Math.round(v)} ms`);

export const Observability = () => {
  const { obs, model } = useCinema();
  const [tab, setTab] = useState<TabId>("services");
  const exposed = obs.impact.filter((r) => r.impactUnit === "/h").reduce((s, r) => s + r.impact, 0);
  const top = [...obs.impact].filter((r) => r.impactUnit === "/h").sort((a, b) => b.impact - a.impact)[0];
  const bad = obs.impact.filter((r) => r.status !== "healthy").length;

  return (
    <div>
      <StatusStrip kicker="Observability · aligned to the box office" title="Observability" />

      {/* ---------- Hero ---------- */}
      <div
        className="card"
        style={{
          marginBottom: 16,
          padding: 24,
          background: `linear-gradient(120deg, rgba(98,182,255,0.14), rgba(23,23,31,0.9) 55%), ${brand.card}`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ maxWidth: 820 }}>
            <div className="eyebrow">Business impact map</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginTop: 8, lineHeight: 1.3 }}>
              Observability signals are exposing{" "}
              <span style={{ color: exposed > 0 ? brand.crit : brand.ok }}>{rm(exposed)}/hour</span> of revenue right now.
            </h2>
            <p className="muted" style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
              {bad} of {obs.impact.length} business KPIs have an unhealthy signal behind them.
              {top && top.impact > 0 && (
                <>
                  {" "}
                  Biggest driver: <b style={{ color: brand.text }}>{top.signal}</b> → {top.kpi.toLowerCase()} (
                  {rm(top.impact)}/h).
                </>
              )}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <DrillLink target={drill.problem()} label="Problems" />
            <DrillLink target={drill.service()} label="Services" />
            <DrillLink target={drill.k8s()} label="Kubernetes" />
            <DrillLink target={drill.logs()} label="Logs" />
          </div>
        </div>
      </div>

      <Section title="From business KPI to the signal behind it" subtitle="Each row is a board-level KPI, the telemetry that drives it, and a one-click drilldown into Dynatrace">
        <div className="scroll-x">
          <table className="boc-table">
            <thead>
              <tr>
                <th>Business KPI</th>
                <th>Observability signal</th>
                <th className="r">Now</th>
                <th className="r">Revenue exposure</th>
                <th>Why it matters</th>
                <th>Source</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {obs.impact.map((r) => (
                <tr key={r.kpi}>
                  <td style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                      <HealthDot health={r.status} size={9} />
                      {r.kpi}
                    </span>
                  </td>
                  <td className="muted">{r.signal}</td>
                  <td className="r num" style={{ color: healthColor(r.status), fontWeight: 700, whiteSpace: "nowrap" }}>
                    {r.value}
                  </td>
                  <td className="r num" style={{ fontWeight: 800, whiteSpace: "nowrap", color: r.impact > 0 ? brand.text : brand.faint }}>
                    {r.impactUnit ? (r.impact > 0 ? `${rm(r.impact)}${r.impactUnit}` : "—") : "signal"}
                  </td>
                  <td className="faint" style={{ fontSize: 12, maxWidth: 320 }}>
                    {r.why}
                  </td>
                  <td>
                    <SourceTag source={r.source} />
                  </td>
                  <td className="r">
                    <DrillLink target={r.drill} label={r.drill.label} compact />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ---------- Tabs ---------- */}
      <div style={{ display: "flex", gap: 6, margin: "22px 0 14px", flexWrap: "wrap" }} role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? brand.red : "rgba(255,255,255,0.05)",
              color: tab === t.id ? "#fff" : brand.muted,
              border: `1px solid ${tab === t.id ? brand.red : brand.line}`,
              padding: "8px 14px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "services" && <ServicesTab obs={obs} />}
      {tab === "infra" && <InfraTab obs={obs} />}
      {tab === "logs" && <LogsTab obs={obs} />}
      {tab === "problems" && <ProblemsTab obs={obs} incidents={model.incidents} />}
      {tab === "rum" && <RumTab obs={obs} bookingRevPerHour={model.channels.find((c) => c.name === "Online Booking")?.revenuePerHour ?? 0} />}
      {tab === "synthetic" && <SyntheticTab obs={obs} />}
    </div>
  );
};

/* ------------------------------------------------------------------ */

function ServicesTab({ obs }: { obs: ObsModel }) {
  return (
    <Section
      title="Golden signals & SLOs per guest-journey channel"
      subtitle="Traffic, errors and p95 latency (24h) with a 7-day availability SLO and remaining error budget"
      source={obs.sources.services}
      right={<DrillLink target={drill.slo()} label="SLOs app" />}
    >
      <div className="scroll-x">
        <table className="boc-table">
          <thead>
            <tr>
              <th>Channel / service</th>
              <th className="r">Req / min</th>
              <th className="r">Error rate</th>
              <th className="r">p95</th>
              <th className="r">SLO</th>
              <th className="r">7d avail.</th>
              <th style={{ width: 150 }}>Error budget left</th>
              <th className="r">Revenue / h</th>
              <th className="r">Latency cost / h</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {obs.services.map((s) => {
              const budget = Math.max(-1, Math.min(1, s.budgetRemaining));
              const budgetColor = budget < 0 ? brand.crit : budget < 0.25 ? brand.warn : brand.ok;
              const q = s.id
                ? `timeseries {requests=sum(dt.service.request.count), failures=sum(dt.service.request.failure_count), p95=percentile(dt.service.request.response_time, 95)}, filter:{dt.entity.service=="${s.id}"}`
                : "";
              return (
                <tr key={s.channel + s.name}>
                  <td>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <HealthDot health={s.status} size={8} />
                      <b>{s.channel}</b>
                    </div>
                    <div className="faint" style={{ fontSize: 11, paddingLeft: 16, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.name}>
                      {s.name}
                    </div>
                  </td>
                  <td className="r num">{n(s.throughputPerMin)}</td>
                  <td className="r num" style={{ color: healthColor(s.status) }}>
                    {pct(s.errorRate, 2)}
                  </td>
                  <td className="r num" style={{ color: s.p95Ms > 1000 ? brand.warn : undefined }}>
                    {ms(s.p95Ms)}
                  </td>
                  <td className="r num muted">{pct(s.sloTarget, 1)}</td>
                  <td className="r num" style={{ color: s.availability7d >= s.sloTarget ? brand.ok : brand.crit }}>
                    {pct(s.availability7d, 2)}
                  </td>
                  <td>
                    <Bar value={Math.max(0, budget)} color={budgetColor} />
                    <div className="num" style={{ fontSize: 11, marginTop: 3, color: budgetColor }}>
                      {budget < 0 ? `Exhausted (${pct(budget, 0)})` : `${pct(budget, 0)} left`}
                    </div>
                  </td>
                  <td className="r num">{rm(s.revenuePerHour)}</td>
                  <td className="r num" style={{ color: latencyLoss(s.p95Ms) > 0 ? brand.crit : brand.faint }}>
                    {latencyLoss(s.p95Ms) > 0 ? rm(latencyLoss(s.p95Ms) * s.revenuePerHour) : "—"}
                  </td>
                  <td className="r">
                    <div style={{ display: "grid", gap: 4, justifyItems: "end" }}>
                      <DrillLink target={drill.service(s.id)} label="Service" compact />
                      {q && <DrillLink target={drill.notebook(q)} label="Notebook" compact />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="insight" style={{ marginTop: 14 }}>
        <b>Error budgets set the change-freeze rule for opening night.</b> Channels with less than 25% budget left should
        freeze risky releases until after the Avengers: Doomsday opening weekend; channels with healthy budgets can keep
        shipping.
      </div>
    </Section>
  );
}

function InfraTab({ obs }: { obs: ObsModel }) {
  return (
    <div className="grid halves">
      <Section title="Host saturation" subtitle="CPU (peak, 2h) and memory for the hosts running guest-facing services" source={obs.sources.infra} right={<DrillLink target={drill.host()} label="Infrastructure" />}>
        <div style={{ display: "grid", gap: 10 }}>
          {obs.hosts.map((h) => (
            <div
              key={(h.id ?? "") + h.name}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr) 90px auto",
                gap: 12,
                alignItems: "center",
                padding: "8px 0",
                borderBottom: `1px solid ${brand.line}`,
                fontSize: 13,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <HealthDot health={h.status} size={8} />
                  <b style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={h.name}>
                    {h.name.split(".")[0]}
                  </b>
                </div>
                <div className="faint" style={{ fontSize: 11, paddingLeft: 16 }}>
                  {h.role}
                </div>
              </div>
              <Meter label="CPU" v={h.cpuMax} />
              <Meter label="Mem" v={h.memAvg} />
              <Sparkline values={h.spark} color={healthColor(h.status)} width={90} height={28} />
              <DrillLink target={drill.host(h.id)} label="Host" compact />
            </div>
          ))}
        </div>
        <div className="insight" style={{ marginTop: 14 }}>
          Hosts above 80% are where slowdowns start when pre-sales open. Scale or rebalance them before the 18 December
          opening, not during it.
        </div>
      </Section>

      <Section title="Kubernetes workload health" subtitle="Pods running vs not running, by namespace" source={obs.sources.k8s} right={<DrillLink target={drill.k8s()} label="Kubernetes" />}>
        <table className="boc-table">
          <thead>
            <tr>
              <th>Namespace</th>
              <th>Business role</th>
              <th className="r">Running</th>
              <th className="r">Not running</th>
              <th style={{ width: 120 }}>Capacity</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {obs.namespaces.map((ns) => {
              const cap = ns.running / Math.max(1, ns.running + ns.notRunning);
              return (
                <tr key={ns.cluster + ns.namespace}>
                  <td style={{ fontWeight: 600 }}>{ns.namespace}</td>
                  <td className="muted">{ns.role}</td>
                  <td className="r num">{ns.running}</td>
                  <td className="r num" style={{ color: ns.notRunning ? brand.crit : brand.faint, fontWeight: ns.notRunning ? 800 : 400 }}>
                    {ns.notRunning}
                  </td>
                  <td>
                    <Bar value={cap} color={cap < 0.85 ? brand.crit : cap < 0.95 ? brand.warn : brand.ok} />
                  </td>
                  <td className="r">
                    <DrillLink target={drill.k8s(ns.cluster, ns.namespace)} label="Open" compact />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {obs.workloadIssues.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Unhealthy workloads
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {obs.workloadIssues.map((w) => (
                <div
                  key={w.namespace + w.workload + w.phase}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "rgba(255,90,95,0.08)",
                    border: "1px solid rgba(255,90,95,0.3)",
                    fontSize: 13,
                  }}
                >
                  <div>
                    <b>{w.workload}</b>{" "}
                    <span className="muted">
                      · {w.namespace} · {w.pods} pod{w.pods === 1 ? "" : "s"} {w.phase}
                    </span>
                  </div>
                  <DrillLink target={drill.k8s(w.cluster, w.namespace, w.workload)} label="Workload" compact />
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

function LogsTab({ obs }: { obs: ObsModel }) {
  const max = Math.max(1, ...obs.logTrend.map((x) => x.err));
  const avg = obs.logTrend.reduce((s, x) => s + x.err, 0) / Math.max(1, obs.logTrend.length);
  return (
    <div className="grid two">
      <Section title="Error log volume, last 24 hours" subtitle="Spikes here usually show up minutes before guests see checkout errors" source={obs.sources.logs} right={<DrillLink target={drill.logs(obs.logQuery)} label="Logs app" />}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 180, padding: "0 4px" }}>
          {obs.logTrend.map((x) => (
            <div
              key={x.ts}
              title={`${hm(x.ts)} MYT · ${Math.round(x.err)} errors · ${Math.round(x.warn)} warnings`}
              style={{
                flex: 1,
                height: `${(x.err / max) * 100}%`,
                minHeight: 2,
                borderRadius: "4px 4px 0 0",
                background: x.err > avg * 2 ? `linear-gradient(180deg, ${brand.crit}, ${brand.redDeep})` : "rgba(255,255,255,0.18)",
              }}
            />
          ))}
        </div>
        <div className="faint" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 6 }}>
          <span>{obs.logTrend[0] ? hm(obs.logTrend[0].ts) : ""}</span>
          <span>Red = more than 2× the daily average ({n(avg)} errors/h)</span>
          <span>{obs.logTrend.length ? hm(obs.logTrend[obs.logTrend.length - 1].ts) : ""}</span>
        </div>
      </Section>
      <Section title="Top error sources (2h)" subtitle="Where the noise is coming from, with a sample message" source={obs.sources.logs}>
        <div style={{ display: "grid", gap: 10 }}>
          {obs.logSources.map((l) => {
            const q = `fetch logs\n| filter loglevel == "ERROR" and dt.process.name == "${l.process.replace(/"/g, '\\"')}"\n| sort timestamp desc`;
            return (
              <div key={l.process + (l.namespace ?? "")} style={{ paddingBottom: 10, borderBottom: `1px solid ${brand.line}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 13 }}>
                  <b style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.process}</b>
                  <span className="num" style={{ color: brand.crit, fontWeight: 800 }}>
                    {n(l.count)}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    fontSize: 11,
                    color: brand.muted,
                    marginTop: 4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={l.sample}
                >
                  {l.sample}
                </div>
                <div style={{ marginTop: 4 }}>
                  <DrillLink target={drill.logs(q)} label="View logs" compact />
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function ProblemsTab({ obs, incidents }: { obs: ObsModel; incidents: ReturnType<typeof useCinema>["model"]["incidents"] }) {
  const weeklyCost = obs.mttr.reduce((s, m) => s + m.count * m.costPerIncident, 0);
  return (
    <div className="grid halves">
      <Section title="Mean time to resolve → cost of downtime" subtitle="Closed Davis problems, last 7 days" source={obs.sources.problems} right={<DrillLink target={drill.problem()} label="Problems app" />}>
        <table className="boc-table">
          <thead>
            <tr>
              <th>Problem type</th>
              <th className="r">Count</th>
              <th className="r">MTTR</th>
              <th className="r">Median</th>
              <th className="r">Cost / typical incident</th>
            </tr>
          </thead>
          <tbody>
            {obs.mttr.map((m) => (
              <tr key={m.category}>
                <td style={{ fontWeight: 600, textTransform: "capitalize" }}>{m.category.toLowerCase().replace(/_/g, " ")}</td>
                <td className="r num">{n(m.count)}</td>
                <td className="r num">{duration(m.mttrMin)}</td>
                <td className="r num muted">{duration(m.medianMin)}</td>
                <td className="r num" style={{ fontWeight: 800 }}>
                  {rm(m.costPerIncident)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(47,214,123,0.14), rgba(98,182,255,0.08))",
            border: "1px solid rgba(47,214,123,0.3)",
          }}
        >
          <div className="eyebrow" style={{ color: brand.ok }}>
            If Davis AI root-cause cut MTTR in half
          </div>
          <div className="num" style={{ fontSize: 28, fontWeight: 900, marginTop: 4 }}>
            {rm((weeklyCost / 2) * 52)} / year
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            revenue protected · today the run-rate is {rm(weeklyCost)} per week exposed to problems
          </div>
        </div>
      </Section>

      <Section title="Problems in the last 24 hours" subtitle="Click through to Davis root-cause analysis" source={obs.sources.problems}>
        <div style={{ display: "grid", gap: 8 }}>
          {incidents.slice(0, 8).map((i) => (
            <div
              key={i.id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) auto",
                gap: 10,
                alignItems: "center",
                padding: "10px 12px",
                borderRadius: 10,
                background: i.status === "ACTIVE" ? "rgba(255,90,95,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${i.status === "ACTIVE" ? "rgba(255,90,95,0.3)" : brand.line}`,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.title}</div>
                <div className="faint" style={{ fontSize: 11, marginTop: 2 }}>
                  {i.id} · {i.channel} · {duration(i.durationMin)} · <b style={{ color: brand.text }}>{rm(i.revenueAtRisk)}</b> at risk
                </div>
              </div>
              <DrillLink target={drill.problem(i.eventId)} label="Root cause" compact />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function RumTab({ obs, bookingRevPerHour }: { obs: ObsModel; bookingRevPerHour: number }) {
  const vital = (v: number, good: number, poor: number): Health => (v <= good ? "healthy" : v <= poor ? "degraded" : "critical");
  return (
    <Section
      title="Real user experience — Core Web Vitals & Apdex"
      subtitle="How fast the booking website and apps feel to guests"
      source={obs.sources.rum}
      right={<DrillLink target={drill.vitals()} label="Experience Vitals" />}
    >
      <div className="scroll-x">
        <table className="boc-table">
          <thead>
            <tr>
              <th>Frontend</th>
              <th className="r">Sessions (24h)</th>
              <th className="r">LCP</th>
              <th className="r">INP</th>
              <th className="r">CLS</th>
              <th className="r">Apdex</th>
              <th className="r">Conversion cost / h</th>
            </tr>
          </thead>
          <tbody>
            {obs.vitals.map((v) => {
              const cost = (Math.max(0, v.lcpMs - 2500) / 100) * 0.01 * bookingRevPerHour * (v.sessions / Math.max(1, obs.vitals.reduce((s, x) => s + x.sessions, 0)));
              return (
                <tr key={v.frontend}>
                  <td style={{ fontWeight: 600 }}>{v.frontend}</td>
                  <td className="r num">{n(v.sessions)}</td>
                  <td className="r num" style={{ color: healthColor(vital(v.lcpMs, 2500, 4000)) }}>
                    {(v.lcpMs / 1000).toFixed(2)} s
                  </td>
                  <td className="r num" style={{ color: healthColor(vital(v.inpMs, 200, 500)) }}>
                    {v.inpMs} ms
                  </td>
                  <td className="r num" style={{ color: healthColor(vital(v.cls, 0.1, 0.25)) }}>
                    {v.cls.toFixed(2)}
                  </td>
                  <td className="r num" style={{ color: healthColor(v.apdex >= 0.85 ? "healthy" : v.apdex >= 0.7 ? "degraded" : "critical") }}>
                    {v.apdex.toFixed(2)}
                  </td>
                  <td className="r num" style={{ fontWeight: 800, color: cost > 0 ? brand.crit : brand.faint }}>
                    {cost > 0 ? rm(cost) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="insight" style={{ marginTop: 14 }}>
        {obs.sources.rum === "demo" && (
          <>
            <b>Not yet live in this tenant.</b> Enable Real User Monitoring on the booking website and mobile apps to replace
            these demo figures. {" "}
          </>
        )}
        Thresholds follow Google's Core Web Vitals (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1). The F&amp;B pre-order web flow is
        the slowest, and it is also the highest-margin journey.
      </div>
    </Section>
  );
}

function SyntheticTab({ obs }: { obs: ObsModel }) {
  return (
    <Section
      title="Synthetic monitoring — booking journeys from Malaysian cities"
      subtitle="Scripted 'book a ticket' and 'pre-order popcorn' journeys run every minute, even when no guests are online"
      source={obs.sources.synthetic}
      right={<DrillLink target={drill.synthetic()} label="Synthetic app" />}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {obs.synthetic.map((s) => (
          <div key={s.name + s.location} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${brand.line}`, borderRadius: 12, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="eyebrow">{s.location}</span>
              <HealthDot health={s.status} size={8} />
            </div>
            <div style={{ fontWeight: 700, marginTop: 6, fontSize: 14 }}>{s.name}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 13 }}>
              <span className="num" style={{ color: healthColor(s.status), fontWeight: 800 }}>
                {pct(s.availability, 2)}
              </span>
              <span className="num muted">{ms(s.durationMs)}</span>
            </div>
          </div>
        ))}
      </div>
      {obs.sources.synthetic === "demo" && (
        <div className="insight" style={{ marginTop: 14 }}>
          <b>Not yet live in this tenant.</b> Create browser monitors for the booking and F&amp;B journeys from private
          locations in KL, Penang, JB, Kuching and Kota Kinabalu so outages are caught before guests notice.
        </div>
      )}
    </Section>
  );
}

function Meter({ label, v }: { label: string; v: number }) {
  const c = v >= 92 ? brand.crit : v >= 80 ? brand.warn : brand.ok;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }} className="faint">
        <span>{label}</span>
        <span className="num" style={{ color: c, fontWeight: 700 }}>
          {Math.round(v)}%
        </span>
      </div>
      <Bar value={v} max={100} color={c} />
    </div>
  );
}
