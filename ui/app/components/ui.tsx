import React from "react";
import { brand } from "../theme";
import type { Health, Provenance } from "../data/types";

export function SourceTag({ source }: { source: Provenance }) {
  const label = source === "live" ? "Live" : source === "modelled" ? "Modelled" : "Demo";
  const title =
    source === "live"
      ? "Measured directly from your Dynatrace tenant"
      : source === "modelled"
        ? "Derived from live tenant telemetry × business assumptions"
        : "Synthetic demo data";
  return (
    <span className={`pill tag-${source}`} title={title}>
      <span className={`dot ${source === "live" ? "pulse" : ""}`} style={{ background: "currentColor" }} />
      {label}
    </span>
  );
}

export function healthColor(h: Health) {
  return h === "healthy" ? brand.ok : h === "degraded" ? brand.warn : brand.crit;
}

export function HealthDot({ health, size = 10 }: { health: Health; size?: number }) {
  const c = healthColor(health);
  return (
    <span
      className="dot"
      style={{ width: size, height: size, background: c, boxShadow: `0 0 0 4px ${c}22, 0 0 12px ${c}88` }}
    />
  );
}

export function Section({
  title,
  subtitle,
  source,
  right,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  source?: Provenance;
  right?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="card" style={style}>
      <div className="section-title">
        <div>
          <h3>{title}</h3>
          {subtitle && (
            <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              {subtitle}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {right}
          {source && <SourceTag source={source} />}
        </div>
      </div>
      {children}
    </div>
  );
}

export function Kpi({
  label,
  value,
  sub,
  delta,
  accent = brand.red,
  hint,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  delta?: { text: string; good: boolean };
  accent?: string;
  hint?: string;
}) {
  return (
    <div className="card" style={{ padding: "16px 18px" }} title={hint}>
      <div
        style={{
          position: "absolute",
          inset: "0 auto 0 0",
          width: 3,
          background: `linear-gradient(180deg, ${accent}, transparent)`,
        }}
      />
      <div className="eyebrow">{label}</div>
      <div className="num" style={{ fontSize: 28, fontWeight: 800, marginTop: 8, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, fontSize: 12, flexWrap: "wrap" }}>
        {delta && (
          <span
            className="num"
            style={{ color: delta.good ? brand.ok : brand.crit, fontWeight: 700 }}
          >
            {delta.good ? "▲" : "▼"} {delta.text}
          </span>
        )}
        {sub && <span className="muted">{sub}</span>}
      </div>
    </div>
  );
}

export function Bar({ value, color = brand.red, max = 1 }: { value: number; color?: string; max?: number }) {
  return (
    <div className="bar-track">
      <div
        className="bar-fill"
        style={{ width: `${Math.max(0, Math.min(1, value / max)) * 100}%`, background: color }}
      />
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12 }} className="muted">
      {items.map((i) => (
        <span key={i.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 14,
              height: i.dashed ? 0 : 10,
              borderRadius: 3,
              background: i.dashed ? "transparent" : i.color,
              borderTop: i.dashed ? `2px dashed ${i.color}` : undefined,
            }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}
