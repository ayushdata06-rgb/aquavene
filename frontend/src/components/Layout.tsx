import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { ContextPanel } from './ContextPanel';
import { OnboardingModal } from './OnboardingModal';
import { ErrorBoundary } from './ErrorBoundary';

export const Layout: React.FC = () => {
  const location = useLocation();
  const isMapTab = location.pathname === '/map' || location.pathname === '/';
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  return (
    <div className="h-screen bg-hydro-surface flex flex-col font-sans overflow-hidden text-slate-100 select-none">
      {/* Top Bar (h-14) */}
      <Navbar />

      <OnboardingModal />

      {/* Main 3-Panel Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (w-60) */}
        <Sidebar />

        {/* Center Main Stage (flex-1) */}
        <main
          className={`flex-1 relative bg-hydro-surface flex flex-col min-h-0 ${
            isMapTab ? 'p-0 overflow-hidden' : 'overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin'
          }`}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>

        {/* Right Intelligence Context Panel (w-80, toggleable) */}
        <ContextPanel
          isOpen={rightPanelOpen}
          onToggle={() => setRightPanelOpen(!rightPanelOpen)}
        />
      </div>

      {/* Fixed Bottom Status Bar */}
      <StatusBar />
    </div>
  );
};
