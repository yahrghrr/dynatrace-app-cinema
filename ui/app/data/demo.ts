import { brand } from "../theme";
import type {
  Assumptions,
  Channel,
  CinemaModel,
  Film,
  FnbItem,
  HourPoint,
  Incident,
  Kpis,
  Readiness,
  Site,
} from "./types";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Small deterministic PRNG so the demo is stable between reloads but still "breathes". */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MYT_OFFSET_MS = 8 * 3600 * 1000;

/** Hour-of-day (0–23) in Malaysia time. */
export function mytHour(ts: number) {
  return new Date(ts + MYT_OFFSET_MS).getUTCHours();
}

/** Epoch ms for 00:00 Malaysia time of the day containing ts. */
export function mytMidnight(ts: number) {
  const shifted = ts + MYT_OFFSET_MS;
  return shifted - (shifted % 86400000) - MYT_OFFSET_MS;
}

/** Typical cinema demand curve by hour (Malaysia, weekday in school-holiday season). */
export const HOUR_WEIGHTS = [
  0.9, 0.35, 0.08, 0, 0, 0, 0, 0, 0, 0.05, 0.45, 1.3, 2.0, 2.4, 2.5, 2.7, 3.0, 3.5, 4.3, 5.7, 6.3, 5.8, 4.4, 2.4,
];
const WEIGHT_SUM = HOUR_WEIGHTS.reduce((a, b) => a + b, 0);

/* ------------------------------------------------------------------ */
/* Static catalogue                                                    */
/* ------------------------------------------------------------------ */

interface FilmSeed {
  id: string;
  title: string;
  tagline: string;
  status: Film["status"];
  release: string;
  gradient: string;
  accent: string;
  glyph: string;
  share: number; // share of today's admissions
  occupancy: number;
  fnbAttach: number;
  sphMult: number;
  presales: number;
  combo: { name: string; price: number; stock: number; sellThrough: number };
  formats: { label: string; share: number }[];
}

const FILM_SEEDS: FilmSeed[] = [
  {
    id: "godzilla",
    title: "Godzilla Minus Zero",
    tagline: "The King returns. Kaiju-sized weekend.",
    status: "Now Showing",
    release: "2026-11-05",
    gradient: "linear-gradient(140deg, #0E3B2E 0%, #0A1F1A 55%, #031510 100%)",
    accent: "#3CF0B4",
    glyph: "GZ",
    share: 0.36,
    occupancy: 0.71,
    fnbAttach: 0.67,
    sphMult: 1.12,
    presales: 0,
    combo: { name: "Atomic Breath Kaiju Bucket", price: 49, stock: 18000, sellThrough: 0.74 },
    formats: [
      { label: "IMAX", share: 0.28 },
      { label: "Premium recliner", share: 0.17 },
      { label: "Standard", share: 0.55 },
    ],
  },
  {
    id: "hunger-games",
    title: "The Hunger Games: Sunrise on the Reaping",
    tagline: "Opening this week — district-by-district demand.",
    status: "Opening",
    release: "2026-11-20",
    gradient: "linear-gradient(140deg, #4A2A06 0%, #2A1503 55%, #120801 100%)",
    accent: "#FFB347",
    glyph: "HG",
    share: 0.24,
    occupancy: 0.64,
    fnbAttach: 0.58,
    sphMult: 0.96,
    presales: 41200,
    combo: { name: "Tribute Combo + Mockingjay Cup", price: 39, stock: 12000, sellThrough: 0.41 },
    formats: [
      { label: "IMAX", share: 0.18 },
      { label: "Premium recliner", share: 0.2 },
      { label: "Standard", share: 0.62 },
    ],
  },
  {
    id: "jumanji",
    title: "Jumanji 3",
    tagline: "Family slate for the December school holidays.",
    status: "Pre-sales",
    release: "2026-12-11",
    gradient: "linear-gradient(140deg, #1F4A12 0%, #12300A 55%, #071703 100%)",
    accent: "#9BE15D",
    glyph: "J3",
    share: 0.0,
    occupancy: 0,
    fnbAttach: 0.71,
    sphMult: 1.2,
    presales: 18600,
    combo: { name: "Jungle Family Feast", price: 69, stock: 9000, sellThrough: 0.12 },
    formats: [
      { label: "Kids hall", share: 0.22 },
      { label: "Premium recliner", share: 0.18 },
      { label: "Standard", share: 0.6 },
    ],
  },
  {
    id: "doomsday",
    title: "Avengers: Doomsday",
    tagline: "Biggest pre-sales event of the year. Every system on alert.",
    status: "Pre-sales",
    release: "2026-12-18",
    gradient: "linear-gradient(140deg, #5B0013 0%, #2A0009 55%, #0E0003 100%)",
    accent: "#FF3355",
    glyph: "A",
    share: 0.0,
    occupancy: 0,
    fnbAttach: 0.69,
    sphMult: 1.25,
    presales: 212400,
    combo: { name: "Doomsday Collector Helm Bucket", price: 59, stock: 30000, sellThrough: 0.53 },
    formats: [
      { label: "IMAX", share: 0.34 },
      { label: "Premium recliner", share: 0.21 },
      { label: "Standard", share: 0.45 },
    ],
  },
  {
    id: "dune",
    title: "Dune: Part Three",
    tagline: "Same-day clash with Doomsday — screen allocation matters.",
    status: "Pre-sales",
    release: "2026-12-18",
    gradient: "linear-gradient(140deg, #5A3A12 0%, #2D1C08 55%, #110A02 100%)",
    accent: "#E8B66B",
    glyph: "D3",
    share: 0.0,
    occupancy: 0,
    fnbAttach: 0.6,
    sphMult: 1.05,
    presales: 64800,
    combo: { name: "Sandworm Spice Bucket", price: 55, stock: 8000, sellThrough: 0.47 },
    formats: [
      { label: "IMAX", share: 0.46 },
      { label: "Premium recliner", share: 0.16 },
      { label: "Standard", share: 0.38 },
    ],
  },
];

/** Remaining admissions are holdover / local / other titles. */
const OTHER_SHARE = 1 - FILM_SEEDS.reduce((a, f) => a + f.share, 0);

const SITE_SEEDS: { name: string; region: string; weight: number; occ: number; sph: number; kiosks: number }[] = [
  { name: "Kuala Lumpur City Centre", region: "Klang Valley", weight: 1.25, occ: 0.74, sph: 1.18, kiosks: 10 },
  { name: "Petaling Jaya", region: "Klang Valley", weight: 1.15, occ: 0.69, sph: 1.06, kiosks: 8 },
  { name: "Subang Jaya", region: "Klang Valley", weight: 1.1, occ: 0.67, sph: 1.04, kiosks: 8 },
  { name: "Bukit Jalil", region: "Klang Valley", weight: 1.0, occ: 0.66, sph: 1.1, kiosks: 8 },
  { name: "Putrajaya", region: "Klang Valley", weight: 0.75, occ: 0.58, sph: 0.94, kiosks: 6 },
  { name: "Penang", region: "Northern", weight: 0.9, occ: 0.63, sph: 0.97, kiosks: 6 },
  { name: "Ipoh", region: "Northern", weight: 0.55, occ: 0.52, sph: 0.88, kiosks: 4 },
  { name: "Johor Bahru", region: "Southern", weight: 0.95, occ: 0.64, sph: 0.99, kiosks: 6 },
  { name: "Melaka", region: "Southern", weight: 0.6, occ: 0.55, sph: 0.9, kiosks: 4 },
  { name: "Kuching", region: "East Malaysia", weight: 0.7, occ: 0.6, sph: 0.92, kiosks: 4 },
  { name: "Kota Kinabalu", region: "East Malaysia", weight: 0.72, occ: 0.61, sph: 0.95, kiosks: 4 },
];
const SITE_WEIGHT_SUM = SITE_SEEDS.reduce((a, s) => a + s.weight, 0);

const FNB_SEEDS: { name: string; category: FnbItem["category"]; mix: number; price: number; margin: number }[] = [
  { name: "Caramel & Salted Popcorn (Large)", category: "Popcorn", mix: 0.24, price: 13.9, margin: 0.88 },
  { name: "Couple Combo (2 drinks + popcorn)", category: "Combos", mix: 0.16, price: 28.9, margin: 0.8 },
  { name: "Doomsday Collector Helm Bucket", category: "Collectibles", mix: 0.05, price: 59, margin: 0.58 },
  { name: "Atomic Breath Kaiju Bucket", category: "Collectibles", mix: 0.07, price: 49, margin: 0.6 },
  { name: "Soft drinks (Regular / Large)", category: "Drinks", mix: 0.21, price: 8.9, margin: 0.85 },
  { name: "Chicken Hotdog & Nachos", category: "Hot food", mix: 0.11, price: 15.9, margin: 0.66 },
  { name: "Iced Milo / Teh Tarik", category: "Drinks", mix: 0.09, price: 9.5, margin: 0.8 },
  { name: "Chocolates & Snacks", category: "Snacks", mix: 0.07, price: 7.5, margin: 0.55 },
];

/* ------------------------------------------------------------------ */
/* Generator                                                           */
/* ------------------------------------------------------------------ */

export interface BuildOptions {
  now: number;
  assumptions: Assumptions;
  /** Override daily admissions (live mode scales the business story to real traffic). */
  dailyAdmissions?: number;
}

export const DEMO_DAILY_ADMISSIONS = 96000;

export function buildHourly(now: number, dailyAdmissions: number, a: Assumptions, jitter: () => number): HourPoint[] {
  const midnight = mytMidnight(now);
  const curHour = mytHour(now);
  const minuteFrac = ((now - midnight) % 3600000) / 3600000;
  const fnbPerAdmission = a.fnbSpendPerHead;
  return HOUR_WEIGHTS.map((w, h) => {
    const base = (dailyAdmissions * w) / WEIGHT_SUM;
    const noise = 0.92 + jitter() * 0.16;
    let adm = base * noise;
    const forecast = h > curHour;
    if (h === curHour) adm *= Math.max(minuteFrac, 0.05);
    // F&B peaks slightly before the evening shows (pre-show rush) – skew a little.
    const fnbSkew = h >= 18 && h <= 21 ? 1.08 : h >= 22 || h <= 1 ? 0.82 : 1;
    const lw = (dailyAdmissions * w) / WEIGHT_SUM * (0.84 + jitter() * 0.08) * (a.avgTicketPrice + fnbPerAdmission);
    return {
      ts: midnight + h * 3600000,
      ticket: adm * a.avgTicketPrice,
      fnb: adm * fnbPerAdmission * fnbSkew,
      lastWeek: lw,
      forecast,
    };
  });
}

export function buildCatalogue(opts: BuildOptions, admissionsToDate: number, jitter: () => number) {
  const a = opts.assumptions;
  const films: Film[] = FILM_SEEDS.map((f) => {
    const adm = admissionsToDate * f.share;
    const sph = a.fnbSpendPerHead * f.sphMult;
    const sold = Math.round(f.combo.stock * f.combo.sellThrough * (0.98 + jitter() * 0.04));
    return {
      id: f.id,
      title: f.title,
      tagline: f.tagline,
      status: f.status,
      release: f.release,
      gradient: f.gradient,
      accent: f.accent,
      glyph: f.glyph,
      admissions: Math.round(adm),
      gross: adm * a.avgTicketPrice * (f.formats[0].label === "IMAX" ? 1.12 : 1),
      fnbRevenue: adm * sph,
      occupancy: f.occupancy,
      fnbAttach: f.fnbAttach,
      shows: f.share > 0 ? Math.round(1450 * f.share * 2.4) : 0,
      presales: Math.round(f.presales * (opts.dailyAdmissions ?? DEMO_DAILY_ADMISSIONS) / DEMO_DAILY_ADMISSIONS),
      combo: { name: f.combo.name, price: f.combo.price, stock: f.combo.stock, sold },
      formats: f.formats,
    };
  });

  const sites: Site[] = SITE_SEEDS.map((s) => {
    const adm = (admissionsToDate * s.weight) / SITE_WEIGHT_SUM;
    const sph = a.fnbSpendPerHead * s.sph;
    const kioskDown = s.name === "Penang" ? 2 : s.name === "Kota Kinabalu" ? 1 : 0;
    return {
      name: s.name,
      region: s.region,
      admissions: Math.round(adm),
      ticketRevenue: adm * a.avgTicketPrice,
      fnbRevenue: adm * sph,
      occupancy: Math.min(0.95, s.occ * (0.97 + jitter() * 0.06)),
      sph,
      kiosksOnline: s.kiosks - kioskDown,
      kiosksTotal: s.kiosks,
    };
  });

  const fnbTotal = admissionsToDate * a.fnbSpendPerHead;
  const fnbItems: FnbItem[] = FNB_SEEDS.map((i) => {
    const revenue = fnbTotal * i.mix;
    return { name: i.name, category: i.category, units: Math.round(revenue / i.price), revenue, margin: i.margin };
  });

  return { films, sites, fnbItems, otherShare: OTHER_SHARE };
}

export function buildReadiness(scale: number): Readiness {
  return {
    event: "Avengers: Doomsday — opening night",
    date: "2026-12-18",
    expectedPeakTpm: Math.round(5200 * scale),
    testedCapacityTpm: Math.round(3800 * scale),
    currentPeakTpm: Math.round(2450 * scale),
    checklist: [
      { item: "Virtual waiting room in front of booking flow", state: "done" },
      { item: "Synthetic booking journey every minute from KL, Penang, JB, Kuching", state: "done" },
      { item: "Davis anomaly alerts routed to the opening-night war room", state: "done" },
      { item: "Payment gateway load-tested at 2× expected peak (FPX & e-wallet)", state: "at-risk" },
      { item: "Collector bucket pre-order capacity (F&B app) for midnight drop", state: "at-risk" },
      { item: "Seat-map cache warm-up for IMAX & premium halls", state: "todo" },
    ],
  };
}

const PAYMENT_MIX = [
  { label: "Debit / credit card", share: 0.41, color: brand.red },
  { label: "e-Wallet", share: 0.34, color: brand.gold },
  { label: "FPX online banking", share: 0.17, color: brand.info },
  { label: "Cash at counter", share: 0.08, color: brand.faint },
];

const FNB_ORDER_CHANNELS = [
  { label: "Concession counter", share: 0.58, color: brand.red },
  { label: "Mobile pre-order", share: 0.24, color: brand.gold },
  { label: "Self-service kiosk", share: 0.12, color: brand.info },
  { label: "In-seat delivery", share: 0.06, color: brand.ok },
];

export function computeKpis(
  hourly: HourPoint[],
  a: Assumptions,
  revenueAtRisk: number,
  bookingSuccess: number,
  occupancy: number,
): Kpis {
  const actual = hourly.filter((h) => !h.forecast);
  const ticketRevenue = actual.reduce((s, h) => s + h.ticket, 0);
  const fnbRevenue = actual.reduce((s, h) => s + h.fnb, 0);
  const lastWeek = actual.reduce((s, h) => s + h.lastWeek, 0);
  const admissions = ticketRevenue / a.avgTicketPrice;
  const gross = ticketRevenue + fnbRevenue;
  return {
    grossRevenue: gross,
    ticketRevenue,
    fnbRevenue,
    admissions,
    spendPerHead: admissions > 0 ? fnbRevenue / admissions : 0,
    attachRate: a.fnbAttachRate,
    occupancy,
    revenueAtRisk,
    bookingSuccess,
    digitalShare: 0.78,
    vsLastWeek: lastWeek > 0 ? gross / lastWeek - 1 : 0,
    grossProfit: ticketRevenue * a.ticketMargin + fnbRevenue * a.fnbMargin,
    ticketProfit: ticketRevenue * a.ticketMargin,
    fnbProfit: fnbRevenue * a.fnbMargin,
  };
}

function demoChannels(revPerHour: number, jitter: () => number, tick: number): Channel[] {
  const spark = (base: number, vol: number, trend = 0) =>
    Array.from({ length: 24 }, (_, i) => Math.max(0, base * (1 + trend * (i / 23)) * (1 - vol / 2 + jitter() * vol)));
  const wobble = Math.sin(tick / 3) * 0.04;
  return [
    {
      id: "booking",
      name: "Online Booking",
      purpose: "Web & mobile app ticket checkout",
      backedBy: "booking-api",
      txPerMin: 1180 * (1 + wobble),
      successRate: 0.994,
      responseMs: 420,
      health: "healthy",
      revenuePerHour: revPerHour * 0.52,
      spark: spark(1100, 0.15, 0.25),
    },
    {
      id: "seatmap",
      name: "Seat Map & Sessions",
      purpose: "Showtimes, hall layout, seat locking",
      backedBy: "seatmap-service",
      txPerMin: 3420 * (1 + wobble),
      successRate: 0.981,
      responseMs: 1840 + Math.round(jitter() * 200),
      health: "degraded",
      revenuePerHour: revPerHour * 0.52,
      spark: spark(3000, 0.2, 0.5),
    },
    {
      id: "payments",
      name: "Payments",
      purpose: "Card · FPX · e-Wallet",
      backedBy: "payment-gateway",
      txPerMin: 1090 * (1 + wobble),
      successRate: 0.987,
      responseMs: 960,
      health: "healthy",
      revenuePerHour: revPerHour * 0.58,
      spark: spark(1000, 0.18, 0.2),
    },
    {
      id: "fnb",
      name: "F&B Mobile Pre-order",
      purpose: "Order-ahead & in-seat delivery",
      backedBy: "fnb-order-service",
      txPerMin: 410 * (1 + wobble),
      successRate: 0.962,
      responseMs: 1210,
      health: "critical",
      revenuePerHour: revPerHour * 0.11,
      spark: spark(420, 0.35, -0.1),
    },
    {
      id: "loyalty",
      name: "Loyalty & Rewards",
      purpose: "Member points, vouchers, birthday treats",
      backedBy: "loyalty-service",
      txPerMin: 640 * (1 + wobble),
      successRate: 0.998,
      responseMs: 210,
      health: "healthy",
      revenuePerHour: revPerHour * 0.2,
      spark: spark(600, 0.1),
    },
    {
      id: "kiosk",
      name: "Self-service Kiosks",
      purpose: "In-lobby tickets & F&B",
      backedBy: "kiosk-edge",
      txPerMin: 260 * (1 + wobble),
      successRate: 0.991,
      responseMs: 640,
      health: "healthy",
      revenuePerHour: revPerHour * 0.16,
      spark: spark(250, 0.2),
    },
  ];
}

function demoIncidents(now: number, revPerMin: number): Incident[] {
  const m = 60000;
  const mk = (
    id: string,
    title: string,
    channel: string,
    category: string,
    startAgoMin: number,
    durMin: number | null,
    impact: number,
    businessImpact: string,
  ): Incident => {
    const start = now - startAgoMin * m;
    const end = durMin == null ? undefined : start + durMin * m;
    const durationMin = ((end ?? now) - start) / m;
    return {
      id,
      title,
      status: end ? "CLOSED" : "ACTIVE",
      category,
      start,
      end,
      channel,
      durationMin,
      revenueAtRisk: durationMin * revPerMin * impact,
      businessImpact,
    };
  };
  return [
    mk(
      "P-26111901",
      "F&B pre-order confirmation failures",
      "F&B Mobile Pre-order",
      "ERROR",
      38,
      null,
      0.09,
      "Guests pay but receive no pickup code — queues at counter, collector buckets oversold risk.",
    ),
    mk(
      "P-26111897",
      "Seat-map response time degradation (IMAX halls)",
      "Seat Map & Sessions",
      "SLOWDOWN",
      74,
      null,
      0.05,
      "Doomsday pre-sales surge: seat selection >1.8s → booking abandonment up ~6%.",
    ),
    mk(
      "P-26111884",
      "FPX bank redirect timeouts",
      "Payments",
      "AVAILABILITY",
      260,
      17,
      0.22,
      "One FPX bank route timing out; customers switched to card or abandoned checkout.",
    ),
    mk(
      "P-26111862",
      "Kiosk printer service unavailable — Penang",
      "Self-service Kiosks",
      "AVAILABILITY",
      410,
      46,
      0.02,
      "2 of 6 kiosks offline; walk-ins redirected to counter, F&B upsell lost.",
    ),
  ];
}

/** Full synthetic model for demo mode. */
export function buildDemoModel(now: number, a: Assumptions): CinemaModel {
  const tick = Math.floor(now / 15000);
  const dayRand = rng(Math.floor(mytMidnight(now) / 86400000));
  const tickRand = rng(tick);
  const jitter = () => dayRand() * 0.85 + tickRand() * 0.15;

  const hourly = buildHourly(now, DEMO_DAILY_ADMISSIONS, a, jitter);
  const curHour = mytHour(now);
  // Full-hour revenue at the 8pm peak, used to size channel throughput and revenue-at-risk.
  const peakHourRev = ((DEMO_DAILY_ADMISSIONS * HOUR_WEIGHTS[20]) / WEIGHT_SUM) * (a.avgTicketPrice + a.fnbSpendPerHead);
  const curHourFull = ((DEMO_DAILY_ADMISSIONS * HOUR_WEIGHTS[curHour]) / WEIGHT_SUM) * (a.avgTicketPrice + a.fnbSpendPerHead);
  const revPerMin = Math.max(curHourFull, peakHourRev * 0.4) / 60;

  const incidents = demoIncidents(now, revPerMin);
  const revenueAtRisk = incidents.reduce((s, i) => s + i.revenueAtRisk, 0);
  const kpis = computeKpis(hourly, a, revenueAtRisk, 0.982, 0.66);
  const cat = buildCatalogue({ now, assumptions: a }, kpis.admissions, jitter);

  return {
    mode: "demo",
    asOf: now,
    sources: {
      revenue: "demo",
      tech: "demo",
      merchandising: "demo",
      note: "Demo mode — Layar Cinemas, a fictional 11-site Malaysian cinema chain. No tenant data is used.",
    },
    kpis,
    hourly,
    channels: demoChannels(peakHourRev, jitter, tick),
    incidents,
    films: cat.films,
    sites: cat.sites,
    fnbItems: cat.fnbItems,
    fnbOrderChannels: FNB_ORDER_CHANNELS,
    paymentMix: PAYMENT_MIX,
    readiness: buildReadiness(1),
  };
}

export { PAYMENT_MIX, FNB_ORDER_CHANNELS };
