import React from "react";
import {
  ClockIcon,
  ContainerIcon,
  CriticalIcon,
  DatabaseIcon,
  AiIcon,
  EventIcon,
  HostsIcon,
  LogsIcon,
  MoneyIcon,
  ServiceLevelObjectivesIcon,
  ServicesIcon,
  SyntheticMonitoringSignetIcon,
  UnavailableIcon,
  UserSessionsIcon,
  WarningIcon,
} from "@dynatrace/strato-icons";
import { brand } from "../theme";

/* ------------------------------------------------------------------ */
/* Custom cinema icons (Strato has no popcorn, ticket or seat glyphs)   */
/* All are 24×24, stroke = currentColor, so they behave like Strato.   */
/* ------------------------------------------------------------------ */

type P = { size?: number; style?: React.CSSProperties };
const Svg = ({ size = 20, style, children }: P & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flex: "none", ...style }}
    aria-hidden
  >
    {children}
  </svg>
);

export const PopcornIcon = (p: P) => (
  <Svg {...p}>
    <path d="M5 9h14l-1.6 11.2a1 1 0 0 1-1 .8H7.6a1 1 0 0 1-1-.8L5 9Z" />
    <path d="M9.5 9 10 21M14.5 9 14 21" />
    <path d="M6 9a2.2 2.2 0 0 1 1.6-3.6A2.6 2.6 0 0 1 12 4a2.6 2.6 0 0 1 4.4 1.4A2.2 2.2 0 0 1 18 9" />
  </Svg>
);

export const TicketIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-1a2 2 0 0 1 0-4 2 2 0 0 1 0-4V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v1Z" />
    <path d="M14 6v2M14 11v2M14 16v2" />
  </Svg>
);

export const SeatIcon = (p: P) => (
  <Svg {...p}>
    <path d="M6 12V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" />
    <path d="M4 11h3v4h10v-4h3v6H4v-6Z" />
    <path d="M6 17v3M18 17v3" />
  </Svg>
);

export const CardIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="M3 10h18M7 15h4" />
  </Svg>
);

export const KioskIcon = (p: P) => (
  <Svg {...p}>
    <rect x="6" y="3" width="12" height="12" rx="1.5" />
    <path d="M9 18h6l1 3H8l1-3ZM12 15v3M9 7h6M9 10h4" />
  </Svg>
);

export const StarIcon = (p: P) => (
  <Svg {...p}>
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
  </Svg>
);

export const DrinkIcon = (p: P) => (
  <Svg {...p}>
    <path d="M6 7h12l-1.4 13a1 1 0 0 1-1 .9H8.4a1 1 0 0 1-1-.9L6 7Z" />
    <path d="M5 7h14M13 7l2-4h3" />
  </Svg>
);

export const HotdogIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 14c0 3 3.6 5 8 5s8-2 8-5" />
    <path d="M5.5 12.5c-1.5-1.5-.5-4 1.5-3.5 2 .5 7.5.5 10 0 2-.5 3 2 1.5 3.5" />
    <path d="M8 11c1.2-.8 2.4.8 3.6 0s2.4.8 3.6 0" />
  </Svg>
);

export const CandyIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M8.5 10 4 7.5v9L8.5 14M15.5 10 20 7.5v9L15.5 14" />
  </Svg>
);

export const FilmIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 4v16M17 4v16M3 8h4M3 12h4M3 16h4M17 8h4M17 12h4M17 16h4" />
  </Svg>
);

export const MegaphoneIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 10v4h3l7 4V6L7 10H4Z" />
    <path d="M17.5 9a4 4 0 0 1 0 6M7 14l1 5h2.5l-1-4.4" />
  </Svg>
);

export const RocketIcon = (p: P) => (
  <Svg {...p}>
    <path d="M14 4c3.5-1 6 0 6 0s1 2.5 0 6l-6 6-6-6 6-6Z" />
    <circle cx="15.5" cy="8.5" r="1.5" />
    <path d="M8 10H5l-2 3 4 1M14 16v3l-3 2-1-4M6.5 17.5 4 20" />
  </Svg>
);

export const TrendUpIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3 17 9 11l4 4 8-8" />
    <path d="M15 7h6v6" />
  </Svg>
);

export const ShieldCheckIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

export const GaugeIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 17a8 8 0 1 1 16 0" />
    <path d="m12 17 4-5" />
    <circle cx="12" cy="17" r="1.2" />
  </Svg>
);

/* ------------------------------------------------------------------ */
/* Icon badge: tinted rounded square with a soft glow                  */
/* ------------------------------------------------------------------ */

export function IconBadge({
  icon,
  color = brand.red,
  size = 36,
  solid,
}: {
  icon: React.ReactNode;
  color?: string;
  size?: number;
  solid?: boolean;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        display: "inline-grid",
        placeItems: "center",
        flex: "none",
        color: solid ? "#fff" : color,
        background: solid ? `linear-gradient(135deg, ${color}, ${color}AA)` : `${color}1F`,
        border: `1px solid ${color}40`,
        boxShadow: solid ? `0 6px 20px ${color}55` : `0 0 18px ${color}22`,
      }}
    >
      {icon}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Semantic icon lookups                                               */
/* ------------------------------------------------------------------ */

export function channelIcon(id: string, size = 18): React.ReactNode {
  switch (id) {
    case "booking":
      return <TicketIcon size={size} />;
    case "seatmap":
      return <SeatIcon size={size} />;
    case "payments":
      return <CardIcon size={size} />;
    case "fnb":
      return <PopcornIcon size={size} />;
    case "loyalty":
      return <StarIcon size={size} />;
    case "kiosk":
      return <KioskIcon size={size} />;
    default:
      return <ServicesIcon size={size} />;
  }
}

export function categoryIcon(category: string, size = 16): React.ReactNode {
  switch (category) {
    case "AVAILABILITY":
      return <UnavailableIcon size={size} />;
    case "ERROR":
      return <CriticalIcon size={size} />;
    case "SLOWDOWN":
      return <ClockIcon size={size} />;
    case "RESOURCE_CONTENTION":
      return <HostsIcon size={size} />;
    default:
      return <EventIcon size={size} />;
  }
}

export function fnbIcon(category: string, size = 16): React.ReactNode {
  switch (category) {
    case "Popcorn":
    case "Combos":
      return <PopcornIcon size={size} />;
    case "Drinks":
      return <DrinkIcon size={size} />;
    case "Hot food":
      return <HotdogIcon size={size} />;
    case "Collectibles":
      return <StarIcon size={size} />;
    default:
      return <CandyIcon size={size} />;
  }
}

/** Icons for the business KPIs on the Observability impact map. */
export function kpiIcon(kpi: string, size = 16): React.ReactNode {
  if (kpi.startsWith("Ticket")) return <TicketIcon size={size} />;
  if (kpi.startsWith("Payment")) return <CardIcon size={size} />;
  if (kpi.startsWith("F&B")) return <PopcornIcon size={size} />;
  if (kpi.startsWith("Opening")) return <ContainerIcon size={size} />;
  if (kpi.startsWith("Platform")) return <HostsIcon size={size} />;
  if (kpi.startsWith("Cost")) return <MoneyIcon size={size} />;
  if (kpi.startsWith("Early")) return <LogsIcon size={size} />;
  if (kpi.startsWith("Online")) return <UserSessionsIcon size={size} />;
  if (kpi.startsWith("Booking")) return <SyntheticMonitoringSignetIcon size={size} />;
  return <WarningIcon size={size} />;
}

export const obsTabIcon: Record<string, React.ReactNode> = {
  services: <ServiceLevelObjectivesIcon size={16} />,
  infra: <HostsIcon size={16} />,
  logs: <LogsIcon size={16} />,
  problems: <AiIcon size={16} />,
  rum: <UserSessionsIcon size={16} />,
  synthetic: <SyntheticMonitoringSignetIcon size={16} />,
};

export { DatabaseIcon };
