import React, { useState } from "react";
import { Button } from "@dynatrace/strato-components/buttons";
import { useCinema } from "../data/CinemaData";
import { DEFAULT_ASSUMPTIONS, type Assumptions } from "../data/types";
import { brand, globalCss } from "../theme";

const FIELDS: { key: keyof Assumptions; label: string; help: string; step: number; pct?: boolean }[] = [
  { key: "avgTicketPrice", label: "Average ticket price (RM)", help: "Blended across standard, IMAX and premium halls.", step: 0.5 },
  { key: "fnbSpendPerHead", label: "F&B spend per head (RM)", help: "Concession revenue ÷ admissions.", step: 0.1 },
  { key: "fnbAttachRate", label: "F&B attach rate", help: "Share of admissions that buy any F&B.", step: 0.01, pct: true },
  { key: "ticketMargin", label: "Ticket margin retained", help: "After distributor film rental.", step: 0.01, pct: true },
  { key: "fnbMargin", label: "F&B gross margin", help: "Concessions typically run 70–85%.", step: 0.01, pct: true },
  {
    key: "admissionsPerRequest",
    label: "Live mode: admissions per monitored request",
    help: "Scales real service traffic into cinema admissions when no cinema business events exist.",
    step: 0.01,
  },
];

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { assumptions, setAssumptions } = useCinema();
  const [draft, setDraft] = useState<Assumptions>(assumptions);

  return (
    <div
      className="boc"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "flex-end",
        padding: 0,
        minHeight: "auto",
      }}
    >
      <style>{globalCss}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: "100%",
          height: "100%",
          background: brand.stage,
          borderLeft: `1px solid ${brand.line}`,
          padding: 24,
          overflowY: "auto",
        }}
      >
        <div className="eyebrow" style={{ color: brand.red }}>
          Settings
        </div>
        <h2 style={{ fontSize: 22, marginTop: 6 }}>Business assumptions</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
          Used to translate digital transactions into revenue, profit and revenue-at-risk. Tune them with the finance team
          so every number on screen is one they recognise.
        </p>
        <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
          {FIELDS.map((f) => (
            <label key={f.key} style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{f.label}</span>
              <input
                type="number"
                step={f.pct ? 1 : f.step}
                value={f.pct ? Math.round(draft[f.key] * 100) : draft[f.key]}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) setDraft({ ...draft, [f.key]: f.pct ? v / 100 : v });
                }}
                style={{
                  background: brand.card,
                  color: brand.text,
                  border: `1px solid ${brand.line}`,
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 14,
                }}
              />
              <span className="faint" style={{ fontSize: 12 }}>
                {f.pct ? "Percent. " : ""}
                {f.help}
              </span>
            </label>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 24, justifyContent: "space-between" }}>
          <Button variant="default" onClick={() => setDraft(DEFAULT_ASSUMPTIONS)}>
            Reset defaults
          </Button>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="accent"
              color="primary"
              onClick={() => {
                setAssumptions(draft);
                onClose();
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
