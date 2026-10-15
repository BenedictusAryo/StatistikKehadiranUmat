import React, { useEffect, useState } from 'react';
import { EventSession, LiveStats, EventPos } from '../types';
import { getAuthHeaders } from '../store/authStore';
import { QrModal } from '../components/QrModal';
import { 
  ArrowLeft, Globe, Users, ExternalLink, 
  Download, FileText, QrCode, Plus, 
  Copy, Check, Building2, Radio, AlertTriangle, AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Legend, CartesianGrid 
} from 'recharts';

interface EventDetailDashboardProps {
  event: EventSession;
  onBack: () => void;
  onPrintReport: (event: EventSession) => void;
}

export const EventDetailDashboard: React.FC<EventDetailDashboardProps> = ({
  event,
  onBack,
  onPrintReport,
}) => {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [newDoorName, setNewDoorName] = useState('');
  const [newDoorBuilding, setNewDoorBuilding] = useState('Gedung Gereja Utama');
  const [addingDoor, setAddingDoor] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<EventSession>(event);

  // QR Modal
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    posName: string;
    token: string;
  }>({
    isOpen: false,
    posName: '',
    token: '',
  });

  const fetchLiveStats = async () => {
    try {
      const res = await fetch(`/api/stats/${currentEvent.id}/live`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const fetchEventDetail = async () => {
    try {
      const res = await fetch(`/api/events/${currentEvent.id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentEvent(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchLiveStats();
    fetchEventDetail();
    const interval = setInterval(fetchLiveStats, 6000);
    return () => clearInterval(interval);
  }, [currentEvent.id]);

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/pos/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleAddDoor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoorName.trim()) return;

    setAddingDoor(true);
    try {
      const res = await fetch(
        `/api/events/${currentEvent.id}/pos?name=${encodeURIComponent(newDoorName.trim())}&building=${encodeURIComponent(newDoorBuilding.trim())}`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
        }
      );
      if (res.ok) {
        setNewDoorName('');
        await fetchEventDetail();
        await fetchLiveStats();
      }
    } catch (e) {
      alert('Gagal menambahkan pos pintu');
    } finally {
      setAddingDoor(false);
    }
  };

  const handleToggleStatus = async (newStatus: string) => {
    try {
      const res = await fetch(
        `/api/events/${currentEvent.id}/status?status_value=${newStatus}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
        }
      );
      if (res.ok) {
        await fetchEventDetail();
        await fetchLiveStats();
      }
    } catch (e) {
      alert('Gagal mengubah status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button & Event Title Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-200/80 gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-spring mb-2 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Event</span>
          </button>

          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-950/10 border border-amber-600/30 p-2 flex items-center justify-center flex-shrink-0 shadow-sm">
              <img src="/logo-paroki.png" alt="Logo Paroki" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
                  {currentEvent.category}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {currentEvent.name}
                </h2>
                {currentEvent.status === 'OPEN' && (
                  <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                    <span>LIVE COUNTER</span>
                  </span>
                )}
                {currentEvent.status === 'COMPLETED' && (
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60">
                    Selesai
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Gereja St. Matius Penginjil • Paroki Bintaro
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status buttons */}
          {currentEvent.status !== 'OPEN' && (
            <button
              onClick={() => handleToggleStatus('OPEN')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-spring active:scale-95"
            >
              Buka Sesi Kehadiran
            </button>
          )}
          {currentEvent.status === 'OPEN' && (
            <button
              onClick={() => handleToggleStatus('COMPLETED')}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-spring active:scale-95"
            >
              Tutup & Selesaikan Sesi
            </button>
          )}

          {/* VideoTron */}
          <a
            href={`/videotron/${currentEvent.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-spring active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span>Layar VideoTron</span>
          </a>

          {/* PDF Report */}
          <button
            onClick={() => onPrintReport(currentEvent)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold shadow-sm transition-spring active:scale-95"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak PDF</span>
          </button>

          {/* Export CSV */}
          <a
            href={`/api/stats/${currentEvent.id}/export/csv`}
            download
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold shadow-sm transition-spring active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download CSV</span>
          </a>
        </div>
      </div>

      {/* Capacity Warning Banner (if enabled and status is WARNING or FULL) */}
      {currentEvent.capacity_target && stats && stats.capacity_status !== 'NORMAL' && (
        <div
          className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
            stats.capacity_status === 'FULL'
              ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm'
              : 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl ${
                stats.capacity_status === 'FULL'
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-amber-500 text-slate-950'
              }`}
            >
              {stats.capacity_status === 'FULL' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-sm tracking-tight">
                {stats.capacity_status === 'FULL'
                  ? 'Kapasitas Ruangan Penuh (≥95%)!'
                  : 'Peringatan: Kapasitas Ruangan Mendekati Batas Penuh (≥75%)'}
              </h4>
              <p className="text-xs opacity-90 mt-0.5">
                {stats.building_breakdown?.some((b) => b.capacity_status === 'FULL')
                  ? `Area penuh: ${stats.building_breakdown
                      .filter((b) => b.capacity_status === 'FULL')
                      .map((b) => b.building)
                      .join(', ')}. Harap arahkan umat ke ruangan atau area cadangan.`
                  : stats.building_breakdown?.some((b) => b.capacity_status === 'WARNING')
                  ? `Area waspada: ${stats.building_breakdown
                      .filter((b) => b.capacity_status === 'WARNING')
                      .map((b) => b.building)
                      .join(', ')}. Bersiap mengarahkan umat ke ruangan lain.`
                  : 'Total kapasitas misa telah melewati batas ambang aman.'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold self-end sm:self-auto">
            <span className="px-3 py-1 rounded-lg bg-white/80 border border-current shadow-xs">
              {stats.total_umat} / {currentEvent.capacity_target} ({stats.capacity_percentage}%)
            </span>
          </div>
        </div>
      )}

      {/* Metrics Row - Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Umat */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Total Umat Hadir</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-black text-slate-900 font-mono tabular-nums my-1">
            {stats ? stats.total_umat.toLocaleString('id-ID') : '...'}
          </div>
          <p className="text-[11px] text-slate-400">Tercatat di seluruh pintu masuk</p>
        </div>

        {/* Paroki Bintaro */}
        <div className="bg-white rounded-3xl border border-blue-200/80 p-6 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Umat Paroki Bintaro</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/60 p-1 flex items-center justify-center">
              <img src="/logo-paroki-blue.png" alt="Paroki Bintaro" className="w-full h-full object-contain" />
            </div>
          </div>
          <div className="text-4xl font-black text-blue-600 font-mono tabular-nums my-1">
            {stats ? stats.paroki_bintaro_count.toLocaleString('id-ID') : '...'}
          </div>
          <p className="text-[11px] text-blue-600 font-semibold font-mono">
            {stats ? `${stats.paroki_bintaro_percentage}% dari total kehadiran` : '...'}
          </p>
        </div>

        {/* Luar Paroki */}
        <div className="bg-white rounded-3xl border border-amber-200/80 p-6 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Umat Luar Paroki</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-black text-amber-600 font-mono tabular-nums my-1">
            {stats ? stats.luar_paroki_count.toLocaleString('id-ID') : '...'}
          </div>
          <p className="text-[11px] text-amber-600 font-semibold font-mono">
            {stats ? `${stats.luar_paroki_percentage}% dari total kehadiran` : '...'}
          </p>
        </div>

        {/* Capacity Target */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Kapasitas Kursi</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              stats?.capacity_status === 'FULL'
                ? 'bg-rose-100 text-rose-700 animate-pulse'
                : stats?.capacity_status === 'WARNING'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-700'
            }`}>
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 my-1">
            <span className={`text-4xl font-black font-mono tabular-nums ${
              stats?.capacity_status === 'FULL'
                ? 'text-rose-600'
                : stats?.capacity_status === 'WARNING'
                ? 'text-amber-600'
                : 'text-slate-800'
            }`}>
              {currentEvent.capacity_target
                ? `${stats ? stats.capacity_percentage : 0}%`
                : 'Tidak Diset'}
            </span>
            {currentEvent.capacity_target && stats?.capacity_status === 'FULL' && (
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                PENUH
              </span>
            )}
            {currentEvent.capacity_target && stats?.capacity_status === 'WARNING' && (
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                ≥75%
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            {currentEvent.capacity_target
              ? `${stats ? stats.total_umat : 0} / ${currentEvent.capacity_target} kursi (${
                  currentEvent.area_capacities && Object.keys(currentEvent.area_capacities).length > 0
                    ? `${Object.keys(currentEvent.area_capacities).length} area`
                    : 'total'
                })`
              : 'Peringatan kapasitas nonaktif'}
          </p>
        </div>
      </div>

      {/* Building / Zone Attendance Summary Cards */}
      {stats?.building_breakdown && stats.building_breakdown.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight">
                  Distribusi Kehadiran per Gedung & Zona
                </h3>
                <p className="text-xs text-slate-500">
                  Pemantauan kapasitas per ruangan untuk mitigasi lonjakan umat
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-mono">
              {stats.building_breakdown.length} Zona Gedung
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.building_breakdown.map((bld) => {
              const bldShare = stats.total_umat > 0 ? Math.round((bld.total / stats.total_umat) * 100) : 0;
              const hasCapacity = bld.capacity_target != null && bld.capacity_target > 0;
              const capPct = bld.capacity_percentage ?? 0;
              const isFull = bld.capacity_status === 'FULL';
              const isWarning = bld.capacity_status === 'WARNING';

              const barColor = isFull
                ? 'bg-rose-500'
                : isWarning
                ? 'bg-amber-500'
                : 'bg-indigo-600';

              const cardBorder = isFull
                ? 'border-rose-300 bg-rose-50/40 shadow-xs'
                : isWarning
                ? 'border-amber-300 bg-amber-50/40 shadow-xs'
                : 'border-slate-200/80 bg-slate-50/80';

              return (
                <div key={bld.building} className={`rounded-2xl p-4 border transition-all ${cardBorder}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-800 truncate">{bld.building}</span>
                    <div className="flex items-center space-x-1.5">
                      {isFull && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full font-mono animate-pulse">
                          PENUH
                        </span>
                      )}
                      {isWarning && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full font-mono">
                          ≥75%
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full font-mono">
                        {bld.pos_count} Pintu
                      </span>
                    </div>
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-slate-900 font-mono tabular-nums">{bld.total}</span>
                    {hasCapacity ? (
                      <span className="text-xs font-mono font-medium text-slate-600">
                        / {bld.capacity_target} kursi ({capPct}%)
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-mono">umat ({bldShare}%)</span>
                    )}
                  </div>
                  <div className="w-full bg-slate-200/80 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(100, hasCapacity ? capPct : bldShare)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-600 pt-2.5 border-t border-slate-200/60 font-mono">
                    <span className="text-blue-600">Bintaro: <strong className="tabular-nums">{bld.paroki_bintaro}</strong></span>
                    <span className="text-amber-600">Luar: <strong className="tabular-nums">{bld.luar_paroki}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Arrival Trends Chart */}
      {stats && stats.time_series.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Grafik Lonjakan Kehadiran per 5 Menit
              </h3>
              <p className="text-xs text-slate-500">
                Mencerminkan waktu aktual rekaman sentuhan di pos pintu masuk
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="inline-flex bg-slate-100/90 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 rounded-lg transition-spring ${
                    chartType === 'line'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📈 Garis (Line)
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded-lg transition-spring ${
                    chartType === 'bar'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📊 Batang (Bar)
                </button>
              </div>
              <span className="text-xs font-mono text-slate-400">Interval 5m</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={stats.time_series}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time_label" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderRadius: '1rem',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total Hadir"
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0284c7' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="paroki_bintaro"
                    name="Paroki Bintaro"
                    stroke="#2563eb"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#2563eb' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="luar_paroki"
                    name="Luar Paroki"
                    stroke="#d97706"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#d97706' }}
                  />
                </LineChart>
              ) : (
                <BarChart data={stats.time_series}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time_label" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderRadius: '1rem',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="paroki_bintaro" name="Paroki Bintaro" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="luar_paroki" name="Luar Paroki" fill="#d97706" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Pos / Doors Management & Live Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Daftar Pos & Pintu Masuk
            </h3>
            <p className="text-xs text-slate-500">
              Setiap pos memiliki QR code dan tautan unik untuk petugas pintu masuk
            </p>
          </div>

          {/* Add custom door form with building selection */}
          <form onSubmit={handleAddDoor} className="flex flex-wrap items-center gap-2">
            <select
              value={newDoorBuilding}
              onChange={(e) => setNewDoorBuilding(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-spring"
            >
              <option value="Gedung Gereja Utama">Gedung Gereja Utama</option>
              <option value="Gedung Karya Pastoral (GKP)">Gedung Karya Pastoral (GKP)</option>
              <option value="Tenda & Selasar Luar">Tenda & Selasar Luar</option>
            </select>
            <input
              type="text"
              value={newDoorName}
              onChange={(e) => setNewDoorName(e.target.value)}
              placeholder="Nama Pos / Ruangan..."
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px] transition-spring"
            />
            <button
              type="submit"
              disabled={addingDoor || !newDoorName.trim()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1 shadow-sm transition-spring active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
          </form>
        </div>

        {/* Pos List Grouped by Building */}
        <div className="space-y-5 mt-5">
          {Object.entries(
            currentEvent.pos_list.reduce((acc, pos) => {
              const bld = pos.building || 'Gedung Gereja Utama';
              if (!acc[bld]) acc[bld] = [];
              acc[bld].push(pos);
              return acc;
            }, {} as Record<string, EventPos[]>)
          ).map(([bldName, doors]) => (
            <div key={bldName} className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-subtle">
              {/* Building Group Header */}
              <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-xs text-slate-800">{bldName}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200/80 px-2.5 py-0.5 rounded-full">
                  {doors.length} Pos Terdaftar
                </span>
              </div>

              {/* Doors under this building */}
              <div className="divide-y divide-slate-100 bg-white">
                {doors.map((pos) => {
                  const posStat = stats?.pos_breakdown.find((p) => p.pos_id === pos.id);

                  return (
                    <div
                      key={pos.id}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900">{pos.name}</span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                            {pos.code}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-slate-500 font-mono">
                          <span>
                            Total: <strong className="text-slate-900 tabular-nums">{posStat?.total || 0}</strong>
                          </span>
                          <span className="text-blue-600">
                            Bintaro: <strong className="tabular-nums">{posStat?.paroki_bintaro || 0}</strong>
                          </span>
                          <span className="text-amber-600">
                            Luar: <strong className="tabular-nums">{posStat?.luar_paroki || 0}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            setQrModalData({
                              isOpen: true,
                              posName: pos.name,
                              token: pos.token,
                            })
                          }
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-spring active:scale-95"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Tampilkan QR</span>
                        </button>

                        <button
                          onClick={() => handleCopyLink(pos.token)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-spring active:scale-95"
                        >
                          {copiedToken === pos.token ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-semibold">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Link</span>
                            </>
                          )}
                        </button>

                        <a
                          href={`/pos/${pos.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-spring active:scale-95 shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Kiosk</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QR MODAL */}
      <QrModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
        posName={qrModalData.posName}
        eventName={currentEvent.name}
        token={qrModalData.token}
      />
    </div>
  );
};
