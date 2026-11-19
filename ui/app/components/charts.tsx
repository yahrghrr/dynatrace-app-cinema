import React, { useLayoutEffect, useRef, useState } from "react";
import { brand } from "../theme";
import type { HourPoint } from "../data/types";
import { rm } from "./format";

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(600);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0]?.contentRect.width;
      if (cw) setW(cw);
    });
    ro.observe(el);
    setW(el.clientWidth || 600);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/* ------------------------------------------------------------------ */
/* Revenue by hour: stacked tickets + F&B, last-week line, forecast    */
/* ------------------------------------------------------------------ */

export function RevenueByHourChart({ data, height = 280 }: { data: HourPoint[]; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { l: 56, r: 12, t: 12, b: 28 };
  const iw = Math.max(10, width - pad.l - pad.r);
  const ih = height - pad.t - pad.b;
  const max = Math.max(1, ...data.map((d) => Math.max(d.ticket + d.fnb, d.lastWeek))) * 1.1;
  const bw = iw / data.length;
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const linePts = data.map((d, i) => `${pad.l + i * bw + bw / 2},${y(d.lastWeek)}`).join(" ");
  const hd = hover != null ? data[hover] : null;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <svg width={width} height={height} role="img" aria-label="Revenue by hour">
        <defs>
          <linearGradient id="g-ticket" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={brand.red} />
            <stop offset="1" stopColor={brand.redDeep} />
          </linearGradient>
          <linearGradient id="g-fnb" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#FFD24A" />
            <stop offset="1" stopColor={brand.gold} />
          </linearGradient>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="rgba(255,255,255,0.03)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
          </pattern>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={pad.l + iw} y1={y(t)} y2={y(t)} stroke={brand.line} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={brand.faint}>
              {rm(t, { decimals: 0 })}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.l + i * bw + bw * 0.14;
          const w = bw * 0.72;
          const total = d.ticket + d.fnb;
          const hT = (d.ticket / max) * ih;
          const hF = (d.fnb / max) * ih;
          const dim = hover != null && hover !== i ? 0.55 : 1;
          return (
            <g key={d.ts} opacity={dim}>
              {d.forecast ? (
                <rect x={x} y={y(total)} width={w} height={Math.max(0, (total / max) * ih)} rx={3} fill="url(#hatch)" />
              ) : (
                <>
                  <rect x={x} y={pad.t + ih - hT} width={w} height={Math.max(0, hT)} rx={2} fill="url(#g-ticket)" />
                  <rect x={x} y={pad.t + ih - hT - hF} width={w} height={Math.max(0, hF - 1)} rx={2} fill="url(#g-fnb)" />
                </>
              )}
              {i % 2 === 0 && (
                <text x={x + w / 2} y={height - 8} textAnchor="middle" fontSize="11" fill={brand.faint}>
                  {String(i).padStart(2, "0")}
                </text>
              )}
              <rect
                x={pad.l + i * bw}
                y={pad.t}
                width={bw}
                height={ih}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          );
        })}
        <polyline points={linePts} fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth={1.6} strokeDasharray="4 4" />
      </svg>
      {hd && hover != null && (
        <div
          style={{
            position: "absolute",
            left: Math.min(pad.l + hover * bw + bw, width - 200),
            top: 8,
            background: "rgba(10,10,14,0.95)",
            border: `1px solid ${brand.line}`,
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 12,
            pointerEvents: "none",
            minWidth: 180,
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            {String(hover).padStart(2, "0")}:00 MYT {hd.forecast && <span className="faint">· forecast</span>}
          </div>
          <Row c={brand.red} l="Tickets" v={rm(hd.ticket)} />
          <Row c={brand.gold} l="Food & beverage" v={rm(hd.fnb)} />
          <Row c="rgba(255,255,255,0.65)" l="Same hour last week" v={rm(hd.lastWeek)} />
        </div>
      )}
    </div>
  );
}

function Row({ c, l, v }: { c: string; l: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 2 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span className="dot" style={{ background: c }} />
        <span className="muted">{l}</span>
      </span>
      <span className="num" style={{ fontWeight: 600 }}>
        {v}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Donut                                                               */
/* ------------------------------------------------------------------ */

export function Donut({
  items,
  size = 170,
  thickness = 22,
  center,
}: {
  items: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  center?: React.ReactNode;
}) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
        {items.map((i) => {
          const len = (i.value / total) * c;
          const el = (
            <circle
              key={i.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={i.color}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(0, len - 2)} ${c}`}
              strokeDashoffset={-offset}
            >
              <title>{`${i.label}: ${((i.value / total) * 100).toFixed(1)}%`}</title>
            </circle>
          );
          offset += len;
          return el;
        })}
      </svg>
      {center && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          {center}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline                                                           */
/* ------------------------------------------------------------------ */

export function Sparkline({
  values,
  color = brand.red,
  width = 120,
  height = 34,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return <svg width={width} height={height} />;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * width, height - 2 - ((v - min) / span) * (height - 4)]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const id = `sp-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.35" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${width},${height} L0,${height} Z`} fill={`url(#${id})`} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Capacity gauge: current vs tested vs expected                       */
/* ------------------------------------------------------------------ */

export function CapacityGauge({
  current,
  tested,
  expected,
  unit = "/min",
}: {
  current: number;
  tested: number;
  expected: number;
  unit?: string;
}) {
  const max = Math.max(expected, tested, current) * 1.12 || 1;
  const pos = (v: number) => `${(v / max) * 100}%`;
  const gap = expected - tested;
  return (
    <div>
      <div style={{ position: "relative", height: 46, marginTop: 26 }}>
        <div
          style={{
            position: "absolute",
            inset: "14px 0",
            borderRadius: 999,
            background: `linear-gradient(90deg, ${brand.ok}33 0%, ${brand.ok}33 ${pos(tested)}, ${brand.crit}44 ${pos(tested)}, ${brand.crit}66 100%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 14,
            bottom: 14,
            width: pos(current),
            borderRadius: 999,
            background: `linear-gradient(90deg, ${brand.redDeep}, ${brand.red})`,
            boxShadow: `0 0 20px ${brand.redGlow}`,
          }}
        />
        <Marker left={pos(tested)} label={`Tested ${tested.toLocaleString()}${unit}`} color={brand.ok} />
        <Marker left={pos(expected)} label={`Expected peak ${expected.toLocaleString()}${unit}`} color={brand.crit} top />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 16 }} className="muted">
        <span>
          Current peak <b style={{ color: brand.text }}>{current.toLocaleString()}{unit}</b>
        </span>
        <span style={{ color: gap > 0 ? brand.crit : brand.ok, fontWeight: 700 }}>
          {gap > 0 ? `Capacity gap ${gap.toLocaleString()}${unit}` : "Headroom OK"}
        </span>
      </div>
    </div>
  );
}

function Marker({ left, label, color, top }: { left: string; label: string; color: string; top?: boolean }) {
  return (
    <div style={{ position: "absolute", left, top: 0, bottom: 0, width: 0 }}>
      <div style={{ position: "absolute", top: 6, bottom: 6, left: -1, width: 2, background: color }} />
      <div
        style={{
          position: "absolute",
          [top ? "top" : "bottom"]: top ? -22 : -22,
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          fontSize: 11,
          fontWeight: 700,
          color,
        }}
      >
        {label}
      </div>
    </div>
  );
}
