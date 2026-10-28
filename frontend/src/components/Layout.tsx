import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ActiveAreaBar } from './ActiveAreaBar';
import { OnboardingModal } from './OnboardingModal';

export const Layout: React.FC<{ onRefresh?: () => void; isRefreshing?: boolean }> = ({
  onRefresh,
  isRefreshing,
}) => {
  const location = useLocation();
  const isMapTab = location.pathname === '/map';

  return (
    <div className="h-screen bg-slate-950 flex flex-col font-sans overflow-hidden">
      <Navbar onRefresh={onRefresh} isRefreshing={isRefreshing} />
      <ActiveAreaBar />
      <OnboardingModal />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main
          className={`flex-1 bg-slate-950 relative ${
            isMapTab
              ? 'p-0 overflow-hidden flex flex-col'
              : 'overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
