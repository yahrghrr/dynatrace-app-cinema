import { useMemo } from "react";
import { useDql } from "@dynatrace-sdk/react-hooks";
import type { ResultRecord } from "@dynatrace-sdk/client-query";
import {
  buildCatalogue,
  buildReadiness,
  computeKpis,
  DEMO_DAILY_ADMISSIONS,
  FNB_ORDER_CHANNELS,
  mytHour,
  mytMidnight,
  PAYMENT_MIX,
  rng,
} from "./demo";
import type { Assumptions, Channel, CinemaModel, Health, HourPoint, Incident } from "./types";

/**
 * Cinema business lens over real tenant telemetry.
 *
 * - If the tenant sends `cinema.ticket.purchase` / `cinema.fnb.order` business events, revenue is LIVE.
 * - Otherwise revenue is MODELLED from real monitored transaction volume × business assumptions.
 * - Digital channel health and incidents always come from real services and Davis problems.
 */

/** Slots that the busiest monitored services are mapped onto, in order of request volume. */
const CHANNEL_SLOTS: { id: string; name: string; purpose: string; revShare: number }[] = [
  { id: "booking", name: "Online Booking", purpose: "Web & mobile app ticket checkout", revShare: 0.52 },
  { id: "seatmap", name: "Seat Map & Sessions", purpose: "Showtimes, hall layout, seat locking", revShare: 0.52 },
  { id: "payments", name: "Payments", purpose: "Card · FPX · e-Wallet", revShare: 0.58 },
  { id: "fnb", name: "F&B Mobile Pre-order", purpose: "Order-ahead & in-seat delivery", revShare: 0.11 },
  { id: "loyalty", name: "Loyalty & Rewards", purpose: "Member points, vouchers, birthday treats", revShare: 0.2 },
  { id: "kiosk", name: "Self-service Kiosks", purpose: "In-lobby tickets & F&B", revShare: 0.16 },
];

/** Share of per-minute revenue at risk while a problem of this category is open. */
const CATEGORY_IMPACT: Record<string, number> = {
  AVAILABILITY: 0.6,
  ERROR: 0.3,
  SLOWDOWN: 0.12,
  RESOURCE_CONTENTION: 0.06,
  CUSTOM_ALERT: 0.04,
  INFO: 0,
};

const BUSINESS_IMPACT: Record<string, string> = {
  AVAILABILITY: "Channel unreachable — bookings and orders on this path are being lost.",
  ERROR: "Elevated failures — guests see errors at checkout or ordering.",
  SLOWDOWN: "Slow responses — expect higher abandonment during peak sessions.",
  RESOURCE_CONTENTION: "Capacity pressure — risk of slowdowns as pre-sales surge.",
  CUSTOM_ALERT: "Custom alert — operational signal flagged by the platform team.",
};

const iso = (ms: number) => new Date(ms).toISOString();

const num = (v: unknown): number => (typeof v === "number" ? v : typeof v === "string" ? Number(v) || 0 : 0);
const arr = (v: unknown): number[] => (Array.isArray(v) ? v.map((x) => num(x)) : []);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

export interface LiveState {
  model?: CinemaModel;
  isLoading: boolean;
  error?: string;
  /** True if the tenant has no service traffic at all, so live mode can't say anything meaningful. */
  empty: boolean;
}

export function useLiveModel(assumptions: Assumptions, enabled: boolean, now: number): LiveState {
  // Recompute day boundaries only when the Malaysian day changes, so queries stay cache-stable.
  const midnight = mytMidnight(now);
  const opts = { enabled, refetchInterval: 60000, staleTime: 30000 };

  const services = useDql(
    `timeseries {req=sum(dt.service.request.count), fail=sum(dt.service.request.failure_count), rt=avg(dt.service.request.response_time)}, by:{dt.entity.service}, from:-2h, interval:10m
| fieldsAdd name=entityName(dt.entity.service), total=arraySum(req), fails=arraySum(fail), rtavg=arrayAvg(rt)
| sort total desc
| limit 6`,
    opts,
  );

  const today = useDql(
    `timeseries {req=sum(dt.service.request.count), fail=sum(dt.service.request.failure_count)}, from:"${iso(midnight)}", interval:1h`,
    opts,
  );

  const lastWeek = useDql(
    `timeseries req=sum(dt.service.request.count), from:"${iso(midnight - 7 * 86400000)}", to:"${iso(midnight - 6 * 86400000)}", interval:1h`,
    opts,
  );

  const problems = useDql(
    `fetch dt.davis.problems, from:-24h
| filter not(dt.davis.is_duplicate)
| summarize {name=takeLast(event.name), status=takeLast(event.status), category=takeLast(event.category), start=takeLast(event.start), end=takeLast(event.end), affected=takeLast(affected_entity_ids), rootCause=takeLast(root_cause_entity_name), eventId=takeLast(event.id)}, by:{display_id}
| sort start desc
| limit 25`,
    opts,
  );

  const biz = useDql(
    `fetch bizevents, from:"${iso(midnight)}"
| filter in(event.type, {"cinema.ticket.purchase", "cinema.fnb.order"})
| summarize amount=sum(toDouble(amount)), qty=sum(toDouble(quantity)), by:{hour=bin(timestamp, 1h), event.type}`,
    opts,
  );

  const all = [services, today, lastWeek, problems, biz];
  const isLoading = enabled && all.some((q) => q.isLoading && !q.data);
  const err = all.find((q) => q.error)?.error;

  const model = useMemo<CinemaModel | undefined>(() => {
    if (!enabled || !services.data || !today.data) return undefined;
    const a = assumptions;
    const svcRecs: ResultRecord[] = (services.data.records ?? []).filter((r): r is ResultRecord => !!r);
    const todayRec = today.data.records?.[0] ?? undefined;
    const lwRec = lastWeek.data?.records?.[0] ?? undefined;
    const bizRecs = (biz.data?.records ?? []).filter((r): r is ResultRecord => !!r);
    const hasBiz = bizRecs.length > 0;

    const curHour = mytHour(now);
    const revPerAdm = a.avgTicketPrice + a.fnbSpendPerHead;

    // ---- Hourly revenue -------------------------------------------------
    const todayReq = arr(todayRec?.req);
    const lwReq = arr(lwRec?.req);
    const bizByHour = new Map<number, { ticket: number; fnb: number }>();
    for (const r of bizRecs) {
      const ts = new Date(str(r.hour)).getTime();
      const cur = bizByHour.get(ts) ?? { ticket: 0, fnb: 0 };
      if (str(r["event.type"]) === "cinema.ticket.purchase") cur.ticket += num(r.amount);
      else cur.fnb += num(r.amount);
      bizByHour.set(ts, cur);
    }

    const lwRevenue = (h: number) => (lwReq[h] ?? 0) * a.admissionsPerRequest * revPerAdm;
    let actualToDate = 0;
    let lwToDate = 0;
    const hourly: HourPoint[] = Array.from({ length: 24 }, (_, h) => {
      const ts = midnight + h * 3600000;
      const forecast = h > curHour;
      let ticket = 0;
      let fnb = 0;
      if (!forecast) {
        if (hasBiz) {
          const b = bizByHour.get(ts);
          ticket = b?.ticket ?? 0;
          fnb = b?.fnb ?? 0;
        } else {
          const adm = (todayReq[h] ?? 0) * a.admissionsPerRequest;
          ticket = adm * a.avgTicketPrice;
          fnb = adm * a.fnbSpendPerHead;
        }
        actualToDate += ticket + fnb;
        lwToDate += lwRevenue(h);
      }
      return { ts, ticket, fnb, lastWeek: lwRevenue(h), forecast };
    });
    // Forecast remaining hours from last week's shape × today's run-rate vs last week.
    const runRate = lwToDate > 0 ? actualToDate / lwToDate : 1;
    const ticketShare = a.avgTicketPrice / revPerAdm;
    for (const p of hourly) {
      if (!p.forecast) continue;
      const f = p.lastWeek * runRate;
      p.ticket = f * ticketShare;
      p.fnb = f * (1 - ticketShare);
    }

    // ---- Channels from the busiest real services --------------------------
    const lastFullHour = hourly[Math.max(0, curHour - 1)];
    const revPerHour = Math.max(lastFullHour.ticket + lastFullHour.fnb, (hourly[curHour].ticket + hourly[curHour].fnb) || 0);
    const serviceIdToChannel = new Map<string, string>();
    const channels: Channel[] = svcRecs.map((r, i) => {
      const slot = CHANNEL_SLOTS[i % CHANNEL_SLOTS.length];
      const total = num(r.total);
      const fails = num(r.fails);
      const successRate = total > 0 ? 1 - fails / total : 1;
      const responseMs = num(r.rtavg) / 1000;
      const health: Health =
        successRate < 0.95 || responseMs > 3000 ? "critical" : successRate < 0.99 || responseMs > 1000 ? "degraded" : "healthy";
      serviceIdToChannel.set(str(r["dt.entity.service"]), slot.name);
      return {
        id: slot.id,
        name: slot.name,
        purpose: slot.purpose,
        backedBy: str(r.name) || str(r["dt.entity.service"]),
        entityId: str(r["dt.entity.service"]),
        txPerMin: total / 120,
        successRate,
        responseMs,
        health,
        revenuePerHour: revPerHour * slot.revShare,
        spark: arr(r.req),
      };
    });

    // ---- Incidents from Davis problems -----------------------------------
    const revPerMin = Math.max(revPerHour, 1) / 60;
    const incidents: Incident[] = (problems.data?.records ?? [])
      .filter((r): r is ResultRecord => !!r)
      .map((r) => {
        const start = new Date(str(r.start)).getTime();
        const endRaw = str(r.end);
        const status = str(r.status) === "ACTIVE" ? "ACTIVE" : "CLOSED";
        const end = status === "CLOSED" && endRaw ? new Date(endRaw).getTime() : undefined;
        const durationMin = Math.max(1, ((end ?? now) - start) / 60000);
        const category = str(r.category) || "INFO";
        const affected = Array.isArray(r.affected) ? r.affected.map(String) : [];
        const mapped = affected.map((id) => serviceIdToChannel.get(id)).find(Boolean);
        const impact = (CATEGORY_IMPACT[category] ?? 0.05) * (mapped ? 1 : 0.25);
        return {
          id: str(r.display_id),
          eventId: str(r.eventId) || undefined,
          title: str(r.name),
          status,
          category,
          start,
          end,
          channel: mapped ?? (str(r.rootCause) ? `Platform · ${str(r.rootCause)}` : "Platform / infrastructure"),
          durationMin,
          revenueAtRisk: durationMin * revPerMin * impact,
          businessImpact: BUSINESS_IMPACT[category] ?? "Operational signal — no direct guest impact detected.",
        } satisfies Incident;
      })
      .sort((x, y) => (x.status === y.status ? y.start - x.start : x.status === "ACTIVE" ? -1 : 1));

    const revenueAtRisk = incidents.reduce((s, i) => s + i.revenueAtRisk, 0);
    const totReq = svcRecs.reduce((s, r) => s + num(r.total), 0);
    const totFail = svcRecs.reduce((s, r) => s + num(r.fails), 0);
    const bookingSuccess = totReq > 0 ? 1 - totFail / totReq : 1;

    const kpis = computeKpis(hourly, a, revenueAtRisk, bookingSuccess, 0.66);
    if (hasBiz) {
      const qty = bizRecs
        .filter((r) => str(r["event.type"]) === "cinema.ticket.purchase")
        .reduce((s, r) => s + num(r.qty), 0);
      if (qty > 0) {
        kpis.admissions = qty;
        kpis.spendPerHead = kpis.fnbRevenue / qty;
      }
    }

    // ---- Merchandising view scaled to live volume (modelled) ---------------
    const projectedDaily = hourly.reduce((s, h) => s + h.ticket + h.fnb, 0) / revPerAdm;
    const jitterSrc = rng(Math.floor(midnight / 86400000));
    const cat = buildCatalogue(
      { now, assumptions: a, dailyAdmissions: projectedDaily || DEMO_DAILY_ADMISSIONS },
      kpis.admissions,
      jitterSrc,
    );

    // Readiness: compare the busiest real 10-minute window against an opening-night multiple.
    const peakPerMin = Math.max(0, ...svcRecs.flatMap((r) => arr(r.req))) / 10;
    const readiness = buildReadiness(1);
    readiness.currentPeakTpm = Math.round(peakPerMin);
    readiness.expectedPeakTpm = Math.round(peakPerMin * 2.1);
    readiness.testedCapacityTpm = Math.round(peakPerMin * 1.55);

    return {
      mode: "live",
      asOf: now,
      sources: {
        revenue: hasBiz ? "live" : "modelled",
        tech: "live",
        merchandising: "modelled",
        note: hasBiz
          ? "Revenue from cinema business events; channel health and incidents from live services and Davis."
          : `Channel health and incidents are live from your tenant. Revenue is modelled from ${Math.round(
              totReq / 120,
            ).toLocaleString()} monitored transactions/min × business assumptions — send cinema business events to make it exact.`,
      },
      kpis,
      hourly,
      channels,
      incidents,
      films: cat.films,
      sites: cat.sites,
      fnbItems: cat.fnbItems,
      fnbOrderChannels: FNB_ORDER_CHANNELS,
      paymentMix: PAYMENT_MIX,
      readiness,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, services.data, today.data, lastWeek.data, problems.data, biz.data, assumptions, Math.floor(now / 60000)]);

  const empty = !!services.data && (services.data.records ?? []).length === 0;
  return { model, isLoading, error: err ? err.message : undefined, empty };
}
