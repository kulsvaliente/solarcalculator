import React from "react";
import MapComponent from "./components/MapComponent";
import { SolarConstantsProvider } from "./context/solarConstantsContext";
import { ConversationProvider } from "./context/ConversationContext";
import { useCalculatorUI } from "./context/CalculatorUIContext";

export default function CalculatorPage() {
  const { drawerOpen } = useCalculatorUI() || {};

  return (
    <SolarConstantsProvider>
      <ConversationProvider>
        {/* Top bar is hidden while the drawer is open (see PublicAppbar), so the map
            reclaims the space it would otherwise leave behind. */}
        <div style={{ height: drawerOpen ? "100vh" : "calc(100vh - 64px)", width: "100vw" }}>
          <MapComponent />
        </div>
      </ConversationProvider>
    </SolarConstantsProvider>
  );
}
