export function rm(v: number, opts: { compact?: boolean; decimals?: number } = {}) {
  const { compact = true, decimals } = opts;
  if (compact) {
    const abs = Math.abs(v);
    if (abs >= 1e6) return `RM ${(v / 1e6).toFixed(decimals ?? 2)}M`;
    if (abs >= 1e3) return `RM ${(v / 1e3).toFixed(decimals ?? 1)}K`;
  }
  return `RM ${v.toLocaleString("en-MY", { maximumFractionDigits: decimals ?? 0, minimumFractionDigits: decimals ?? 0 })}`;
}

export function n(v: number, compact = true) {
  if (compact) {
    const abs = Math.abs(v);
    if (abs >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (abs >= 1e4) return `${(v / 1e3).toFixed(1)}K`;
  }
  return Math.round(v).toLocaleString("en-MY");
}

export function pct(v: number, decimals = 1) {
  return `${(v * 100).toFixed(decimals)}%`;
}

export function signedPct(v: number, decimals = 1) {
  const s = (v * 100).toFixed(decimals);
  return `${v >= 0 ? "+" : ""}${s}%`;
}

export function hm(ts: number) {
  return new Date(ts).toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kuala_Lumpur",
  });
}

export function duration(min: number) {
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  return `${h}h ${Math.round(min - h * 60)}m`;
}

export function daysUntil(isoDate: string, now: number) {
  // Release dates are Malaysian calendar days.
  const target = new Date(`${isoDate}T00:00:00+08:00`).getTime();
  return Math.ceil((target - now) / 86400000);
}
