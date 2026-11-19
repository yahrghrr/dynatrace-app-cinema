import React, { useMemo } from "react";
import { rng } from "../data/demo";
import { brand } from "../theme";
import { Legend } from "./ui";

type SeatState = "sold" | "held" | "free" | "premium-sold" | "premium-free";

/**
 * A stylised hall seat map: curved screen, aisles, premium recliner rows at the back.
 * "Held" seats are guests mid-checkout — the revenue that a slow seat map or payment flow can lose.
 */
export function SeatMap({
  occupancy,
  held = 0.06,
  seed = 1,
  rows = 11,
  cols = 20,
  accent = brand.red,
}: {
  occupancy: number;
  held?: number;
  seed?: number;
  rows?: number;
  cols?: number;
  accent?: string;
}) {
  const seats = useMemo(() => {
    const r = rng(seed);
    const premiumRows = 2;
    return Array.from({ length: rows }, (_, row) =>
      Array.from({ length: cols }, (_, col): SeatState => {
        const premium = row >= rows - premiumRows;
        // Demand is highest in the centre and middle-back rows.
        const centre = 1 - Math.abs(col - (cols - 1) / 2) / (cols / 2);
        const depth = 1 - Math.abs(row - rows * 0.6) / rows;
        const p = Math.min(0.98, occupancy * (0.55 + centre * 0.6 + depth * 0.35));
        const x = r();
        if (x < p) return premium ? "premium-sold" : "sold";
        if (x < p + held) return "held";
        return premium ? "premium-free" : "free";
      }),
    );
  }, [occupancy, held, seed, rows, cols]);

  const size = 14;
  const gap = 4;
  const aisleAfter = new Set([4, cols - 5]);
  const width = cols * (size + gap) + aisleAfter.size * 10;
  const height = rows * (size + gap) + 46;
  const counts = seats.flat().reduce<Record<string, number>>((m, s) => ((m[s] = (m[s] ?? 0) + 1), m), {});

  const fill = (s: SeatState) =>
    s === "sold" || s === "premium-sold" ? accent : s === "held" ? brand.info : "rgba(255,255,255,0.08)";
  // Recliner rows are marked by a gold outline, whether sold or free.
  const stroke = (s: SeatState) => (s === "premium-free" ? `${brand.gold}AA` : s === "premium-sold" ? "#FFFFFF" : "transparent");

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxWidth: 560, display: "block", margin: "0 auto" }}>
          <defs>
            <linearGradient id="screen-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M ${width * 0.08} 16 Q ${width / 2} 0 ${width * 0.92} 16`} stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" />
          <path d={`M ${width * 0.08} 16 Q ${width / 2} 0 ${width * 0.92} 16 L ${width * 0.98} 40 Q ${width / 2} 26 ${width * 0.02} 40 Z`} fill="url(#screen-glow)" opacity={0.25} />
          <text x={width / 2} y={30} textAnchor="middle" fontSize={8} fill={brand.faint} letterSpacing="3">
            SCREEN
          </text>
          {seats.map((row, ri) =>
            row.map((s, ci) => {
              const aisles = [...aisleAfter].filter((a) => ci > a).length;
              const x = ci * (size + gap) + aisles * 10;
              const y = 42 + ri * (size + gap);
              return (
                <g key={`${ri}-${ci}`}>
                  <rect x={x} y={y} width={size} height={size - 3} rx={3} fill={fill(s)} stroke={stroke(s)} strokeWidth={1} />
                  <rect x={x + 2} y={y + size - 3} width={size - 4} height={2} rx={1} fill={fill(s)} opacity={0.7} />
                </g>
              );
            }),
          )}
        </svg>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, flexWrap: "wrap", gap: 10 }}>
        <Legend
          items={[
            { label: `Sold (${(counts.sold ?? 0) + (counts["premium-sold"] ?? 0)})`, color: accent },
            { label: `Recliner row (outlined)`, color: brand.gold, dashed: true },
            { label: `In checkout now (${counts.held ?? 0})`, color: brand.info },
            { label: `Available (${(counts.free ?? 0) + (counts["premium-free"] ?? 0)})`, color: "rgba(255,255,255,0.15)" },
          ]}
        />
      </div>
    </div>
  );
}
