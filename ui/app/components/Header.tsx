import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppHeader } from "@dynatrace/strato-components/layouts";
import { ToggleButtonGroup } from "@dynatrace/strato-components/forms";
import { SettingIcon } from "@dynatrace/strato-icons";
import { useCinema } from "../data/CinemaData";
import type { Mode } from "../data/types";
import { SettingsPanel } from "./SettingsPanel";

const NAV = [
  { to: "/", label: "Executive Overview" },
  { to: "/blockbusters", label: "Blockbuster Watch" },
  { to: "/concessions", label: "Food & Beverage" },
  { to: "/channels", label: "Digital Channels" },
  { to: "/observability", label: "Observability" },
  { to: "/data", label: "Data & Method" },
];

export const Header = () => {
  const { pathname } = useLocation();
  const { mode, setMode } = useCinema();
  const [open, setOpen] = useState(false);
  return (
    <>
      <AppHeader>
        <AppHeader.Navigation>
          <AppHeader.Logo as={Link} to="/" appName="Box Office Command" />
          {NAV.map((n) => (
            <AppHeader.NavigationItem key={n.to} as={Link} to={n.to} isSelected={pathname === n.to}>
              {n.label}
            </AppHeader.NavigationItem>
          ))}
        </AppHeader.Navigation>
        <AppHeader.ActionItems>
          <ToggleButtonGroup value={mode} onChange={(v: string) => setMode(v as Mode)}>
            <ToggleButtonGroup.Item value="live" tooltip="Your tenant's live telemetry through a cinema lens">
              Live
            </ToggleButtonGroup.Item>
            <ToggleButtonGroup.Item value="demo" tooltip="Synthetic Malaysian cinema chain">
              Demo
            </ToggleButtonGroup.Item>
          </ToggleButtonGroup>
          <AppHeader.ActionButton prefixIcon={<SettingIcon />} onClick={() => setOpen(true)} showLabel={false}>
            Business assumptions
          </AppHeader.ActionButton>
        </AppHeader.ActionItems>
      </AppHeader>
      {open && <SettingsPanel onClose={() => setOpen(false)} />}
    </>
  );
};
