import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { OverviewDashboard } from './tabs/OverviewDashboard';
import { WatershedExplorer } from './tabs/WatershedExplorer';
import { PriorityRankings } from './tabs/PriorityRankings';
import { IndicatorAnalysis } from './tabs/IndicatorAnalysis';
import { RainfallClimate } from './tabs/RainfallClimate';
import { TerrainLandCover } from './tabs/TerrainLandCover';
import { ScenarioSimulator } from './tabs/ScenarioSimulator';
import { DataReports } from './tabs/DataReports';

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
      <BrowserRouter>
        <Routes>
          <Route
            element={<Layout onRefresh={handleRefresh} isRefreshing={isRefreshing} />}
          >
            <Route path="/" element={<OverviewDashboard key={`overview-${refreshKey}`} />} />
            <Route path="/explorer" element={<WatershedExplorer key={`explorer-${refreshKey}`} />} />
            <Route path="/rankings" element={<PriorityRankings key={`rankings-${refreshKey}`} />} />
            <Route path="/indicators" element={<IndicatorAnalysis key={`indicators-${refreshKey}`} />} />
            <Route path="/rainfall" element={<RainfallClimate key={`rainfall-${refreshKey}`} />} />
            <Route path="/terrain" element={<TerrainLandCover key={`terrain-${refreshKey}`} />} />
            <Route path="/scenarios" element={<ScenarioSimulator key={`scenarios-${refreshKey}`} />} />
            <Route path="/reports" element={<DataReports key={`reports-${refreshKey}`} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
