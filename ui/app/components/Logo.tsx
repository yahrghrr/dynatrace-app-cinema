import React from "react";

/**
 * "Layar Cinemas" — a fictional Malaysian cinema brand used for demos.
 * ("layar" = screen in Malay, as in layar perak, the silver screen.)
 * Mark: a curved cinema screen lit by a projector beam.
 */
export function LayarMark({ size = 40, idSuffix = "m" }: { size?: number; idSuffix?: string }) {
  const bg = `layar-bg-${idSuffix}`;
  const beam = `layar-beam-${idSuffix}`;
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" role="img" aria-label="Layar Cinemas">
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF2A4F" />
          <stop offset="1" stopColor="#A3001F" />
        </linearGradient>
        <linearGradient id={beam} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#FFD24A" stopOpacity="0.95" />
          <stop offset="1" stopColor="#F5B700" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="30" fill={`url(#${bg})`} />
      <path d="M64 102 L30 56 L98 56 Z" fill={`url(#${beam})`} />
      <path d="M22 34 Q64 18 106 34 L106 50 Q64 36 22 50 Z" fill="#FFFFFF" />
      <circle cx="64" cy="102" r="7" fill="#FFD24A" />
      <circle cx="64" cy="102" r="3" fill="#A3001F" />
    </svg>
  );
}

export function LayarLockup({ height = 40, tagline = true }: { height?: number; tagline?: boolean }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: height * 0.3 }}>
      <LayarMark size={height} idSuffix={`l${height}`} />
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontSize: height * 0.52, fontWeight: 900, letterSpacing: "0.14em", color: "#FFFFFF" }}>LAYAR</div>
        <div
          style={{
            fontSize: height * 0.22,
            fontWeight: 700,
            letterSpacing: "0.42em",
            color: "#F5B700",
            marginTop: height * 0.08,
          }}
        >
          CINEMAS{tagline && <span style={{ color: "#A0A0B4", letterSpacing: "0.12em", fontWeight: 500 }}> · MALAYSIA</span>}
        </div>
      </div>
    </div>
  );
}
