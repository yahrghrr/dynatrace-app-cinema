import React from "react";
import type { Film } from "../data/types";
import { brand } from "../theme";

/** Typographic "poster" — no copyrighted artwork, just colour, monogram and a projector glow. */
export function FilmPoster({ film, height = 150, compact }: { film: Film; height?: number; compact?: boolean }) {
  return (
    <div
      style={{
        height,
        borderRadius: 12,
        background: film.gradient,
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${brand.line}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(120% 80% at 80% 0%, ${film.accent}55, transparent 55%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -10,
          bottom: -28,
          fontSize: compact ? 90 : 128,
          fontWeight: 900,
          color: film.accent,
          opacity: 0.18,
          letterSpacing: "-0.06em",
          lineHeight: 1,
        }}
      >
        {film.glyph}
      </div>
      <div style={{ position: "absolute", left: 14, right: 14, bottom: 12 }}>
        <div
          style={{
            fontSize: compact ? 14 : 17,
            fontWeight: 800,
            lineHeight: 1.15,
            textShadow: "0 2px 12px rgba(0,0,0,0.6)",
          }}
        >
          {film.title}
        </div>
      </div>
      <span
        className="pill"
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          background: film.status === "Now Showing" ? brand.red : "rgba(0,0,0,0.55)",
          color: film.status === "Now Showing" ? "#fff" : film.accent,
          border: film.status === "Now Showing" ? "none" : `1px solid ${film.accent}66`,
        }}
      >
        {film.status}
      </span>
    </div>
  );
}
