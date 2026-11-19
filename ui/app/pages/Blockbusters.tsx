import React from "react";
import { MoneyIcon } from "@dynatrace/strato-icons";
import { FilmIcon, IconBadge, PopcornIcon, RocketIcon, TicketIcon, TrendUpIcon } from "../components/icons";
import { useCinema } from "../data/CinemaData";
import { brand } from "../theme";
import { StatusStrip } from "../components/StatusStrip";
import { Bar, Section } from "../components/ui";
import { CapacityGauge } from "../components/charts";
import { FilmPoster } from "../components/FilmPoster";
import { daysUntil, n, pct, rm } from "../components/format";

export const Blockbusters = () => {
  const { model, assumptions } = useCinema();
  const { films, readiness, sources } = model;
  const doomsday = films.find((f) => f.id === "doomsday");
  const dune = films.find((f) => f.id === "dune");
  const kaiju = films.find((f) => f.id === "godzilla");

  // Opening-weekend projection for Avengers: Doomsday (pre-sales usually ~35% of opening weekend for event films).
  const owAdmissions = doomsday ? doomsday.presales / 0.35 : 0;
  const owTicket = owAdmissions * assumptions.avgTicketPrice * 1.15; // premium-format skew
  const owFnb = owAdmissions * assumptions.fnbSpendPerHead * 1.25;
  const collectorUplift = doomsday ? doomsday.combo.stock * doomsday.combo.price : 0;
  const capacityGap = readiness.expectedPeakTpm - readiness.testedCapacityTpm;
  const outageCost = ((owTicket + owFnb) / (3 * 14 * 60)) * 0.65; // per-minute revenue × booking share at peak

  return (
    <div>
      <StatusStrip kicker="Year-end season · Kaiju → Avengers" title="Blockbuster Watch" icon={<FilmIcon size={26} />} />

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", marginBottom: 16 }}>
        {films.map((f) => {
          const d = daysUntil(f.release, model.asOf);
          const sell = f.combo.sold / f.combo.stock;
          return (
            <div key={f.id} className="card" style={{ padding: 0 }}>
              <FilmPoster film={f} height={170} />
              <div style={{ padding: 16 }}>
                <p className="muted" style={{ fontSize: 12, minHeight: 32, lineHeight: 1.4 }}>
                  {f.tagline}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                  {f.status === "Pre-sales" ? (
                    <>
                      <Stat label="Pre-sold" value={n(f.presales)} />
                      <Stat label="Opens in" value={`${d} days`} color={d <= 30 ? brand.red : undefined} />
                    </>
                  ) : (
                    <>
                      <Stat label="Today" value={rm(f.gross + f.fnbRevenue)} />
                      <Stat label="Occupancy" value={pct(f.occupancy, 0)} />
                      <Stat label="Admissions" value={n(f.admissions)} />
                      <Stat label="F&B attach" value={pct(f.fnbAttach, 0)} color={brand.gold} />
                    </>
                  )}
                </div>
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: brand.gold, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <PopcornIcon size={15} />
                      {f.combo.name}
                    </span>
                  </div>
                  <Bar value={sell} color={sell > 0.7 ? brand.crit : brand.gold} />
                  <div className="muted num" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 4 }}>
                    <span>
                      {n(f.combo.sold)} / {n(f.combo.stock)} sold
                    </span>
                    <span>RM {f.combo.price}</span>
                  </div>
                  {sell > 0.7 && (
                    <div style={{ fontSize: 11, color: brand.crit, marginTop: 4 }}>Re-order now — sell-out risk this weekend</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid halves" style={{ marginBottom: 16 }}>
        <Section
          icon={<RocketIcon />}
          iconColor={brand.red}
          title="Avengers: Doomsday — opening-night readiness"
          subtitle={`Booking transactions per minute · opens ${readiness.date}`}
          source={sources.tech === "live" ? "modelled" : "demo"}
        >
          <CapacityGauge
            current={readiness.currentPeakTpm}
            tested={readiness.testedCapacityTpm}
            expected={readiness.expectedPeakTpm}
          />
          <div style={{ display: "grid", gap: 8, marginTop: 22 }}>
            {readiness.checklist.map((c) => (
              <div key={c.item} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13 }}>
                <span
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    flex: "none",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    background: c.state === "done" ? "rgba(47,214,123,0.15)" : c.state === "at-risk" ? "rgba(255,176,32,0.15)" : "rgba(255,255,255,0.06)",
                    color: c.state === "done" ? brand.ok : c.state === "at-risk" ? brand.warn : brand.muted,
                  }}
                >
                  {c.state === "done" ? "✓" : c.state === "at-risk" ? "!" : "·"}
                </span>
                <span style={{ color: c.state === "done" ? brand.muted : brand.text }}>{c.item}</span>
              </div>
            ))}
          </div>
          {capacityGap > 0 && (
            <div className="insight red" style={{ marginTop: 16 }}>
              At the expected peak, every minute the booking flow is down costs roughly <b>{rm(outageCost)}</b>. Close the{" "}
              {n(capacityGap)} tx/min capacity gap before pre-sales for opening weekend go fully live.
            </div>
          )}
        </Section>

        <Section
          icon={<TrendUpIcon />}
          iconColor={brand.gold}
          title="Opening-weekend outlook"
          subtitle="Projection from pre-sales pace (pre-sales ≈ 35% of an event film's opening weekend)"
          source={sources.merchandising}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
            <Big label="Admissions" value={n(owAdmissions)} icon={<TicketIcon size={15} />} />
            <Big label="Ticket revenue" value={rm(owTicket)} color={brand.red} icon={<MoneyIcon size={15} />} />
            <Big label="F&B revenue" value={rm(owFnb)} color={brand.gold} icon={<PopcornIcon size={15} />} />
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
            <div className="insight">
              <b>Collector bucket = event in itself.</b> A full sell-through of {doomsday?.combo.name ?? "the collector bucket"}{" "}
              is worth <b>{rm(collectorUplift)}</b> — fans queue for these. Mobile pre-order and kiosks must hold up at
              the midnight drop.
            </div>
            {dune && doomsday && (
              <div className="insight">
                <b>18 December clash.</b> <i>Dune: Part Three</i> opens the same day ({n(dune.presales)} pre-sold, {pct(dune.formats[0].share, 0)} IMAX
                preference). Allocate IMAX screens by live pre-sales pace, not gut feel.
              </div>
            )}
            {kaiju && (
              <div className="insight">
                <b>Kaiju momentum.</b> <i>{kaiju.title}</i> is running at {pct(kaiju.occupancy, 0)} occupancy with a{" "}
                {pct(kaiju.fnbAttach, 0)} F&amp;B attach rate — the best on the slate. Hold premium halls through the school
                holidays.
              </div>
            )}
          </div>
        </Section>
      </div>

      <Section icon={<FilmIcon />} iconColor={brand.info} title="Format preference by title" subtitle="Where to put the big screens" source={sources.merchandising}>
        <div className="scroll-x">
          <table className="boc-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Release</th>
                <th style={{ width: "40%" }}>Format mix</th>
                <th className="r">Shows today</th>
              </tr>
            </thead>
            <tbody>
              {films.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600 }}>{f.title}</td>
                  <td className="muted">{f.status}</td>
                  <td className="muted num">{f.release}</td>
                  <td>
                    <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden" }}>
                      {f.formats.map((fm, i) => (
                        <div
                          key={fm.label}
                          title={`${fm.label} ${pct(fm.share, 0)}`}
                          style={{
                            width: `${fm.share * 100}%`,
                            background: i === 0 ? f.accent : i === 1 ? `${f.accent}88` : "rgba(255,255,255,0.15)",
                          }}
                        />
                      ))}
                    </div>
                    <div className="faint" style={{ fontSize: 11, marginTop: 4 }}>
                      {f.formats.map((fm) => `${fm.label} ${pct(fm.share, 0)}`).join(" · ")}
                    </div>
                  </td>
                  <td className="r num">{f.shows ? n(f.shows) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="faint" style={{ fontSize: 11, marginTop: 10 }}>
          Release dates are indicative and may differ by market. Poster tiles are typographic placeholders.
        </p>
      </Section>
    </div>
  );
};

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="faint" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </div>
      <div className="num" style={{ fontSize: 17, fontWeight: 800, color: color ?? brand.text }}>
        {value}
      </div>
    </div>
  );
}

function Big({ label, value, color, icon }: { label: string; value: string; color?: string; icon?: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${brand.line}`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="eyebrow">{label}</div>
        {icon && <IconBadge icon={icon} color={color ?? brand.info} size={28} />}
      </div>
      <div className="num" style={{ fontSize: 24, fontWeight: 900, marginTop: 6, color: color ?? brand.text }}>
        {value}
      </div>
    </div>
  );
}
