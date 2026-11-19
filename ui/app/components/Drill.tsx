import React from "react";
import { getAppLink, getIntentLink, openApp, sendIntent } from "@dynatrace-sdk/navigation";
import type { IntentPayload } from "@dynatrace-sdk/navigation";
import { getEnvironmentUrl } from "@dynatrace-sdk/app-environment";
import { brand } from "../theme";

/**
 * A drilldown target into a standard Dynatrace app.
 * - With `intent` + `payload`: opens the app in context (e.g. one specific problem, host or service).
 * - Without: opens the app's landing page (used in demo mode where entity IDs are synthetic).
 */
export interface DrillTarget {
  app: string;
  label: string;
  intent?: string;
  payload?: IntentPayload;
}

export const APPS = {
  problems: "dynatrace.davis.problems",
  services: "dynatrace.services",
  infra: "dynatrace.infraops",
  kubernetes: "dynatrace.kubernetes",
  logs: "dynatrace.logs",
  notebooks: "dynatrace.notebooks",
  slo: "dynatrace.service.level.objectives",
  synthetic: "dynatrace.synthetic",
  vitals: "dynatrace.experience.vitals",
  traces: "dynatrace.distributedtracing",
} as const;

export const drill = {
  problem: (eventId?: string): DrillTarget =>
    eventId
      ? { app: APPS.problems, label: "Problems", intent: "view-problem", payload: { "event.id": eventId, "event.kind": "DAVIS_PROBLEM" } }
      : { app: APPS.problems, label: "Problems" },
  service: (id?: string): DrillTarget =>
    id
      ? { app: APPS.services, label: "Services", intent: "view-entity-dt.entity.service", payload: { meId: id } }
      : { app: APPS.services, label: "Services" },
  host: (id?: string): DrillTarget =>
    id ? { app: APPS.infra, label: "Infrastructure", intent: "view_host", payload: { meId: id } } : { app: APPS.infra, label: "Infrastructure" },
  k8s: (cluster?: string, namespace?: string, workload?: string): DrillTarget =>
    cluster
      ? {
          app: APPS.kubernetes,
          label: "Kubernetes",
          intent: "view-entity-list-by-dimension",
          payload: {
            "k8s.cluster.name": cluster,
            ...(namespace ? { "k8s.namespace.name": namespace } : {}),
            ...(workload ? { "k8s.workload.name": workload } : {}),
          },
        }
      : { app: APPS.kubernetes, label: "Kubernetes" },
  logs: (query?: string): DrillTarget =>
    query ? { app: APPS.logs, label: "Logs", intent: "view_query", payload: { "dt.query": query } } : { app: APPS.logs, label: "Logs" },
  notebook: (query: string): DrillTarget => ({
    app: APPS.notebooks,
    label: "Notebook",
    intent: "view-query",
    payload: { "dt.query": query },
  }),
  slo: (): DrillTarget => ({ app: APPS.slo, label: "SLOs" }),
  synthetic: (): DrillTarget => ({ app: APPS.synthetic, label: "Synthetic" }),
  vitals: (): DrillTarget => ({ app: APPS.vitals, label: "Experience Vitals" }),
};

/** Platform URL built by hand, used when the SDK can't resolve one (e.g. outside the Dynatrace shell). */
function manualHref(t: DrillTarget): string | undefined {
  let base: string;
  try {
    base = getEnvironmentUrl().replace(/\/$/, "");
  } catch {
    return undefined;
  }
  if (!base) return undefined;
  return t.intent && t.payload
    ? `${base}/ui/intent/${t.app}/${t.intent}#${encodeURIComponent(JSON.stringify(t.payload))}`
    : `${base}/ui/apps/${t.app}`;
}

function hrefFor(t: DrillTarget): string | undefined {
  try {
    const link = t.intent && t.payload ? getIntentLink(t.payload, t.app, t.intent) : getAppLink(t.app);
    if (link && !/^https:\/\/(www\.)?dynatrace\.com\/?$/.test(link)) return link;
  } catch {
    /* fall through */
  }
  return manualHref(t);
}

function go(t: DrillTarget) {
  try {
    if (t.intent && t.payload) sendIntent(t.payload, { recommendedAppId: t.app, recommendedIntentId: t.intent });
    else openApp(t.app);
  } catch {
    /* outside the Dynatrace shell (e.g. local preview) – nothing to navigate to */
  }
}

/** Small "Open in <App> ↗" link. */
export function DrillLink({ target, label, compact }: { target: DrillTarget; label?: string; compact?: boolean }) {
  const text = label ?? `Open in ${target.label}`;
  return (
    <a
      href={hrefFor(target)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        go(target);
      }}
      title={`${text} — opens the Dynatrace ${target.label} app${target.intent ? " in context" : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: compact ? 11 : 12,
        fontWeight: 600,
        color: brand.info,
        textDecoration: "none",
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
    >
      {text} <span aria-hidden>↗</span>
    </a>
  );
}
