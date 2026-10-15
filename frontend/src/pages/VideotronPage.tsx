import React, { useEffect, useState } from 'react';
import { LiveStats } from '../types';
import { 
  Globe, Users, Maximize2, RefreshCw, 
  AlertCircle, CheckCircle2, Flame, Clock, Radio, Building2,
  TrendingUp, LineChart as LineChartIcon, LayoutGrid
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from 'recharts';

interface VideotronPageProps {
  eventId: string;
}

export const VideotronPage: React.FC<VideotronPageProps> = ({ eventId }) => {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState<'SPLIT' | 'NUMBERS' | 'CHART'>('SPLIT');

  // Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Polling for live stats every 6 seconds
  useEffect(() => {
    let isMounted = true;

    const fetchLive = async () => {
      try {
        const res = await fetch(`/api/stats/${eventId}/live`);
        if (!res.ok) throw new Error('Event tidak ditemukan');
        const data = await res.json();
        if (isMounted) {
          setStats(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Gagal memuat data statistik');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLive();
    const interval = setInterval(fetchLive, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [eventId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 shadow-elevated">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Menghubungkan ke Layar Videotron...</h2>
        <p className="text-slate-400 mt-1 font-medium">Gereja St. Matius Penginjil • Paroki Bintaro</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4 shadow-elevated">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-rose-400 tracking-tight">Data Tidak Ditemukan</h2>
        <p className="text-slate-400 mt-1 text-sm">{error || 'Event tidak valid'}</p>
      </div>
    );
  }

  // Format date and time in Indonesian
  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Format time series intervals for chart
  const formattedTimeSeries = (stats.time_series || []).map((t) => {
    const [hStr, mStr] = t.time_label.split(':');
    const h = parseInt(hStr || '0', 10);
    const m = parseInt(mStr || '0', 10);
    const endM = (m + 5) % 60;
    const endH = m + 5 >= 60 ? (h + 1) % 24 : h;
    const rangeLabel = `${String(h).padStart(2, '0')}.${String(m).padStart(2, '0')}-${String(endH).padStart(2, '0')}.${String(endM).padStart(2, '0')}`;
    return {
      ...t,
      rangeLabel,
    };
  });

  return (
    <div className="min-h-screen bg-[#070b14] bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(37,99,235,0.15),rgba(0,0,0,0))] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans overflow-hidden select-none">
      {/* Top Header: Church Emblem & Live Digital Clock */}
      <header className="flex flex-col sm:flex-row items-center justify-between border-b border-white/[0.08] pb-4 mb-4 gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center shadow-elevated p-2">
            <img src="/logo-paroki.png" alt="Logo Paroki Bintaro" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase">
                <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
                <span>SIARAN LANGSUNG</span>
              </span>
              <span className="text-xs text-slate-400 font-medium tracking-tight">
                Gereja St. Matius Penginjil • Paroki Bintaro
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight mt-0.5">
              {stats.event_name}
            </h1>
          </div>
        </div>

        {/* View Mode Switcher, Digital Clock & Fullscreen Button */}
        <div className="flex items-center space-x-3">
          {/* Mode Selector - Apple Segmented Control Aesthetic */}
          <div className="hidden sm:flex items-center bg-white/[0.04] border border-white/[0.08] rounded-2xl p-1 space-x-1 text-xs">
            <button
              onClick={() => setViewMode('SPLIT')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition-spring ${
                viewMode === 'SPLIT' 
                  ? 'bg-white/15 text-white shadow-sm border border-white/10' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('NUMBERS')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition-spring ${
                viewMode === 'NUMBERS' 
                  ? 'bg-white/15 text-white shadow-sm border border-white/10' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Angka</span>
            </button>
            <button
              onClick={() => setViewMode('CHART')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-medium transition-spring ${
                viewMode === 'CHART' 
                  ? 'bg-white/15 text-white shadow-sm border border-white/10' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Grafik</span>
            </button>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-2xl flex items-center space-x-3 text-right shadow-sm">
            <Clock className="w-5 h-5 text-amber-300" />
            <div>
              <div className="text-lg sm:text-xl font-mono font-bold text-white tracking-wider leading-none tabular-nums">
                {formattedTime} <span className="text-[10px] text-slate-400 font-sans">WIB</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">{formattedDate}</div>
            </div>
          </div>
          <button
            onClick={toggleFullscreen}
            className="p-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-2xl text-slate-400 hover:text-white transition-spring active:scale-95"
            title="Layar Penuh"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Capacity Warning Alert Banner (If enabled and threshold reached) */}
      {stats.enable_capacity_warning && stats.capacity_target && (() => {
        const fullAreas = (stats.building_breakdown || []).filter((b) => b.capacity_status === 'FULL');
        const warningAreas = (stats.building_breakdown || []).filter((b) => b.capacity_status === 'WARNING');

        return (
          <div className="mb-4">
            {stats.capacity_status === 'FULL' ? (
              <div className="bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-rose-950/80 border-2 border-rose-500/80 text-rose-100 p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between shadow-2xl animate-pulse gap-3">
                <div className="flex items-center space-x-3">
                  <Flame className="w-8 h-8 text-rose-400 flex-shrink-0 animate-bounce" />
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                      {fullAreas.length > 0 ? (
                        <>PERHATIAN: KAPASITAS [{fullAreas.map((b) => b.building).join(', ')}] TELAH PENUH</>
                      ) : (
                        <>PERHATIAN: KAPASITAS UTAMA PENUH ({stats.total_umat.toLocaleString('id-ID')} / {stats.capacity_target.toLocaleString('id-ID')})</>
                      )}
                    </h3>
                    <p className="text-xs sm:text-sm text-rose-200">
                      Petugas / Panitia segera mengarahkan umat ke ruangan/area lain yang masih tersedia (GKP / Selasar / Tenda).
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
                  {fullAreas.map((b) => (
                    <span key={b.building} className="px-3 py-1 rounded-full bg-rose-600 text-white font-mono font-black text-xs uppercase shadow-sm">
                      {b.building}: {b.capacity_percentage}%
                    </span>
                  ))}
                  {fullAreas.length === 0 && (
                    <span className="px-3.5 py-1.5 rounded-full bg-rose-600 text-white font-mono font-black text-sm uppercase">
                      {stats.capacity_percentage}% TERISI
                    </span>
                  )}
                </div>
              </div>
            ) : stats.capacity_status === 'WARNING' ? (
              <div className="bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-amber-950/80 border border-amber-500/60 text-amber-100 p-3.5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between shadow-lg gap-3">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-amber-200 tracking-tight">
                      {warningAreas.length > 0 ? (
                        <>Kapasitas [{warningAreas.map((b) => b.building).join(', ')}] Mendekati Penuh (&ge;75%)</>
                      ) : (
                        <>Kapasitas Kursi Utama Mendekati Penuh ({stats.total_umat.toLocaleString('id-ID')} / {stats.capacity_target.toLocaleString('id-ID')} • {stats.capacity_percentage}%)</>
                      )}
                    </h3>
                    <p className="text-xs text-amber-300/80">
                      Panitia bersiap untuk pembukaan atau pengalihan ke area selasar/ruangan tambahan.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
                  {warningAreas.map((b) => (
                    <span key={b.building} className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 font-mono font-bold text-xs">
                      {b.building}: {b.capacity_percentage}%
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.03] border border-white/[0.08] px-4 py-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-white">Status Kapasitas Kursi:</span>
                  </div>
                  {stats.building_breakdown?.filter((b) => b.capacity_target).map((b) => (
                    <div key={b.building} className="flex items-center space-x-1.5 text-xs">
                      <span className="text-slate-400">{b.building}:</span>
                      <strong className="text-slate-100 font-mono tabular-nums">{b.total}</strong>
                      <span className="text-slate-500">/{b.capacity_target}</span>
                      <span className="text-emerald-400 font-mono font-bold">({b.capacity_percentage}%)</span>
                    </div>
                  ))}
                  {(!stats.building_breakdown || stats.building_breakdown.filter((b) => b.capacity_target).length === 0) && (
                    <span>
                      Total: <strong className="text-slate-100 font-mono tabular-nums">{stats.total_umat}</strong> dari <strong className="font-mono tabular-nums">{stats.capacity_target}</strong> kursi ({stats.capacity_percentage}%)
                    </span>
                  )}
                </div>
                <div className="hidden sm:flex items-center space-x-2">
                  <span className="text-[11px] text-slate-400 font-mono">Total Terisi: {stats.capacity_percentage}%</span>
                  <div className="w-28 bg-white/[0.08] h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(stats.capacity_percentage || 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Main Stats Display */}
      <main className="flex-1 flex flex-col justify-center space-y-4">
        {/* VIEW MODE 1: NUMBERS (Giant Total + 2 Split Cards) */}
        {viewMode === 'NUMBERS' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 rounded-3xl p-6 sm:p-10 text-center shadow-2xl relative overflow-hidden backdrop-blur-xl">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
              <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-400 font-mono">
                TOTAL UMAT HADIR SAAT INI
              </span>
              <div className="text-7xl sm:text-9xl md:text-[10rem] font-black text-white tracking-tighter my-2 font-mono tabular-nums drop-shadow-md">
                {stats.total_umat.toLocaleString('id-ID')}
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-400">
                Jiwa Tercatat di Seluruh Pintu Masuk
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Paroki Bintaro Card */}
              <div className="bg-white/[0.03] border-2 border-blue-500/40 rounded-3xl p-6 flex flex-col justify-between shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/30 p-2">
                      <img src="/logo-paroki-white.png" alt="Paroki Bintaro" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Umat Paroki Bintaro</h3>
                      <p className="text-xs text-blue-300 font-medium">St. Matius Penginjil</p>
                    </div>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono tabular-nums">
                    {stats.paroki_bintaro_percentage}%
                  </span>
                </div>
                <div className="text-4xl sm:text-6xl font-black text-white font-mono tabular-nums my-2">
                  {stats.paroki_bintaro_count.toLocaleString('id-ID')}
                </div>
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.paroki_bintaro_percentage}%` }}
                  />
                </div>
              </div>

              {/* Luar Paroki Card */}
              <div className="bg-white/[0.03] border-2 border-amber-500/40 rounded-3xl p-6 flex flex-col justify-between shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Umat Luar Paroki</h3>
                      <p className="text-xs text-amber-300 font-medium">Tamu & Peziarah</p>
                    </div>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tabular-nums">
                    {stats.luar_paroki_percentage}%
                  </span>
                </div>
                <div className="text-4xl sm:text-6xl font-black text-white font-mono tabular-nums my-2">
                  {stats.luar_paroki_count.toLocaleString('id-ID')}
                </div>
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.luar_paroki_percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: SPLIT (Compact Header Row + Time Series Line Chart) */}
        {viewMode === 'SPLIT' && (
          <div className="space-y-4">
            {/* Compact Top Metrics Row */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-5 text-center shadow-lg backdrop-blur-md">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">Total Umat</span>
                <div className="text-3xl sm:text-6xl font-black text-white font-mono tabular-nums mt-1">
                  {stats.total_umat.toLocaleString('id-ID')}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Jiwa hadir</span>
              </div>
              <div className="bg-blue-950/30 border border-blue-500/40 rounded-3xl p-5 text-center shadow-lg backdrop-blur-md">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-300">Paroki Bintaro</span>
                <div className="text-3xl sm:text-6xl font-black text-blue-300 font-mono tabular-nums mt-1">
                  {stats.paroki_bintaro_count.toLocaleString('id-ID')}
                </div>
                <span className="text-[11px] text-blue-300 font-mono font-bold mt-1 block">{stats.paroki_bintaro_percentage}%</span>
              </div>
              <div className="bg-amber-950/30 border border-amber-500/40 rounded-3xl p-5 text-center shadow-lg backdrop-blur-md">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300">Luar Paroki</span>
                <div className="text-3xl sm:text-6xl font-black text-amber-300 font-mono tabular-nums mt-1">
                  {stats.luar_paroki_count.toLocaleString('id-ID')}
                </div>
                <span className="text-[11px] text-amber-300 font-mono font-bold mt-1 block">{stats.luar_paroki_percentage}%</span>
              </div>
            </div>

            {/* Time Series Line Chart Card */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-sky-400" />
                  <h3 className="font-bold text-sm sm:text-base text-slate-100 tracking-tight">
                    Grafik Lonjakan Kedatangan Umat (Interval 5 Menit)
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">Arus Waktu Kedatangan</span>
              </div>

              <div className="h-64 sm:h-72 w-full">
                {formattedTimeSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedTimeSeries} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="rangeLabel" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d16',
                          borderColor: 'rgba(255,255,255,0.15)',
                          borderRadius: '1rem',
                          color: '#fff',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Total Kedatangan"
                        stroke="#38bdf8"
                        strokeWidth={4}
                        dot={{ r: 5, fill: '#38bdf8', stroke: '#0369a1', strokeWidth: 2 }}
                        activeDot={{ r: 8, fill: '#38bdf8' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="paroki_bintaro"
                        name="Paroki Bintaro"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3, fill: '#3b82f6' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="luar_paroki"
                        name="Luar Paroki"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3, fill: '#f59e0b' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <p className="text-sm">Menunggu data kedatangan pertama dari pintu masuk...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 3: CHART (Full High-Impact Line Chart) */}
        {viewMode === 'CHART' && (
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl h-[480px] flex flex-col justify-between backdrop-blur-md">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white tracking-tight">Kurva Waktu Kedatangan Umat</h3>
                  <p className="text-xs text-slate-400">Lonjakan arus kehadiran per rentang 5 menit</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Total Terakumulasi</span>
                  <div className="text-2xl font-black font-mono text-white tabular-nums">{stats.total_umat} Jiwa</div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full pt-4">
              {formattedTimeSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedTimeSeries} margin={{ top: 25, right: 35, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="rangeLabel" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: 'rgba(255,255,255,0.15)',
                        borderRadius: '1rem',
                        color: '#fff',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Total Umat Hadir"
                      stroke="#38bdf8"
                      strokeWidth={4}
                      dot={{ r: 6, fill: '#38bdf8', stroke: '#0284c7', strokeWidth: 2 }}
                      activeDot={{ r: 9, fill: '#38bdf8' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="paroki_bintaro"
                      name="Paroki Bintaro"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 4, fill: '#3b82f6' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="luar_paroki"
                      name="Luar Paroki"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 4, fill: '#f59e0b' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  <p className="text-sm">Menunggu rekaman sentuhan dari pintu masuk...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer: Building Breakdown & Door Chips */}
      <footer className="mt-4 pt-4 border-t border-white/[0.08] space-y-3">
        {/* Building / Zone level summary */}
        {stats.building_breakdown && stats.building_breakdown.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider mr-1">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Gedung / Zona:</span>
            </div>
            {stats.building_breakdown.map((bld) => {
              const isFull = bld.capacity_status === 'FULL';
              const isWarning = bld.capacity_status === 'WARNING';
              const bgClass = isFull
                ? 'bg-rose-950/60 border-rose-500/60 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : isWarning
                ? 'bg-amber-950/60 border-amber-500/60 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'bg-blue-950/40 border-blue-500/30 text-slate-200';

              return (
                <div
                  key={bld.building}
                  className={`border px-3 py-1.5 rounded-xl flex items-center space-x-2 text-xs transition-colors ${bgClass}`}
                >
                  <span className="font-semibold text-white">{bld.building}:</span>
                  <span className="font-mono text-cyan-300 font-black text-sm tabular-nums">{bld.total}</span>
                  {bld.capacity_target ? (
                    <span className="font-mono text-[11px] text-slate-300 font-medium">
                      / {bld.capacity_target} ({bld.capacity_percentage}%)
                    </span>
                  ) : null}
                  {isFull && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500 text-white uppercase tracking-wider animate-pulse">
                      PENUH
                    </span>
                  )}
                  {isWarning && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
                      ≥75%
                    </span>
                  )}
                  <span className="text-[10px] text-blue-300 font-mono">({bld.paroki_bintaro} PB</span>
                  <span className="text-[10px] text-amber-300 font-mono">{bld.luar_paroki} LP)</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Individual Pos / Door breakdown */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-400 font-semibold">
            <span>Rincian Pintu Masuk:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {stats.pos_breakdown.map((pos) => (
              <div
                key={pos.pos_id}
                className="bg-white/[0.04] border border-white/10 px-3 py-1 rounded-xl flex items-center space-x-2 text-slate-300 text-[11px]"
              >
                <span className="font-medium text-slate-200">{pos.pos_name}:</span>
                <span className="font-mono text-white font-bold tabular-nums">{pos.total}</span>
                <span className="text-[10px] text-blue-300 font-mono">({pos.paroki_bintaro} PB</span>
                <span className="text-[10px] text-amber-300 font-mono">{pos.luar_paroki} LP)</span>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Auto-refresh 6s • Litbang Paroki Bintaro
          </div>
        </div>
      </footer>
    </div>
  );
};
