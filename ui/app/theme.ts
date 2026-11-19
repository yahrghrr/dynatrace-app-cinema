/**
 * Brand palette for the Box Office Command app.
 * Cinema-red + midnight black with a warm "popcorn" gold for concessions.
 */
export const brand = {
  red: "#E4002B",
  redDeep: "#A3001F",
  redGlow: "rgba(228, 0, 43, 0.35)",
  gold: "#F5B700",
  goldSoft: "rgba(245, 183, 0, 0.16)",
  ink: "#0A0A0E",
  stage: "#111118",
  card: "#17171F",
  cardRaised: "#1E1E28",
  line: "rgba(255,255,255,0.08)",
  text: "#F5F5F7",
  muted: "#A0A0B4",
  faint: "#6B6B80",
  ok: "#2FD67B",
  warn: "#FFB020",
  crit: "#FF5A5F",
  info: "#62B6FF",
};

export const fontStack =
  "'Inter', 'Segoe UI', system-ui, -apple-system, Roboto, 'Helvetica Neue', Arial, sans-serif";

/** Global styles injected once at the root. Scoped under .boc so Strato chrome stays untouched. */
export const globalCss = `
.boc { background: radial-gradient(1200px 500px at 10% -10%, rgba(228,0,43,0.18), transparent 60%),
       radial-gradient(900px 500px at 110% 10%, rgba(245,183,0,0.08), transparent 60%), ${brand.ink};
  color: ${brand.text}; font-family: ${fontStack}; min-height: 100%; padding: 20px 24px 48px; box-sizing: border-box; }
.boc *, .boc *::before, .boc *::after { box-sizing: border-box; }
.boc h1, .boc h2, .boc h3, .boc h4 { margin: 0; color: ${brand.text}; letter-spacing: -0.01em; }
.boc p { margin: 0; }
.boc .card { background: linear-gradient(180deg, ${brand.cardRaised}, ${brand.card}); border: 1px solid ${brand.line};
  border-radius: 16px; padding: 18px 20px; position: relative; overflow: hidden; }
.boc .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 0.14em; color: ${brand.muted}; font-weight: 600; }
.boc .muted { color: ${brand.muted}; }
.boc .faint { color: ${brand.faint}; }
.boc .num { font-variant-numeric: tabular-nums; }
.boc .grid { display: grid; gap: 16px; }
.boc .kpis { grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); }
.boc .two { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
.boc .halves { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.boc .thirds { grid-template-columns: repeat(3, minmax(0, 1fr)); }
@media (max-width: 1100px) { .boc .two, .boc .halves, .boc .thirds { grid-template-columns: minmax(0, 1fr); } }
.boc .pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; }
.boc .tag-live { background: rgba(47,214,123,0.14); color: ${brand.ok}; }
.boc .tag-modelled { background: rgba(98,182,255,0.14); color: ${brand.info}; }
.boc .tag-demo { background: ${brand.goldSoft}; color: ${brand.gold}; }
.boc .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; flex: none; }
.boc .pulse { animation: boc-pulse 1.6s ease-in-out infinite; }
@keyframes boc-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(47,214,123,0.6);} 50% { box-shadow: 0 0 0 6px rgba(47,214,123,0);} }
.boc table.boc-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.boc table.boc-table th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: ${brand.faint};
  font-weight: 600; padding: 8px 10px; border-bottom: 1px solid ${brand.line}; }
.boc table.boc-table td { padding: 10px; border-bottom: 1px solid ${brand.line}; }
.boc table.boc-table tr:last-child td { border-bottom: none; }
.boc table.boc-table td.r, .boc table.boc-table th.r { text-align: right; }
.boc .bar-track { height: 8px; border-radius: 999px; background: rgba(255,255,255,0.06); overflow: hidden; }
.boc .bar-fill { height: 100%; border-radius: 999px; }
.boc .section-title { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.boc .section-title h3 { font-size: 16px; font-weight: 700; }
.boc .insight { border-left: 3px solid ${brand.gold}; background: rgba(245,183,0,0.06); padding: 10px 14px; border-radius: 0 10px 10px 0;
  font-size: 13px; line-height: 1.5; color: ${brand.text}; }
.boc .insight.red { border-left-color: ${brand.red}; background: rgba(228,0,43,0.08); }
.boc .scroll-x { overflow-x: auto; }
.boc svg text { font-family: ${fontStack}; }
`;
