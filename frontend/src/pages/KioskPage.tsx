import React, { useEffect, useState } from 'react';
import { useOfflineQueueStore } from '../store/offlineQueueStore';
import { PosInfo } from '../types';
import { 
  Globe, Wifi, WifiOff, RefreshCw, Maximize2, 
  CheckCircle2, AlertTriangle, Sparkles, MapPin 
} from 'lucide-react';

interface KioskPageProps {
  token: string;
}

export const KioskPage: React.FC<KioskPageProps> = ({ token }) => {
  const [posInfo, setPosInfo] = useState<PosInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tapEffect, setTapEffect] = useState<'PAROKI_BINTARO' | 'LUAR_PAROKI' | null>(null);
  const [, setIsFullscreen] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [successFeedback, setSuccessFeedback] = useState<{
    show: boolean;
    choice: 'PAROKI_BINTARO' | 'LUAR_PAROKI' | null;
  }>({ show: false, choice: null });

  const {
    queue,
    isOnline,
    isSyncing,
    posCounters,
    recordTap,
    syncQueue,
    setOnlineStatus,
  } = useOfflineQueueStore();

  const pendingCount = queue.filter((item) => item.posToken === token).length;
  const currentCounters = posCounters[token] || { total: 0, paroki_bintaro: 0, luar_paroki: 0 };

  // Fetch pos info on initial load
  useEffect(() => {
    let isMounted = true;
    const fetchPos = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/counter/validate/${token}`);
        if (!res.ok) {
          throw new Error('Tautan pos tidak valid atau acara telah berakhir');
        }
        const data = await res.json();
        if (isMounted) {
          setPosInfo(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Gagal memuat data pos');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPos();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Network online/offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true);
      syncQueue(token);
    };
    const handleOffline = () => {
      setOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic heartbeat to retry sync every 6 seconds
    const interval = setInterval(() => {
      if (navigator.onLine && pendingCount > 0 && !isSyncing) {
        syncQueue(token);
      }
    }, 6000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [token, pendingCount, isSyncing, setOnlineStatus, syncQueue]);

  // Handle tap with debouncing & center success feedback
  const handleTouchChoice = (choice: 'PAROKI_BINTARO' | 'LUAR_PAROKI') => {
    if (posInfo?.event_status === 'COMPLETED') return;
    if (isCooldown) return;

    setIsCooldown(true);
    setTapEffect(choice);
    setSuccessFeedback({ show: true, choice });

    // Record tap immediately (<5ms)
    recordTap(token, choice, {
      screen_width: window.innerWidth,
      source: 'kiosk_web',
    });

    // Reset ripple effect
    setTimeout(() => {
      setTapEffect(null);
    }, 250);

    // Keep center success modal visible for 500ms, then reset cooldown for next person
    setTimeout(() => {
      setSuccessFeedback({ show: false, choice: null });
      setIsCooldown(false);
    }, 500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 shadow-elevated">
          <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Menghubungkan ke Pos Masuk...</h2>
        <p className="text-sm text-slate-400 mt-1 font-medium">Gereja St. Matius Penginjil Paroki Bintaro</p>
      </div>
    );
  }

  if (error || !posInfo) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4 shadow-elevated">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-rose-400 tracking-tight">Tautan Pos Tidak Aktif</h2>
        <p className="text-slate-300 mt-2 max-w-md text-sm">{error || 'Pos tidak ditemukan'}</p>
        <p className="text-xs text-slate-500 mt-6">
          Silakan hubungi Tim Litbang / Sekretariat Paroki untuk meminta tautan QR terbaru.
        </p>
      </div>
    );
  }

  const isEventCompleted = posInfo.event_status === 'COMPLETED';

  return (
    <div className="min-h-screen bg-[#090d16] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.12),rgba(0,0,0,0))] text-white flex flex-col justify-between select-none touch-manipulation overflow-hidden">
      {/* Top Header: Event & Pos details + Network status */}
      <header className="bg-slate-950/80 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center shadow-sm flex-shrink-0 p-1.5">
              <img src="/logo-paroki.png" alt="Logo Paroki Bintaro" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                  {posInfo.category || 'Misa'}
                </span>
                <h1 className="text-sm sm:text-base font-bold text-slate-100 line-clamp-1 tracking-tight">
                  {posInfo.event_name}
                </h1>
              </div>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-xs font-medium text-amber-300 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{posInfo.building ? `${posInfo.building} • ` : ''}{posInfo.pos_name}</span>
                </span>
                {isEventCompleted && (
                  <span className="text-[10px] font-semibold text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-500/30">
                    Selesai
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sync & Connectivity Status Indicator */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => syncQueue(token)}
              disabled={isSyncing}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-spring active:scale-95 ${
                pendingCount > 0
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 animate-pulse'
                  : isOnline
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
              }`}
              title="Status Jaringan & Sinkronisasi"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sinkronisasi {pendingCount}...</span>
                </>
              ) : pendingCount > 0 ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="font-mono">{pendingCount} offline</span>
                </>
              ) : isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline font-mono">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-mono">Offline</span>
                </>
              )}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-300 border border-white/10 transition-spring active:scale-95"
              title="Layar Penuh"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Kiosk Area: Survey Prompt & 2 Giant Touch Targets */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {/* Survey Question Banner */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-medium text-slate-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pencatatan Kehadiran Cepat</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Apakah Umat Paroki Bintaro?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium">
            Sentuh salah satu tombol di bawah untuk mencatat kehadiran Anda
          </p>
        </div>

        {/* 2 Big Tactile Touch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 flex-1 max-h-[60vh] min-h-[340px]">
          {/* Card 1: Umat Paroki Bintaro */}
          <button
            onClick={() => handleTouchChoice('PAROKI_BINTARO')}
            disabled={isEventCompleted}
            className={`relative group rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-spring transform active:scale-[0.96] shadow-2xl border-2 ${
              tapEffect === 'PAROKI_BINTARO'
                ? 'bg-blue-500 scale-[0.98] border-white ring-8 ring-blue-400/50'
                : 'bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-900 border-blue-400/50 hover:border-blue-300 shadow-blue-950/60'
            } ${isEventCompleted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-white/15 border border-white/25 flex items-center justify-center mb-4 text-white shadow-inner group-hover:scale-105 transition-spring p-3 sm:p-4">
              <img src="/logo-paroki-white.png" alt="Paroki Bintaro" className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow" />
            </div>
            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-sm">
              Umat Paroki Bintaro
            </span>
            <span className="text-xs sm:text-sm text-blue-100 mt-2.5 font-semibold bg-blue-950/60 px-3.5 py-1.5 rounded-full border border-blue-400/30">
              Gereja St. Matius Penginjil
            </span>

            {/* Ripple visual indicator */}
            {tapEffect === 'PAROKI_BINTARO' && (
              <span className="absolute inset-0 rounded-3xl bg-white/25 animate-ping pointer-events-none" />
            )}
          </button>

          {/* Card 2: Umat Luar Paroki */}
          <button
            onClick={() => handleTouchChoice('LUAR_PAROKI')}
            disabled={isEventCompleted}
            className={`relative group rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-spring transform active:scale-[0.96] shadow-2xl border-2 ${
              tapEffect === 'LUAR_PAROKI'
                ? 'bg-amber-500 scale-[0.98] border-white ring-8 ring-amber-400/50'
                : 'bg-gradient-to-b from-amber-600 via-amber-700 to-amber-950 border-amber-400/50 hover:border-amber-300 shadow-amber-950/60'
            } ${isEventCompleted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-white/15 border border-white/25 flex items-center justify-center mb-4 text-white shadow-inner group-hover:scale-105 transition-spring">
              <Globe className="w-10 h-10 sm:w-16 sm:h-16 text-amber-100" />
            </div>
            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight drop-shadow-sm">
              Umat Luar Paroki
            </span>
            <span className="text-xs sm:text-sm text-amber-100 mt-2.5 font-semibold bg-amber-950/60 px-3.5 py-1.5 rounded-full border border-amber-400/30">
              Tamu / Luar Bintaro
            </span>

            {/* Ripple visual indicator */}
            {tapEffect === 'LUAR_PAROKI' && (
              <span className="absolute inset-0 rounded-3xl bg-white/25 animate-ping pointer-events-none" />
            )}
          </button>
        </div>
      </main>

      {/* Footer: Volunteer quick tally & offline reassurance */}
      <footer className="bg-slate-950/80 backdrop-blur-xl border-t border-white/[0.08] px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-3 sm:space-x-5 font-mono">
            <span className="text-slate-300 font-medium">
              Total Pos: <strong className="text-white text-sm tabular-nums ml-1">{currentCounters.total}</strong>
            </span>
            <span className="text-blue-300">
              Bintaro: <strong className="tabular-nums ml-1">{currentCounters.paroki_bintaro}</strong>
            </span>
            <span className="text-amber-300">
              Luar: <strong className="tabular-nums ml-1">{currentCounters.luar_paroki}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {!isOnline && (
              <span className="text-amber-300 font-semibold bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 rounded-full text-[11px]">
                ⚡ Mode Offline Aktif
              </span>
            )}
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Pencatatan instan & otomatis tersinkron
            </span>
          </div>
        </div>
      </footer>

      {/* Center Success Notification Overlay */}
      {successFeedback.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md pointer-events-none transition-spring">
          <div className="bg-slate-900/95 border-2 border-emerald-400/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl shadow-black/90 flex flex-col items-center text-center transform scale-100">
            {/* Animated green check circle */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-4 text-emerald-400 shadow-xl shadow-emerald-500/30">
              <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-400 animate-pulse" />
            </div>

            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Terima Kasih!
            </span>

            <div className="mt-3.5 inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/[0.08] border border-white/10 text-xs sm:text-sm font-bold shadow-lg">
              {successFeedback.choice === 'PAROKI_BINTARO' ? (
                <>
                  <img src="/logo-paroki-white.png" alt="" className="w-4 h-4 object-contain inline-block" />
                  <span className="text-blue-300">Tercatat: Umat Paroki Bintaro</span>
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300">Tercatat: Umat Luar Paroki</span>
                </>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-300 mt-2.5 font-medium">
              Kehadiran Anda berhasil tercatat
            </p>
            <span className="text-xs text-emerald-300 font-semibold mt-1">
              Selamat Beribadah 🙏
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
