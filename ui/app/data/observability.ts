import { useMemo } from "react";
import { useDql } from "@dynatrace-sdk/react-hooks";
import type { ResultRecord } from "@dynatrace-sdk/client-query";
import { drill, type DrillTarget } from "../components/Drill";
import { rng } from "./demo";
import type { CinemaModel, Health, Provenance } from "./types";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface ObsService {
  id?: string;
  name: string;
  channel: string;
  throughputPerMin: number;
  errorRate: number;
  p95Ms: number;
  sloTarget: number;
  availability7d: number;
  /** Share of the 7-day error budget still unspent (can be negative). */
  budgetRemaining: number;
  revenuePerHour: number;
  status: Health;
}

export interface ObsHost {
  id?: string;
  name: string;
  role: string;
  cpuAvg: number;
  cpuMax: number;
  memAvg: number;
  spark: number[];
  status: Health;
}

export interface ObsNamespace {
  cluster: string;
  namespace: string;
  role: string;
  running: number;
  notRunning: number;
}

export interface ObsWorkloadIssue {
  cluster: string;
  namespace: string;
  workload: string;
  phase: string;
  pods: number;
}

export interface ObsLogSource {
  process: string;
  namespace?: string;
  count: number;
  sample: string;
}

export interface ObsMttr {
  category: string;
  count: number;
  mttrMin: number;
  medianMin: number;
  costPerIncident: number;
}

export interface ObsVital {
  frontend: string;
  lcpMs: number;
  inpMs: number;
  cls: number;
  apdex: number;
  sessions: number;
}

export interface ObsSynthetic {
  name: string;
  location: string;
  availability: number;
  durationMs: number;
  status: Health;
}

export interface ImpactRow {
  kpi: string;
  signal: string;
  value: string;
  status: Health;
  /** RM per hour (or per incident for MTTR) exposed by this signal right now. */
  impact: number;
  impactUnit: "/h" | "/incident" | "";
  why: string;
  source: Provenance;
  drill: DrillTarget;
}

export interface ObsModel {
  sources: {
    services: Provenance;
    infra: Provenance;
    k8s: Provenance;
    logs: Provenance;
    problems: Provenance;
    rum: Provenance;
    synthetic: Provenance;
  };
  services: ObsService[];
  hosts: ObsHost[];
  namespaces: ObsNamespace[];
  workloadIssues: ObsWorkloadIssue[];
  logSources: ObsLogSource[];
  logTrend: { ts: number; err: number; warn: number }[];
  logQuery: string;
  mttr: ObsMttr[];
  vitals: ObsVital[];
  synthetic: ObsSynthetic[];
  impact: ImpactRow[];
}

/* ------------------------------------------------------------------ */
/* Shared business translation                                         */
/* ------------------------------------------------------------------ */

const SLO_TARGET: Record<string, number> = {
  "Online Booking": 0.995,
  "Seat Map & Sessions": 0.995,
  Payments: 0.999,
  "F&B Mobile Pre-order": 0.99,
  "Loyalty & Rewards": 0.99,
  "Self-service Kiosks": 0.99,
};

const CATEGORY_IMPACT: Record<string, number> = {
  AVAILABILITY: 0.6,
  ERROR: 0.3,
  SLOWDOWN: 0.12,
  RESOURCE_CONTENTION: 0.06,
  CUSTOM_ALERT: 0.04,
};

/** Booking abandonment rises ~7% for every second of p95 latency above 1s. */
export const latencyLoss = (p95Ms: number) => Math.min(0.5, Math.max(0, (p95Ms - 1000) / 1000) * 0.07);

const LOG_QUERY = `fetch logs
| filter loglevel == "ERROR" or loglevel == "WARN"
| summarize count = count(), by:{dt.process.name, loglevel}
| sort count desc`;

function status(v: number, warn: number, crit: number, higherIsBad = true): Health {
  if (higherIsBad) return v >= crit ? "critical" : v >= warn ? "degraded" : "healthy";
  return v <= crit ? "critical" : v <= warn ? "degraded" : "healthy";
}

function revPerMin(cinema: CinemaModel) {
  const h = cinema.hourly.filter((x) => !x.forecast);
  const last = h[h.length - 2] ?? h[h.length - 1];
  return Math.max(1, (last?.ticket ?? 0) + (last?.fnb ?? 0)) / 60;
}

function buildImpact(o: Omit<ObsModel, "impact">, cinema: CinemaModel): ImpactRow[] {
  const byChannel = (c: string) => o.services.find((s) => s.channel === c);
  const ch = (c: string) => cinema.channels.find((x) => x.name === c);
  const seat = byChannel("Seat Map & Sessions") ?? o.services[1];
  const booking = byChannel("Online Booking") ?? o.services[0];
  const pay = byChannel("Payments") ?? o.services[2];
  const fnb = byChannel("F&B Mobile Pre-order") ?? o.services[3];
  const rows: ImpactRow[] = [];

  if (seat || booking) {
    const worst = [seat, booking].filter((x): x is ObsService => !!x).sort((a, b) => b.p95Ms - a.p95Ms)[0];
    const loss = latencyLoss(worst.p95Ms);
    rows.push({
      kpi: "Ticket conversion",
      signal: `${worst.channel} p95 response time`,
      value: worst.p95Ms >= 1000 ? `${(worst.p95Ms / 1000).toFixed(2)} s` : `${Math.round(worst.p95Ms)} ms`,
      status: status(worst.p95Ms, 1000, 2500),
      impact: loss * (ch(worst.channel)?.revenuePerHour ?? worst.revenuePerHour),
      impactUnit: "/h",
      why: "Every second above 1s at seat selection or checkout costs ~7% of bookings.",
      source: o.sources.services,
      drill: drill.service(worst.id),
    });
  }
  if (pay) {
    rows.push({
      kpi: "Payment completion",
      signal: `${pay.channel} failure rate`,
      value: `${(pay.errorRate * 100).toFixed(2)}%`,
      status: status(pay.errorRate, 0.005, 0.02),
      impact: pay.errorRate * 0.6 * (ch(pay.channel)?.revenuePerHour ?? pay.revenuePerHour),
      impactUnit: "/h",
      why: "~60% of guests who hit a payment error don't retry — the basket is lost.",
      source: o.sources.services,
      drill: drill.service(pay.id),
    });
  }
  if (fnb) {
    rows.push({
      kpi: "F&B spend per head",
      signal: `${fnb.channel} failure rate`,
      value: `${(fnb.errorRate * 100).toFixed(2)}%`,
      status: status(fnb.errorRate, 0.01, 0.03),
      impact: fnb.errorRate * (ch(fnb.channel)?.revenuePerHour ?? fnb.revenuePerHour) * 1.5,
      impactUnit: "/h",
      why: "Failed pre-orders push guests to the counter queue — many skip F&B entirely.",
      source: o.sources.services,
      drill: drill.service(fnb.id),
    });
  }

  // Capacity: pods not running in the busiest namespace + hottest host.
  const ns = [...o.namespaces].sort((a, b) => b.running + b.notRunning - (a.running + a.notRunning))[0];
  if (ns) {
    const lossShare = ns.notRunning / Math.max(1, ns.running + ns.notRunning);
    const peakRevHour = Math.max(...cinema.hourly.map((h) => h.ticket + h.fnb));
    const issue = o.workloadIssues.find((w) => w.namespace === ns.namespace);
    rows.push({
      kpi: "Opening-night capacity",
      signal: `Pods not running · ${ns.role}`,
      value: `${ns.notRunning} of ${ns.running + ns.notRunning}${issue ? ` (${issue.workload})` : ""}`,
      status: status(lossShare, 0.05, 0.15),
      impact: lossShare * peakRevHour * 0.5,
      impactUnit: "/h",
      why: "Missing replicas shrink headroom; at Doomsday-scale peaks that becomes queueing and timeouts.",
      source: o.sources.k8s,
      drill: drill.k8s(ns.cluster, ns.namespace, issue?.workload),
    });
  }
  const hot = [...o.hosts].sort((a, b) => Math.max(b.cpuMax, b.memAvg) - Math.max(a.cpuMax, a.memAvg))[0];
  if (hot) {
    const sat = Math.max(hot.cpuMax, hot.memAvg);
    rows.push({
      kpi: "Platform headroom",
      signal: `Host saturation · ${hot.role}`,
      value: `CPU ${Math.round(hot.cpuMax)}% · Mem ${Math.round(hot.memAvg)}%`,
      status: status(sat, 80, 92),
      impact: sat >= 80 ? ((sat - 80) / 20) * revPerMin(cinema) * 60 * 0.1 : 0,
      impactUnit: "/h",
      why: "Saturated hosts are the first to slow down when pre-sales open.",
      source: o.sources.infra,
      drill: drill.host(hot.id),
    });
  }

  const avail = o.mttr.find((m) => m.category === "AVAILABILITY") ?? o.mttr[0];
  if (avail) {
    rows.push({
      kpi: "Cost of downtime",
      signal: `Median time to resolve · ${avail.category.toLowerCase().replace(/_/g, " ")} problems`,
      value: avail.medianMin >= 60 ? `${(avail.medianMin / 60).toFixed(1)} h` : `${Math.round(avail.medianMin)} min`,
      status: status(avail.medianMin, 30, 120),
      impact: avail.costPerIncident,
      impactUnit: "/incident",
      why: "Halving time-to-resolve halves the revenue lost per incident.",
      source: o.sources.problems,
      drill: drill.problem(),
    });
  }

  const recent = o.logTrend.slice(-1)[0];
  const avgErr = o.logTrend.reduce((s, x) => s + x.err, 0) / Math.max(1, o.logTrend.length);
  if (recent) {
    const ratio = avgErr > 0 ? recent.err / avgErr : 1;
    rows.push({
      kpi: "Early warning",
      signal: "Error log volume, last hour vs 24h average",
      value: `${Math.round(recent.err).toLocaleString()} (${ratio >= 1 ? "+" : ""}${Math.round((ratio - 1) * 100)}%)`,
      status: status(ratio, 1.5, 3),
      impact: 0,
      impactUnit: "",
      why: "Error spikes in logs often precede checkout failures by minutes.",
      source: o.sources.logs,
      drill: drill.logs(o.logQuery),
    });
  }

  const web = o.vitals[0];
  if (web) {
    rows.push({
      kpi: "Online booking experience",
      signal: `${web.frontend} · Largest Contentful Paint`,
      value: `${(web.lcpMs / 1000).toFixed(2)} s`,
      status: status(web.lcpMs, 2500, 4000),
      impact: (Math.max(0, web.lcpMs - 2500) / 100) * 0.01 * (ch("Online Booking")?.revenuePerHour ?? 0),
      impactUnit: "/h",
      why: "Each 100ms above Google's 2.5s 'good' threshold costs ~1% of conversions.",
      source: o.sources.rum,
      drill: drill.vitals(),
    });
  }
  const synthWorst = [...o.synthetic].sort((a, b) => a.availability - b.availability)[0];
  if (synthWorst) {
    rows.push({
      kpi: "Booking journey availability",
      signal: `Synthetic · ${synthWorst.name} (${synthWorst.location})`,
      value: `${(synthWorst.availability * 100).toFixed(2)}%`,
      status: status(synthWorst.availability, 0.995, 0.98, false),
      impact: (1 - synthWorst.availability) * (ch("Online Booking")?.revenuePerHour ?? 0) * 0.2,
      impactUnit: "/h",
      why: "Synthetic checks catch outages in a region before guests call the hotline.",
      source: o.sources.synthetic,
      drill: drill.synthetic(),
    });
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/* Demo-only datasets (also used in live when the tenant lacks them)   */
/* ------------------------------------------------------------------ */

function demoVitals(): ObsVital[] {
  return [
    { frontend: "Booking website", lcpMs: 2840, inpMs: 190, cls: 0.06, apdex: 0.86, sessions: 48200 },
    { frontend: "iOS app", lcpMs: 1650, inpMs: 120, cls: 0.02, apdex: 0.93, sessions: 39100 },
    { frontend: "Android app", lcpMs: 2120, inpMs: 240, cls: 0.03, apdex: 0.89, sessions: 44800 },
    { frontend: "F&B pre-order web", lcpMs: 3420, inpMs: 310, cls: 0.14, apdex: 0.74, sessions: 12900 },
  ];
}

function demoSynthetic(): ObsSynthetic[] {
  const mk = (name: string, location: string, availability: number, durationMs: number): ObsSynthetic => ({
    name,
    location,
    availability,
    durationMs,
    status: status(availability, 0.995, 0.98, false),
  });
  return [
    mk("Book a ticket end-to-end", "Kuala Lumpur", 0.9991, 6400),
    mk("Book a ticket end-to-end", "Penang", 0.9972, 7100),
    mk("Book a ticket end-to-end", "Johor Bahru", 0.9988, 6650),
    mk("Book a ticket end-to-end", "Kuching", 0.9934, 8900),
    mk("Book a ticket end-to-end", "Kota Kinabalu", 0.9962, 8200),
    mk("F&B pre-order checkout", "Kuala Lumpur", 0.9958, 5300),
    mk("Showtimes API (HTTP)", "Singapore", 1, 240),
  ];
}

export function buildDemoObs(cinema: CinemaModel): ObsModel {
  const now = cinema.asOf;
  const r = rng(Math.floor(now / 60000));
  const svcSpec: [string, number, number, number][] = [
    // channel, errorRate, p95, availability7d
    ["Online Booking", 0.006, 780, 0.9962],
    ["Seat Map & Sessions", 0.019, 2350, 0.9921],
    ["Payments", 0.004, 1080, 0.9994],
    ["F&B Mobile Pre-order", 0.038, 1850, 0.9874],
    ["Loyalty & Rewards", 0.002, 310, 0.9991],
    ["Self-service Kiosks", 0.009, 980, 0.9935],
  ];
  const services: ObsService[] = svcSpec.map(([channel, er, p95, a7]) => {
    const c = cinema.channels.find((x) => x.name === channel);
    const target = SLO_TARGET[channel] ?? 0.99;
    return {
      name: c?.backedBy ?? channel,
      channel,
      throughputPerMin: c?.txPerMin ?? 0,
      errorRate: er,
      p95Ms: p95 * (0.95 + r() * 0.1),
      sloTarget: target,
      availability7d: a7,
      budgetRemaining: 1 - (1 - a7) / (1 - target),
      revenuePerHour: c?.revenuePerHour ?? 0,
      status: status(er, 0.01, 0.03),
    };
  });

  const hostSpec: [string, string, number, number][] = [
    ["bkg-api-01.klcc-dc", "Booking API", 71, 64],
    ["bkg-api-02.klcc-dc", "Booking API", 68, 61],
    ["seatmap-cache-01", "Seat-map cache", 88, 91],
    ["pay-gw-01.cyberjaya", "Payment gateway", 54, 58],
    ["fnb-order-01", "F&B ordering", 63, 77],
    ["pos-edge-penang", "Concession POS (Penang)", 42, 83],
    ["kiosk-ctrl-jb", "Kiosk controller (JB)", 23, 49],
    ["dwh-reporting-01", "Reporting warehouse", 35, 72],
  ];
  const hosts: ObsHost[] = hostSpec.map(([name, role, cpu, mem]) => {
    const spark = Array.from({ length: 12 }, (_, i) => Math.min(99, cpu * (0.8 + r() * 0.3) + (i > 8 ? 6 : 0)));
    const cpuMax = Math.max(...spark);
    return { name, role, cpuAvg: cpu, cpuMax, memAvg: mem, spark, status: status(Math.max(cpuMax, mem), 80, 92) };
  });

  const namespaces: ObsNamespace[] = [
    { cluster: "cinema-prod-kl", namespace: "booking", role: "Booking platform", running: 42, notRunning: 3 },
    { cluster: "cinema-prod-kl", namespace: "payments", role: "Payments", running: 12, notRunning: 0 },
    { cluster: "cinema-prod-kl", namespace: "fnb-ordering", role: "F&B ordering", running: 14, notRunning: 1 },
    { cluster: "cinema-prod-kl", namespace: "loyalty", role: "Loyalty", running: 8, notRunning: 0 },
    { cluster: "cinema-prod-kl", namespace: "kiosk-edge", role: "Kiosks", running: 11, notRunning: 0 },
  ];
  const workloadIssues: ObsWorkloadIssue[] = [
    { cluster: "cinema-prod-kl", namespace: "booking", workload: "seatmap-cache", phase: "CrashLoopBackOff", pods: 2 },
    { cluster: "cinema-prod-kl", namespace: "booking", workload: "seat-lock-worker", phase: "Pending", pods: 1 },
    { cluster: "cinema-prod-kl", namespace: "fnb-ordering", workload: "pickup-code-generator", phase: "Failed", pods: 1 },
  ];

  const midnight = now - (now % 3600000) - 23 * 3600000;
  const logTrend = Array.from({ length: 24 }, (_, i) => {
    const ts = midnight + i * 3600000;
    const hourMyt = new Date(ts + 8 * 3600000).getUTCHours();
    const evening = hourMyt >= 18 && hourMyt <= 22 ? 2.2 : 1;
    const spike = i === 23 ? 2.6 : i === 19 ? 1.8 : 1;
    return { ts, err: 140 * evening * spike * (0.8 + r() * 0.4), warn: 900 * evening * (0.8 + r() * 0.4) };
  });
  const logSources: ObsLogSource[] = [
    { process: "fnb-order-service", namespace: "fnb-ordering", count: 1840, sample: "OrderConfirmationException: pickup code generation failed (upstream pickup-code-generator 503)" },
    { process: "seatmap-service", namespace: "booking", count: 1210, sample: "SeatLockTimeout: lock for hall IMAX-1 session 20:30 not acquired within 2000ms" },
    { process: "payment-gateway", namespace: "payments", count: 640, sample: "FpxRedirectTimeout: bank redirect exceeded 30s (bank=MBB2U)" },
    { process: "kiosk-edge", namespace: "kiosk-edge", count: 212, sample: "PrinterNotReady: device PEN-K3 paper jam / offline" },
    { process: "loyalty-service", namespace: "loyalty", count: 48, sample: "VoucherAlreadyRedeemed: voucher BDAY-*** for member ****8812" },
  ];

  const rpm = revPerMin(cinema);
  const mttr: ObsMttr[] = [
    ["AVAILABILITY", 6, 42, 31],
    ["ERROR", 14, 18, 12],
    ["SLOWDOWN", 9, 26, 19],
    ["RESOURCE_CONTENTION", 4, 55, 40],
  ].map(([category, count, mttrMin, medianMin]) => ({
    category: category as string,
    count: count as number,
    mttrMin: mttrMin as number,
    medianMin: medianMin as number,
    costPerIncident: (medianMin as number) * rpm * (CATEGORY_IMPACT[category as string] ?? 0.05),
  }));

  const base: Omit<ObsModel, "impact"> = {
    sources: { services: "demo", infra: "demo", k8s: "demo", logs: "demo", problems: "demo", rum: "demo", synthetic: "demo" },
    services,
    hosts,
    namespaces,
    workloadIssues,
    logSources,
    logTrend,
    logQuery: LOG_QUERY,
    mttr,
    vitals: demoVitals(),
    synthetic: demoSynthetic(),
  };
  return { ...base, impact: buildImpact(base, cinema) };
}

/* ------------------------------------------------------------------ */
/* Live                                                                */
/* ------------------------------------------------------------------ */

const num = (v: unknown): number => (typeof v === "number" ? v : typeof v === "string" ? Number(v) || 0 : 0);
const arr = (v: unknown): number[] => (Array.isArray(v) ? v.map((x) => num(x)) : []);
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const recs = (d: { records?: (ResultRecord | null)[] } | undefined) => (d?.records ?? []).filter((r): r is ResultRecord => !!r);

const NS_ROLES: [RegExp, string][] = [
  [/dynatrace|monitor|observ/i, "Observability"],
  [/kube-system|kube-|ingress|cert/i, "Platform"],
];

export function useLiveObs(enabled: boolean, cinema: CinemaModel): { obs?: ObsModel; loading: boolean; error?: string } {
  const opts = { enabled, refetchInterval: 120000, staleTime: 60000 };

  const svc = useDql(
    `timeseries {req=sum(dt.service.request.count), fail=sum(dt.service.request.failure_count), p95=percentile(dt.service.request.response_time, 95)}, by:{dt.entity.service}, from:-24h, interval:1h
| fieldsAdd name=entityName(dt.entity.service), total=arraySum(req), fails=arraySum(fail), p95avg=arrayAvg(p95)
| fields dt.entity.service, name, total, fails, p95avg
| sort total desc
| limit 6`,
    opts,
  );
  const slo = useDql(
    `timeseries {req=sum(dt.service.request.count), fail=sum(dt.service.request.failure_count)}, by:{dt.entity.service}, from:-7d, interval:1d
| fieldsAdd total=arraySum(req), fails=arraySum(fail)
| fields dt.entity.service, total, fails`,
    opts,
  );
  const hosts = useDql(
    `timeseries {cpu=avg(dt.host.cpu.usage), mem=avg(dt.host.memory.usage)}, by:{dt.entity.host}, from:-2h, interval:10m
| fieldsAdd name=entityName(dt.entity.host), cpuAvg=arrayAvg(cpu), cpuMax=arrayMax(cpu), memAvg=arrayAvg(mem)
| fields dt.entity.host, name, cpuAvg, cpuMax, memAvg, cpu
| sort cpuMax desc
| limit 8`,
    opts,
  );
  const ns = useDql(
    `timeseries p=sum(dt.kubernetes.pods), by:{k8s.cluster.name, k8s.namespace.name, pod_phase}, from:-30m
| fieldsAdd v=arrayLast(p)
| summarize {running=sum(if(pod_phase=="Running", v, else:0)), notRunning=sum(if(pod_phase!="Running" and pod_phase!="Succeeded", v, else:0))}, by:{k8s.cluster.name, k8s.namespace.name}`,
    opts,
  );
  const wl = useDql(
    `timeseries p=sum(dt.kubernetes.pods), by:{k8s.cluster.name, k8s.namespace.name, k8s.workload.name, pod_phase}, from:-30m
| fieldsAdd v=arrayLast(p)
| filter pod_phase != "Running" and pod_phase != "Succeeded" and v > 0
| fields k8s.cluster.name, k8s.namespace.name, k8s.workload.name, pod_phase, v
| sort v desc
| limit 10`,
    opts,
  );
  const logTs = useDql(
    `fetch logs, from:-24h
| filter loglevel=="ERROR" or loglevel=="WARN"
| makeTimeseries {err=countIf(loglevel=="ERROR"), warn=countIf(loglevel=="WARN")}, interval:1h`,
    opts,
  );
  const logTop = useDql(
    `fetch logs, from:-2h
| filter loglevel=="ERROR"
| summarize c=count(), sample=takeFirst(content), by:{dt.process.name, k8s.namespace.name}
| sort c desc
| limit 6`,
    opts,
  );
  const mttr = useDql(
    `fetch dt.davis.problems, from:-7d
| filter not(dt.davis.is_duplicate) and event.status=="CLOSED"
| fieldsAdd d=(event.end - event.start)/1m
| summarize n=count(), mttr=avg(d), p50=median(d), by:{event.category}
| sort n desc`,
    opts,
  );

  const all = [svc, slo, hosts, ns, wl, logTs, logTop, mttr];
  const loading = enabled && all.some((q) => q.isLoading && !q.data);
  const error = all.find((q) => q.error)?.error?.message;

  const obs = useMemo<ObsModel | undefined>(() => {
    if (!enabled || !svc.data) return undefined;
    const sloMap = new Map(recs(slo.data).map((r) => [str(r["dt.entity.service"]), r]));
    const services: ObsService[] = recs(svc.data).map((r) => {
      const id = str(r["dt.entity.service"]);
      const c = cinema.channels.find((x) => x.entityId === id);
      const channel = c?.name ?? "Unmapped service";
      const total = num(r.total);
      const errorRate = total > 0 ? num(r.fails) / total : 0;
      const s7 = sloMap.get(id);
      const t7 = num(s7?.total);
      const availability7d = t7 > 0 ? 1 - num(s7?.fails) / t7 : 1;
      const target = SLO_TARGET[channel] ?? 0.99;
      return {
        id,
        name: str(r.name) || id,
        channel,
        throughputPerMin: total / (24 * 60),
        errorRate,
        p95Ms: num(r.p95avg) / 1000,
        sloTarget: target,
        availability7d,
        budgetRemaining: 1 - (1 - availability7d) / (1 - target),
        revenuePerHour: c?.revenuePerHour ?? 0,
        status: status(errorRate, 0.01, 0.03),
      };
    });

    const hostRecs = recs(hosts.data);
    const hostList: ObsHost[] = hostRecs.map((r, i) => {
      const cpuMax = num(r.cpuMax);
      const memAvg = num(r.memAvg);
      const roles = ["Booking API", "Seat-map cache", "Payment gateway", "F&B ordering", "Concession POS", "Kiosk controller", "Loyalty", "Reporting"];
      return {
        id: str(r["dt.entity.host"]),
        name: str(r.name) || str(r["dt.entity.host"]),
        role: `${roles[i % roles.length]} (mapped)`,
        cpuAvg: num(r.cpuAvg),
        cpuMax,
        memAvg,
        spark: arr(r.cpu).filter((x) => x > 0),
        status: status(Math.max(cpuMax, memAvg), 80, 92),
      };
    });

    const nsRecs = recs(ns.data);
    const busiest = [...nsRecs].sort((a, b) => num(b.running) + num(b.notRunning) - num(a.running) - num(a.notRunning))[0];
    const namespaces: ObsNamespace[] = nsRecs
      .map((r) => {
        const name = str(r["k8s.namespace.name"]);
        const role = r === busiest ? "Booking platform (mapped)" : NS_ROLES.find(([re]) => re.test(name))?.[1] ?? "Supporting services";
        return { cluster: str(r["k8s.cluster.name"]), namespace: name, role, running: num(r.running), notRunning: num(r.notRunning) };
      })
      .sort((a, b) => b.running + b.notRunning - (a.running + a.notRunning));

    const workloadIssues: ObsWorkloadIssue[] = recs(wl.data).map((r) => ({
      cluster: str(r["k8s.cluster.name"]),
      namespace: str(r["k8s.namespace.name"]),
      workload: str(r["k8s.workload.name"]) || "(unnamed)",
      phase: str(r.pod_phase),
      pods: num(r.v),
    }));

    const lt = recs(logTs.data)[0];
    const tf = lt?.timeframe as { start?: string } | undefined;
    const start = tf?.start ? new Date(tf.start).getTime() : Date.now() - 24 * 3600000;
    const errs = arr(lt?.err);
    const warns = arr(lt?.warn);
    const logTrend = errs.map((e, i) => ({ ts: start + i * 3600000, err: e, warn: warns[i] ?? 0 }));
    // The final bucket is the current, partial hour — drop it so "last hour" compares like with like.
    if (logTrend.length > 1) logTrend.pop();

    const logSources: ObsLogSource[] = recs(logTop.data).map((r) => ({
      process: str(r["dt.process.name"]) || "(unknown process)",
      namespace: str(r["k8s.namespace.name"]) || undefined,
      count: num(r.c),
      sample: str(r.sample).replace(/\s+/g, " ").slice(0, 220),
    }));

    const rpm = revPerMin(cinema);
    const mttrList: ObsMttr[] = recs(mttr.data).map((r) => {
      const category = str(r["event.category"]) || "OTHER";
      const m = num(r.mttr);
      return {
        category,
        count: num(r.n),
        mttrMin: m,
        medianMin: num(r.p50),
        // Median, not mean: one multi-day outage shouldn't define the typical incident cost.
        costPerIncident: num(r.p50) * rpm * (CATEGORY_IMPACT[category] ?? 0.05),
      };
    });

    const base: Omit<ObsModel, "impact"> = {
      sources: {
        services: "live",
        infra: hostList.length ? "live" : "demo",
        k8s: namespaces.length ? "live" : "demo",
        logs: logTrend.length ? "live" : "demo",
        problems: mttrList.length ? "live" : "demo",
        rum: "demo",
        synthetic: "demo",
      },
      services,
      hosts: hostList,
      namespaces,
      workloadIssues,
      logSources,
      logTrend,
      logQuery: LOG_QUERY,
      mttr: mttrList,
      vitals: demoVitals(),
      synthetic: demoSynthetic(),
    };
    // Fill any empty live dataset from demo so every panel still tells the story.
    const demo = buildDemoObs(cinema);
    if (!base.hosts.length) base.hosts = demo.hosts;
    if (!base.namespaces.length) {
      base.namespaces = demo.namespaces;
      base.workloadIssues = demo.workloadIssues;
    }
    if (!base.logTrend.length) {
      base.logTrend = demo.logTrend;
      base.logSources = demo.logSources;
    }
    if (!base.mttr.length) base.mttr = demo.mttr;
    return { ...base, impact: buildImpact(base, cinema) };
  }, [enabled, svc.data, slo.data, hosts.data, ns.data, wl.data, logTs.data, logTop.data, mttr.data, cinema]);

  return { obs, loading, error };
}
