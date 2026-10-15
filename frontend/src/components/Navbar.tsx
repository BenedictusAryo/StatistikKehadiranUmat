import React from 'react';
import { useAuthStore } from '../store/authStore';
import { Church, LogOut, Users, DoorOpen, Calendar } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-xl border-b border-white/[0.08] text-white no-print shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Church Title */}
          <div 
            onClick={() => setCurrentTab('events')} 
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-center p-1 shadow-inner group-hover:border-amber-400/60 group-hover:scale-[1.03] group-hover:shadow-glow-gold transition-spring overflow-hidden">
              <img 
                src="/logo-paroki.png" 
                alt="Logo Paroki Bintaro" 
                className="w-full h-full object-contain filter drop-shadow transition-transform group-hover:scale-105" 
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-semibold text-sm sm:text-base tracking-tight leading-none text-slate-100 group-hover:text-white transition-colors">
                  Statistik Kehadiran Umat
                </h1>
                <span className="hidden sm:inline-flex text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-slate-300">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium tracking-tight">
                Paroki Bintaro • Gereja St. Matius Penginjil
              </p>
            </div>
          </div>

          {/* Navigation Links - Apple Segmented Control Aesthetic */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
            <button
              onClick={() => setCurrentTab('events')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-spring ${
                currentTab === 'events'
                  ? 'bg-white/10 text-white shadow-sm border border-white/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Events</span>
            </button>

            {user?.role === 'ADMIN' && (
              <>
                <button
                  onClick={() => setCurrentTab('master-pos')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-spring ${
                    currentTab === 'master-pos'
                      ? 'bg-white/10 text-white shadow-sm border border-white/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                  }`}
                >
                  <DoorOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Master Pintu</span>
                </button>

                <button
                  onClick={() => setCurrentTab('users')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-spring ${
                    currentTab === 'users'
                      ? 'bg-white/10 text-white shadow-sm border border-white/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Pengguna</span>
                </button>
              </>
            )}

            {/* User Pill & Logout */}
            <div className="flex items-center pl-2 ml-1 border-l border-white/10 space-x-2">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-medium text-slate-200 leading-tight">
                  {user?.full_name}
                </span>
                <span className={`text-[9px] uppercase tracking-wider font-mono font-semibold px-1.5 py-0.2 rounded-full border ${
                  user?.role === 'ADMIN'
                    ? 'bg-blue-950/70 text-blue-300 border-blue-500/30'
                    : 'bg-amber-950/70 text-amber-300 border-amber-500/30'
                }`}>
                  {user?.role === 'ADMIN' ? 'TIM IT (ADMIN)' : 'LITBANG'}
                </span>
              </div>
              <button
                onClick={logout}
                title="Keluar / Logout"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/[0.06] rounded-lg transition-spring active:scale-95"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
