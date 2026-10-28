import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ResearchProvider } from './context/ResearchContext';
import { Layout } from './components/Layout';
import { MapTab } from './tabs/MapTab';
import { RankingsTab } from './tabs/RankingsTab';
import { HydrologyTab } from './tabs/HydrologyTab';
import { SimulatorTab } from './tabs/SimulatorTab';

export function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <AuthProvider>
      <ResearchProvider>
        <BrowserRouter>
          <Routes>
            <Route
              element={<Layout onRefresh={handleRefresh} isRefreshing={isRefreshing} />}
            >
              <Route path="/" element={<Navigate to="/map" replace />} />
              <Route path="/map" element={<MapTab key={`map-${refreshKey}`} />} />
              <Route path="/rankings" element={<RankingsTab key={`rankings-${refreshKey}`} />} />
              <Route path="/hydrology" element={<HydrologyTab key={`hydrology-${refreshKey}`} />} />
              <Route path="/simulator" element={<SimulatorTab key={`simulator-${refreshKey}`} />} />
              <Route path="*" element={<Navigate to="/map" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ResearchProvider>
    </AuthProvider>
  );
}

export default App;
