import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ResearchProvider } from './context/ResearchContext';
import { Layout } from './components/Layout';
import { MapTab } from './tabs/MapTab';
import { HistoryTab } from './tabs/HistoryTab';
import { TerrainHealthTab } from './tabs/TerrainHealthTab';
import { ReforestationTab } from './tabs/ReforestationTab';
import { StreamsWetlandsTab } from './tabs/StreamsWetlandsTab';
import { FarmsRoadsTab } from './tabs/FarmsRoadsTab';
import { SimulatorTab } from './tabs/SimulatorTab';
import { PlanBudgetTab } from './tabs/PlanBudgetTab';
import { AdminTab } from './tabs/AdminTab';
import { RankingsTab } from './tabs/RankingsTab';
import { HydrologyTab } from './tabs/HydrologyTab';
import { AuthTab } from './tabs/AuthTab';

export function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AuthProvider>
      <ResearchProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/map" replace />} />
              <Route path="/map" element={<MapTab key={`map-${refreshKey}`} />} />
              <Route path="/auth" element={<AuthTab key={`auth-${refreshKey}`} />} />
              <Route path="/history" element={<HistoryTab key={`history-${refreshKey}`} />} />
              <Route path="/terrain" element={<TerrainHealthTab key={`terrain-${refreshKey}`} />} />
              <Route path="/reforest" element={<ReforestationTab key={`reforest-${refreshKey}`} />} />
              <Route path="/streams" element={<StreamsWetlandsTab key={`streams-${refreshKey}`} />} />
              <Route path="/farms" element={<FarmsRoadsTab key={`farms-${refreshKey}`} />} />
              <Route path="/land-roads" element={<FarmsRoadsTab key={`land-roads-${refreshKey}`} />} />
              <Route path="/simulator" element={<SimulatorTab key={`simulator-${refreshKey}`} />} />
              <Route path="/budget" element={<PlanBudgetTab key={`budget-${refreshKey}`} />} />
              <Route path="/plan" element={<PlanBudgetTab key={`plan-${refreshKey}`} />} />
              <Route path="/admin" element={<AdminTab key={`admin-${refreshKey}`} />} />

              {/* Legacy aliases */}
              <Route path="/rankings" element={<RankingsTab key={`rankings-${refreshKey}`} />} />
              <Route path="/hydrology" element={<HydrologyTab key={`hydrology-${refreshKey}`} />} />

              <Route path="*" element={<Navigate to="/map" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ResearchProvider>
    </AuthProvider>
  );
}

export default App;
