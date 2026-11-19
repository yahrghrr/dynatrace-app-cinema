import React from "react";
import { IconBadge, categoryIcon, channelIcon } from "../components/icons";
import { AiIcon, MoneyIcon, ServicesIcon, WarningIcon } from "@dynatrace/strato-icons";
import { FilmIcon, PopcornIcon, ShieldCheckIcon, TicketIcon, TrendUpIcon } from "../components/icons";
import { Link } from "react-router-dom";
import { useCinema } from "../data/CinemaData";
import { brand } from "../theme";
import { StatusStrip } from "../components/StatusStrip";
import { Kpi, Legend, Section, healthColor } from "../components/ui";
import { Donut, RevenueByHourChart } from "../components/charts";
import { daysUntil, duration, hm, n, pct, rm, signedPct } from "../components/format";
import { FilmPoster } from "../components/FilmPoster";
import { DrillLink, drill } from "../components/Drill";

export const Overview = () => {
  const { model } = useCinema();
  const { kpis, sources } = model;
  const active = model.incidents.filter((i) => i.status === "ACTIVE");
  const fnbRevShare = kpis.fnbRevenue / (kpis.grossRevenue || 1);
  const fnbProfitShare = kpis.fnbProfit / (kpis.grossProfit || 1);
  const projected = model.hourly.reduce((s, h) => s + h.ticket + h.fnb, 0);
  const doomsday = model.films.find((f) => f.id === "doomsday");
  const days = doomsday ? daysUntil(doomsday.release, model.asOf) : 0;
  const capacityGap = model.readiness.expectedPeakTpm - model.readiness.testedCapacityTpm;

  return (
    <div>
      <StatusStrip kicker="Today · Malaysia" title="Executive Overview" icon={<TrendUpIcon size={26} />} />

      {/* ---------- Hero ---------- */}
      <div className="grid two" style={{ marginBottom: 16 }}>
        <div
          className="card"
          style={{
            padding: 26,
            background: `linear-gradient(120deg, rgba(228,0,43,0.22), rgba(23,23,31,0.9) 55%), ${brand.card}`,
          }}
        >
          <div className="eyebrow">The story so far today</div>
          <h2 style={{ fontSize: 26, lineHeight: 1.25, marginTop: 10, fontWeight: 800, maxWidth: 760 }}>
            {rm(kpis.grossRevenue)} gross revenue,{" "}
            <span style={{ color: kpis.vsLastWeek >= 0 ? brand.ok : brand.crit }}>
              {signedPct(kpis.vsLastWeek)} vs last week
            </span>
            . Tracking to <span style={{ color: brand.gold }}>{rm(projected)}</span> by close.
          </h2>
          <div style={{ display: "grid", gap: 10, marginTop: 18, maxWidth: 820 }}>
            <div className="insight">
              <b>Popcorn pays the bills.</b> Food &amp; beverage is {pct(fnbRevShare, 0)} of revenue but{" "}
              <b>{pct(fnbProfitShare, 0)} of gross profit</b>. Every digital hiccup in mobile pre-order or kiosks hits the
              highest-margin line first.
            </div>
            <div className={`insight ${active.length ? "red" : ""}`}>
              {active.length ? (
                <>
                  <b>{active.length} active digital incident{active.length > 1 ? "s" : ""}</b> putting{" "}
                  <b>{rm(kpis.revenueAtRisk)}</b> of revenue at risk today. Highest impact:{" "}
                  <i>{[...active].sort((a, b) => b.revenueAtRisk - a.revenueAtRisk)[0].title}</i>.
                </>
              ) : (
                <>
                  <b>No active digital incidents.</b> {rm(kpis.revenueAtRisk)} revenue was at risk earlier today, now
                  resolved.
                </>
              )}
            </div>
          </div>
        </div>

        {doomsday && (
          <Link to="/blockbusters" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="card" style={{ padding: 0, height: "100%" }}>
              <FilmPoster film={doomsday} height={150} />
              <div style={{ padding: "14px 18px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div className="eyebrow">Opening-night countdown</div>
                  <span className="faint" style={{ fontSize: 12 }}>
                    18 Dec 2026
                  </span>
                </div>
                <div style={{ display: "flex", gap: 22, marginTop: 8, alignItems: "baseline" }}>
                  <div>
                    <span className="num" style={{ fontSize: 40, fontWeight: 900, color: brand.red }}>
                      {days}
                    </span>{" "}
                    <span className="muted">days</span>
                  </div>
                  <div>
                    <div className="num" style={{ fontSize: 20, fontWeight: 800 }}>
                      {n(doomsday.presales)}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      tickets pre-sold
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, marginTop: 10, color: capacityGap > 0 ? brand.crit : brand.ok }}>
                  {capacityGap > 0
                    ? `⚠ Booking capacity gap: expected peak is ${pct(model.readiness.expectedPeakTpm / model.readiness.testedCapacityTpm - 1, 0)} above tested load`
                    : "✓ Booking platform tested above expected peak"}
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* ---------- KPIs ---------- */}
      <div className="grid kpis" style={{ marginBottom: 16 }}>
        <Kpi
          icon={<MoneyIcon />} spark={model.hourly.filter((h) => !h.forecast).map((h) => h.ticket + h.fnb)}
          label="Gross revenue"
          value={rm(kpis.grossRevenue)}
          delta={{ text: `${signedPct(kpis.vsLastWeek)} WoW`, good: kpis.vsLastWeek >= 0 }}
        />
        <Kpi
          icon={<TrendUpIcon />}
          label="Est. gross profit"
          value={rm(kpis.grossProfit)}
          sub={`${pct(kpis.grossProfit / (kpis.grossRevenue || 1), 0)} blended margin`}
          accent={brand.ok}
        />
        <Kpi icon={<TicketIcon />} label="Admissions" value={n(kpis.admissions)} sub={`${pct(kpis.occupancy, 0)} occupancy`} accent={brand.info} />
        <Kpi
          icon={<PopcornIcon />}
          label="F&B spend per head"
          value={rm(kpis.spendPerHead, { compact: false, decimals: 2 })}
          sub={`${pct(kpis.attachRate, 0)} attach rate`}
          accent={brand.gold}
        />
        <Kpi
          icon={<WarningIcon />}
          label="Revenue at risk"
          value={rm(kpis.revenueAtRisk)}
          sub={`${active.length} active incident${active.length === 1 ? "" : "s"}`}
          accent={brand.crit}
          hint="Revenue exposed to digital incidents today: duration × revenue per minute × impact of incident type"
        />
        <Kpi
          icon={<ShieldCheckIcon />}
          label="Digital success rate"
          value={pct(kpis.bookingSuccess, 2)}
          sub="booking, payment & ordering"
          accent={kpis.bookingSuccess > 0.99 ? brand.ok : brand.warn}
        />
      </div>

      {/* ---------- Revenue chart + mix ---------- */}
      <div className="grid two" style={{ marginBottom: 16 }}>
        <Section
          icon={<TrendUpIcon />}
          iconColor={brand.red}
          title="Revenue by hour"
          subtitle="Tickets and F&B stacked, against the same day last week. Hatched bars are forecast."
          source={sources.revenue}
        >
          <RevenueByHourChart data={model.hourly} />
          <div style={{ marginTop: 10 }}>
            <Legend
              items={[
                { label: "Tickets", color: brand.red },
                { label: "Food & beverage", color: brand.gold },
                { label: "Same day last week", color: "rgba(255,255,255,0.65)", dashed: true },
                { label: "Forecast", color: "rgba(255,255,255,0.25)" },
              ]}
            />
          </div>
        </Section>

        <Section icon={<MoneyIcon />} iconColor={brand.gold} title="Revenue vs profit mix" subtitle="Where the money is actually made" source={sources.revenue}>
          <div style={{ display: "flex", gap: 18, alignItems: "center", justifyContent: "space-around", flexWrap: "wrap" }}>
            <MixDonut
              label="Revenue"
              ticket={kpis.ticketRevenue}
              fnb={kpis.fnbRevenue}
            />
            <MixDonut
              label="Gross profit"
              ticket={kpis.ticketProfit}
              fnb={kpis.fnbProfit}
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <Legend
              items={[
                { label: "Tickets", color: brand.red },
                { label: "Food & beverage", color: brand.gold },
              ]}
            />
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
            Ticket revenue is shared with distributors; concessions keep most of every ringgit. Raising spend-per-head by{" "}
            <b style={{ color: brand.text }}>RM 1</b> is worth{" "}
            <b style={{ color: brand.gold }}>{rm(kpis.admissions * 1 * 365 * (projected / (kpis.grossRevenue || 1)))}</b> a
            year at today's run-rate.
          </p>
        </Section>
      </div>

      {/* ---------- Channels + impact ---------- */}
      <div className="grid halves" style={{ marginBottom: 16 }}>
        <Section
          icon={<ServicesIcon />}
          iconColor={brand.info}
          title="Digital channel health"
          subtitle="The guest journey from browse to popcorn"
          source={sources.tech}
          right={
            <Link to="/channels" style={{ color: brand.muted, fontSize: 12 }}>
              Details →
            </Link>
          }
        >
          <div style={{ display: "grid", gap: 2 }}>
            {model.channels.map((c) => (
              <div
                key={c.id + c.backedBy}
                style={{
                  display: "grid",
                  gridTemplateColumns: "34px minmax(0,1.6fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 4px",
                  borderBottom: `1px solid ${brand.line}`,
                  fontSize: 13,
                }}
              >
                <IconBadge icon={channelIcon(c.id, 16)} color={healthColor(c.health)} size={30} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                  <div className="faint" style={{ fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.backedBy} · <DrillLink target={drill.service(c.entityId)} label="Service" compact />
                  </div>
                </div>
                <div className="num" style={{ textAlign: "right", color: healthColor(c.successRate > 0.99 ? "healthy" : c.successRate > 0.97 ? "degraded" : "critical") }}>
                  {pct(c.successRate, 2)}
                </div>
                <div className="num muted" style={{ textAlign: "right" }}>
                  {c.responseMs >= 1000 ? `${(c.responseMs / 1000).toFixed(2)} s` : `${Math.round(c.responseMs)} ms`}
                </div>
                <div className="num" style={{ textAlign: "right" }}>
                  {rm(c.revenuePerHour)}/h
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={<AiIcon />} iconColor={brand.crit} title="Business impact feed" subtitle="Incidents translated into ringgit" source={sources.tech}>
          {model.incidents.length === 0 && <p className="muted">No problems detected in the last 24 hours. 🎬</p>}
          <div style={{ display: "grid", gap: 10 }}>
            {model.incidents.slice(0, 5).map((i) => (
              <div
                key={i.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1fr) auto",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: i.status === "ACTIVE" ? "rgba(255,90,95,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${i.status === "ACTIVE" ? "rgba(255,90,95,0.3)" : brand.line}`,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <IconBadge icon={categoryIcon(i.category, 14)} color={i.status === "ACTIVE" ? brand.crit : brand.faint} size={26} />
                    <span
                      className="pill"
                      style={{
                        background: i.status === "ACTIVE" ? brand.crit : "rgba(255,255,255,0.08)",
                        color: i.status === "ACTIVE" ? "#fff" : brand.muted,
                        padding: "2px 8px",
                      }}
                    >
                      {i.status === "ACTIVE" ? "Active" : "Resolved"}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {i.title}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    {i.channel} · {hm(i.start)} · {duration(i.durationMin)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="num" style={{ fontWeight: 800, color: i.revenueAtRisk > 1000 ? brand.crit : brand.text }}>
                    {rm(i.revenueAtRisk)}
                  </div>
                  <div className="faint" style={{ fontSize: 11 }}>
                    at risk
                  </div>
                  <DrillLink target={drill.problem(i.eventId)} label="Root cause" compact />
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ---------- Slate strip ---------- */}
      <Section
        icon={<FilmIcon />}
          iconColor={brand.red}
          title="This season's slate"
        subtitle="Kaiju now, Avengers next — the year-end blockbuster run"
        source={sources.merchandising}
        right={
          <Link to="/blockbusters" style={{ color: brand.muted, fontSize: 12 }}>
            Blockbuster Watch →
          </Link>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          {model.films.map((f) => (
            <div key={f.id}>
              <FilmPoster film={f} height={120} compact />
              <div style={{ fontSize: 12, marginTop: 8 }} className="muted">
                {f.status === "Pre-sales" ? (
                  <>
                    <b style={{ color: brand.text }}>{n(f.presales)}</b> pre-sold · opens in {daysUntil(f.release, model.asOf)}d
                  </>
                ) : (
                  <>
                    <b style={{ color: brand.text }}>{rm(f.gross + f.fnbRevenue)}</b> today · {pct(f.occupancy, 0)} full
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

function MixDonut({ label, ticket, fnb }: { label: string; ticket: number; fnb: number }) {
  const total = ticket + fnb;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <Donut
        size={150}
        thickness={18}
        items={[
          { label: "Tickets", value: ticket, color: brand.red },
          { label: "F&B", value: fnb, color: brand.gold },
        ]}
        center={
          <>
            <div className="num" style={{ fontSize: 22, fontWeight: 800, color: brand.gold }}>
              {pct(fnb / (total || 1), 0)}
            </div>
            <div className="faint" style={{ fontSize: 11 }}>
              F&amp;B
            </div>
          </>
        }
      />
      <div className="eyebrow">{label}</div>
      <div className="num muted" style={{ fontSize: 12 }}>
        {rm(total)}
      </div>
    </div>
  );
}
