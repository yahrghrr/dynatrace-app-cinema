import React from "react";
import { useCinema } from "../data/CinemaData";
import { brand } from "../theme";
import { hm } from "./format";
import { SourceTag } from "./ui";
import { LayarLockup } from "./Logo";

export function StatusStrip({ title, kicker }: { title: string; kicker: string }) {
  const { model, mode, liveLoading, fellBack, liveError, setMode } = useCinema();
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ marginBottom: 14 }}>
            <LayarLockup height={36} />
          </div>
          <div className="eyebrow" style={{ color: brand.red }}>
            {kicker}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, marginTop: 4 }}>{title}</h1>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", fontSize: 12 }}>
          <span className="muted">
            Revenue <SourceTag source={model.sources.revenue} />
          </span>
          <span className="muted">
            Digital health <SourceTag source={model.sources.tech} />
          </span>
          <span className="faint num">Updated {hm(model.asOf)} MYT</span>
        </div>
      </div>
      <div
        style={{
          marginTop: 12,
          fontSize: 12,
          padding: "8px 12px",
          borderRadius: 10,
          background: fellBack ? "rgba(255,176,32,0.1)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${fellBack ? "rgba(255,176,32,0.35)" : brand.line}`,
          color: fellBack ? brand.warn : brand.muted,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span>
          {mode === "live" && liveLoading
            ? "Connecting to Grail… showing demo data until live results arrive."
            : fellBack
              ? `Live data unavailable${liveError ? ` (${liveError})` : " — no monitored service traffic found"}. Showing demo data so the story still works.`
              : model.sources.note}
        </span>
        {fellBack && (
          <button
            onClick={() => setMode("demo")}
            style={{
              background: "transparent",
              border: `1px solid ${brand.warn}`,
              color: brand.warn,
              borderRadius: 8,
              padding: "3px 10px",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Switch to demo
          </button>
        )}
      </div>
    </div>
  );
}
