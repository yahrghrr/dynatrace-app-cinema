export type Mode = "live" | "demo";

/** Where a given number on screen came from. Shown as a badge so execs know what is real. */
export type Provenance = "live" | "modelled" | "demo";

export type Health = "healthy" | "degraded" | "critical";

export interface Assumptions {
  /** Average ticket price in RM. */
  avgTicketPrice: number;
  /** Average F&B spend per head (per admission) in RM. */
  fnbSpendPerHead: number;
  /** Share of admissions buying any F&B item. */
  fnbAttachRate: number;
  /** Live mode: admissions represented by one monitored service request. */
  admissionsPerRequest: number;
  /** Share of ticket revenue retained after distributor rental. */
  ticketMargin: number;
  /** Gross margin on food & beverage. */
  fnbMargin: number;
}

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  avgTicketPrice: 19.5,
  fnbSpendPerHead: 13.8,
  fnbAttachRate: 0.62,
  admissionsPerRequest: 0.08,
  ticketMargin: 0.48,
  fnbMargin: 0.78,
};

export interface HourPoint {
  /** Epoch ms of the start of the hour. */
  ts: number;
  ticket: number;
  fnb: number;
  /** Same hour last week, total revenue. */
  lastWeek: number;
  /** True for hours that have not happened yet (forecast). */
  forecast?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  purpose: string;
  /** The monitored entity behind this channel (real service name in live mode). */
  backedBy: string;
  /** Real Dynatrace entity ID (live mode) for drilldown. */
  entityId?: string;
  txPerMin: number;
  successRate: number;
  responseMs: number;
  health: Health;
  /** Revenue flowing through this channel per hour, RM. */
  revenuePerHour: number;
  spark: number[];
}

export interface Incident {
  id: string;
  title: string;
  status: "ACTIVE" | "CLOSED";
  category: string;
  start: number;
  end?: number;
  channel: string;
  durationMin: number;
  revenueAtRisk: number;
  businessImpact: string;
  /** Davis problem event.id (live mode) for drilldown. */
  eventId?: string;
}

export interface ThemedCombo {
  name: string;
  price: number;
  sold: number;
  stock: number;
}

export interface Film {
  id: string;
  title: string;
  tagline: string;
  status: "Now Showing" | "Opening" | "Pre-sales";
  release: string; // ISO date
  gradient: string;
  accent: string;
  glyph: string; // short monogram for the poster tile
  admissions: number;
  gross: number;
  fnbRevenue: number;
  occupancy: number;
  fnbAttach: number;
  shows: number;
  presales: number;
  combo: ThemedCombo;
  formats: { label: string; share: number }[];
}

export interface Site {
  name: string;
  region: string;
  admissions: number;
  ticketRevenue: number;
  fnbRevenue: number;
  occupancy: number;
  sph: number;
  kiosksOnline: number;
  kiosksTotal: number;
}

export interface FnbItem {
  name: string;
  category: "Popcorn" | "Drinks" | "Combos" | "Hot food" | "Collectibles" | "Snacks";
  units: number;
  revenue: number;
  margin: number;
}

export interface Readiness {
  event: string;
  date: string;
  expectedPeakTpm: number;
  testedCapacityTpm: number;
  currentPeakTpm: number;
  checklist: { item: string; state: "done" | "at-risk" | "todo" }[];
}

export interface Kpis {
  grossRevenue: number;
  ticketRevenue: number;
  fnbRevenue: number;
  admissions: number;
  spendPerHead: number;
  attachRate: number;
  occupancy: number;
  revenueAtRisk: number;
  bookingSuccess: number;
  digitalShare: number;
  vsLastWeek: number;
  grossProfit: number;
  ticketProfit: number;
  fnbProfit: number;
}

export interface Sources {
  revenue: Provenance;
  tech: Provenance;
  merchandising: Provenance;
  note: string;
}

export interface CinemaModel {
  mode: Mode;
  asOf: number;
  sources: Sources;
  kpis: Kpis;
  hourly: HourPoint[];
  channels: Channel[];
  incidents: Incident[];
  films: Film[];
  sites: Site[];
  fnbItems: FnbItem[];
  fnbOrderChannels: { label: string; share: number; color: string }[];
  paymentMix: { label: string; share: number; color: string }[];
  readiness: Readiness;
}
