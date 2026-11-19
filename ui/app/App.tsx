import { PageLayout } from "@dynatrace/strato-components/layouts";
import React from "react";
import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { CinemaDataProvider } from "./data/CinemaData";
import { Overview } from "./pages/Overview";
import { Blockbusters } from "./pages/Blockbusters";
import { Concessions } from "./pages/Concessions";
import { Channels } from "./pages/Channels";
import { DataMethod } from "./pages/DataMethod";
import { Observability } from "./pages/Observability";
import { brand, globalCss } from "./theme";

export const App = () => {
  return (
    <CinemaDataProvider>
      <style>{globalCss}</style>
      <PageLayout>
        <PageLayout.Header>
          <Header />
        </PageLayout.Header>
        <PageLayout.Content style={{ padding: 0, background: brand.ink }}>
          <div className="boc">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/blockbusters" element={<Blockbusters />} />
              <Route path="/concessions" element={<Concessions />} />
              <Route path="/channels" element={<Channels />} />
              <Route path="/observability" element={<Observability />} />
              <Route path="/data" element={<DataMethod />} />
            </Routes>
          </div>
        </PageLayout.Content>
      </PageLayout>
    </CinemaDataProvider>
  );
};
