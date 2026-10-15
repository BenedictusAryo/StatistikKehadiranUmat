import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { EventDetailDashboard } from './pages/EventDetailDashboard';
import { MasterPosPage } from './pages/MasterPosPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { ReportPrintView } from './pages/ReportPrintView';
import { KioskPage } from './pages/KioskPage';
import { VideotronPage } from './pages/VideotronPage';
import { EventSession } from './types';

export const App: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [currentTab, setCurrentTab] = useState<'events' | 'master-pos' | 'users'>('events');
  const [selectedEvent, setSelectedEvent] = useState<EventSession | null>(null);
  const [reportEvent, setReportEvent] = useState<EventSession | null>(null);

  // Parse path for standalone routes: /pos/:token and /videotron/:eventId
  const path = window.location.pathname;

  if (path.startsWith('/pos/')) {
    const token = path.replace('/pos/', '').trim();
    return <KioskPage token={token} />;
  }

  if (path.startsWith('/videotron/')) {
    const eventId = path.replace('/videotron/', '').trim();
    return <VideotronPage eventId={eventId} />;
  }

  // Admin / Litbang authenticated flows
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setCurrentTab('events')} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={(tab: any) => {
          setSelectedEvent(null);
          setReportEvent(null);
          setCurrentTab(tab);
        }} 
      />

      <main className="flex-1">
        {reportEvent ? (
          <ReportPrintView 
            event={reportEvent} 
            onBack={() => setReportEvent(null)} 
          />
        ) : selectedEvent ? (
          <EventDetailDashboard
            event={selectedEvent}
            onBack={() => setSelectedEvent(null)}
            onPrintReport={(ev) => setReportEvent(ev)}
          />
        ) : currentTab === 'events' ? (
          <AdminDashboard
            onSelectEvent={(ev) => setSelectedEvent(ev)}
            onPrintReport={(ev) => setReportEvent(ev)}
          />
        ) : currentTab === 'master-pos' ? (
          <MasterPosPage />
        ) : (
          <UserManagementPage />
        )}
      </main>
    </div>
  );
};
export default App;
