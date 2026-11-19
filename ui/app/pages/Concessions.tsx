import React, { useState } from "react";
import { IconBadge, fnbIcon } from "../components/icons";
import { GroupIcon, LocationMarkerIcon, MobileIcon, MoneyIcon } from "@dynatrace/strato-icons";
import { CardIcon, GaugeIcon, PopcornIcon, StarIcon, TrendUpIcon } from "../components/icons";
import { useCinema } from "../data/CinemaData";
import { brand } from "../theme";
import { StatusStrip } from "../components/StatusStrip";
import { Bar, Kpi, Section } from "../components/ui";
import { Donut } from "../components/charts";
import { n, pct, rm } from "../components/format";

export const Concessions = () => {
  const { model, assumptions } = useCinema();
  const { kpis, sources } = model;
  const [uplift, setUplift] = useState(1.5);
  const [attachLift, setAttachLift] = useState(5);

  const projectedDay = model.hourly.reduce((s, h) => s + h.ticket + h.fnb, 0);
  const dailyAdmissions = projectedDay / (assumptions.avgTicketPrice + assumptions.fnbSpendPerHead);
  const preorder = model.fnbOrderChannels.find((c) => c.label.startsWith("Mobile"))?.share ?? 0;
  const collectors = model.fnbItems.filter((i) => i.category === "Collectibles").reduce((s, i) => s + i.units, 0);

  // Scenario: SPH uplift on attached guests + more guests attaching.
  const newAttach = Math.min(0.95, assumptions.fnbAttachRate + attachLift / 100);
  const sphPerBuyer = assumptions.fnbSpendPerHead / assumptions.fnbAttachRate;
  const baseDailyFnb = dailyAdmissions * assumptions.fnbSpendPerHead;
  const newDailyFnb = dailyAdmissions * (newAttach * sphPerBuyer + uplift);
  const annualRevenue = (newDailyFnb - baseDailyFnb) * 365;
  const annualProfit = annualRevenue * assumptions.fnbMargin;

  const maxItemRev = Math.max(...model.fnbItems.map((i) => i.revenue), 1);
  const sites = [...model.sites].sort((a, b) => b.sph - a.sph);
  const maxSph = Math.max(...sites.map((s) => s.sph), 1);

  return (
    <div>
      <StatusStrip kicker="Concessions · the margin engine" title="Food & Beverage" icon={<PopcornIcon size={26} />} />

      <div className="grid kpis" style={{ marginBottom: 16 }}>
        <Kpi icon={<PopcornIcon />} spark={model.hourly.filter((h) => !h.forecast).map((h) => h.fnb)} label="F&B revenue today" value={rm(kpis.fnbRevenue)} accent={brand.gold} sub={`${pct(kpis.fnbRevenue / (kpis.grossRevenue || 1), 0)} of gross`} />
        <Kpi icon={<TrendUpIcon />} label="F&B gross profit" value={rm(kpis.fnbProfit)} accent={brand.ok} sub={`${pct(kpis.fnbProfit / (kpis.grossProfit || 1), 0)} of total profit`} />
        <Kpi icon={<MoneyIcon />} label="Spend per head" value={rm(kpis.spendPerHead, { compact: false, decimals: 2 })} accent={brand.gold} />
        <Kpi icon={<GroupIcon />} label="Attach rate" value={pct(kpis.attachRate, 0)} sub="guests buying any F&B" accent={brand.info} />
        <Kpi icon={<MobileIcon />} label="Mobile pre-order share" value={pct(preorder, 0)} sub="skips the queue, bigger baskets" accent={brand.red} />
        <Kpi icon={<StarIcon />} label="Collector buckets sold" value={n(collectors)} sub="today, all titles" accent={brand.gold} />
      </div>

      <div className="grid two" style={{ marginBottom: 16 }}>
        <Section icon={<PopcornIcon />} iconColor={brand.gold} title="What sells" subtitle="Top items by revenue with gross margin" source={sources.merchandising}>
          <div className="scroll-x">
            <table className="boc-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th className="r">Units</th>
                  <th className="r">Revenue</th>
                  <th style={{ width: "22%" }}>Share of F&amp;B</th>
                  <th className="r">Margin</th>
                </tr>
              </thead>
              <tbody>
                {[...model.fnbItems]
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((i) => (
                    <tr key={i.name}>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                          <IconBadge icon={fnbIcon(i.category, 14)} color={i.category === "Collectibles" ? brand.gold : i.category === "Drinks" ? brand.info : brand.red} size={26} />
                          {i.name}
                        </span>
                      </td>
                      <td className="muted">{i.category}</td>
                      <td className="r num">{n(i.units)}</td>
                      <td className="r num">{rm(i.revenue)}</td>
                      <td>
                        <Bar value={i.revenue} max={maxItemRev} color={i.category === "Collectibles" ? brand.gold : brand.red} />
                      </td>
                      <td className="r num" style={{ color: i.margin > 0.75 ? brand.ok : brand.muted }}>
                        {pct(i.margin, 0)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="insight" style={{ marginTop: 14 }}>
            Collector buckets carry lower margin but pull guests to the counter — pair them with high-margin popcorn &amp; drinks
            upsell in the app at checkout.
          </div>
        </Section>

        <Section icon={<GaugeIcon />} iconColor={brand.ok} title="Uplift simulator" subtitle="What a small change in guest behaviour is worth per year" source={sources.revenue === "live" ? "live" : "modelled"}>
          <Slider
            label="Spend-per-head uplift"
            value={uplift}
            min={0}
            max={5}
            step={0.5}
            fmt={(v) => `+RM ${v.toFixed(2)}`}
            onChange={setUplift}
          />
          <Slider
            label="Attach-rate lift"
            value={attachLift}
            min={0}
            max={20}
            step={1}
            fmt={(v) => `+${v} pts`}
            onChange={setAttachLift}
          />
          <div
            style={{
              marginTop: 18,
              padding: 18,
              borderRadius: 14,
              background: `linear-gradient(135deg, rgba(245,183,0,0.18), rgba(228,0,43,0.12))`,
              border: `1px solid rgba(245,183,0,0.35)`,
            }}
          >
            <div className="eyebrow" style={{ color: brand.gold }}>
              Annualised impact
            </div>
            <div className="num" style={{ fontSize: 34, fontWeight: 900, marginTop: 6 }}>
              {rm(annualRevenue)}
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              additional F&amp;B revenue · <b style={{ color: brand.ok }}>{rm(annualProfit)}</b> gross profit
            </div>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
            Levers that move these numbers are digital: in-app combo upsell at seat selection, a fast mobile pre-order
            flow, kiosks that stay online during the pre-show rush. Dynatrace tells you when any of them are failing guests.
          </p>
        </Section>
      </div>

      <div className="grid two" style={{ marginBottom: 16 }}>
        <Section icon={<LocationMarkerIcon />} iconColor={brand.red} title="Site league table" subtitle="Spend-per-head by cinema, with kiosk availability" source={sources.merchandising}>
          <div className="scroll-x">
            <table className="boc-table">
              <thead>
                <tr>
                  <th>Cinema</th>
                  <th>Region</th>
                  <th className="r">Admissions</th>
                  <th style={{ width: "26%" }}>Spend per head</th>
                  <th className="r">Occupancy</th>
                  <th className="r">Kiosks</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((s) => (
                  <tr key={s.name}>
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <LocationMarkerIcon size={16} style={{ color: brand.red }} />
                        {s.name}
                      </span>
                    </td>
                    <td className="muted">{s.region}</td>
                    <td className="r num">{n(s.admissions)}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <Bar value={s.sph} max={maxSph} color={brand.gold} />
                        </div>
                        <span className="num" style={{ fontSize: 12, width: 72, textAlign: "right", whiteSpace: "nowrap" }}>
                          RM {s.sph.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="r num">{pct(s.occupancy, 0)}</td>
                    <td className="r num" style={{ color: s.kiosksOnline < s.kiosksTotal ? brand.crit : brand.muted }}>
                      {s.kiosksOnline}/{s.kiosksTotal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section icon={<CardIcon />} iconColor={brand.info} title="How guests order & pay" subtitle="F&B ordering channel and payment method mix" source={sources.merchandising}>
          <div style={{ display: "grid", gap: 20 }}>
            <MixRow title="F&B ordering channel" items={model.fnbOrderChannels} />
            <MixRow title="Payment method" items={model.paymentMix} />
          </div>
        </Section>
      </div>
    </div>
  );
};

function MixRow({ title, items }: { title: string; items: { label: string; share: number; color: string }[] }) {
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
      <Donut size={120} thickness={16} items={items.map((i) => ({ label: i.label, value: i.share, color: i.color }))} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          {title}
        </div>
        {items.map((i) => (
          <div key={i.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span className="dot" style={{ background: i.color }} />
              {i.label}
            </span>
            <span className="num muted">{pct(i.share, 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  fmt,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  fmt: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
        <span>{label}</span>
        <b className="num" style={{ color: brand.gold }}>
          {fmt(value)}
        </b>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: brand.red }}
      />
    </label>
  );
}
