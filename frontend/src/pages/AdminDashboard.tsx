import React, { useEffect, useState } from 'react';
import { EventSession, MasterPos } from '../types';
import { getAuthHeaders } from '../store/authStore';
import { QrModal } from '../components/QrModal';
import { 
  Plus, Calendar, Clock, Users, Download, 
  ExternalLink, QrCode, ChevronRight, FileText, Check, DoorOpen, Building2,
  Trash2, Radio, Sparkles
} from 'lucide-react';

interface AdminDashboardProps {
  onSelectEvent: (event: EventSession) => void;
  onPrintReport: (event: EventSession) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onSelectEvent,
  onPrintReport 
}) => {
  const [events, setEvents] = useState<EventSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State for "Create Event"
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Misa');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [areaCapacities, setAreaCapacities] = useState<Record<string, number>>({
    'Gedung Gereja Utama': 1200,
  });
  const [enableCapacityWarning, setEnableCapacityWarning] = useState(false);
  const [masterPosList, setMasterPosList] = useState<MasterPos[]>([]);
  const [selectedPosIds, setSelectedPosIds] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);

  // Derive unique buildings from currently selected doors
  const selectedBuildings = React.useMemo(() => {
    const blds = new Set<string>();
    masterPosList.forEach((m) => {
      if (selectedPosIds.includes(m.id)) {
        blds.add(m.building || 'Gedung Gereja Utama');
      }
    });
    if (blds.size === 0) {
      blds.add('Gedung Gereja Utama');
    }
    return Array.from(blds);
  }, [masterPosList, selectedPosIds]);

  // Set default capacity when new buildings are encountered
  useEffect(() => {
    setAreaCapacities((prev) => {
      let changed = false;
      const next = { ...prev };
      selectedBuildings.forEach((bld) => {
        if (next[bld] === undefined) {
          changed = true;
          const lower = bld.toLowerCase();
          if (lower.includes('gereja')) next[bld] = 1200;
          else if (lower.includes('gkp') || lower.includes('pastoral')) next[bld] = 300;
          else if (lower.includes('tenda') || lower.includes('selasar')) next[bld] = 500;
          else next[bld] = 200;
        }
      });
      return changed ? next : prev;
    });
  }, [selectedBuildings]);

  // Total sum of all selected area capacities
  const totalCalculatedCapacity = React.useMemo(() => {
    return selectedBuildings.reduce((sum, bld) => {
      const val = areaCapacities[bld];
      return sum + (typeof val === 'number' && val > 0 ? val : 0);
    }, 0);
  }, [selectedBuildings, areaCapacities]);

  // QR Modal State
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    posName: string;
    eventName: string;
    token: string;
  }>({
    isOpen: false,
    posName: '',
    eventName: '',
    token: '',
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/events', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Gagal memuat daftar event');
      const data = await res.json();
      setEvents(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterPos = async () => {
    try {
      const res = await fetch('/api/master-pos?active_only=true', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setMasterPosList(data);
        setSelectedPosIds(data.map((m: MasterPos) => m.id));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchEvents();
    fetchMasterPos();
    
    // Default start time in Asia/Jakarta (WIB, GMT+7): now + 1 hour rounded to nearest 15 mins
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
    now.setSeconds(0);
    // Shift to GMT+7 (WIB) for datetime-local input value (YYYY-MM-DDTHH:mm)
    const wibMs = now.getTime() + 7 * 60 * 60 * 1000;
    const wibISOTime = new Date(wibMs).toISOString().slice(0, 16);
    setStartTime(wibISOTime);
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    try {
      const cleanAreaCapacities: Record<string, number> = {};
      if (enableCapacityWarning) {
        selectedBuildings.forEach((bld) => {
          const val = areaCapacities[bld];
          if (typeof val === 'number' && val > 0) {
            cleanAreaCapacities[bld] = val;
          }
        });
      }

      const startIso = startTime.includes('+') || startTime.endsWith('Z')
        ? new Date(startTime).toISOString()
        : new Date(`${startTime}:00+07:00`).toISOString();

      const payload = {
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        start_time: startIso,
        capacity_target: enableCapacityWarning && totalCalculatedCapacity > 0 ? totalCalculatedCapacity : undefined,
        enable_capacity_warning: enableCapacityWarning,
        area_capacities: enableCapacityWarning && Object.keys(cleanAreaCapacities).length > 0 ? cleanAreaCapacities : undefined,
        selected_master_pos_ids: selectedPosIds.length > 0 ? selectedPosIds : undefined,
      };

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Gagal membuat event');
      }

      // Reset and close
      setName('');
      setDescription('');
      setIsCreateOpen(false);
      await fetchEvents();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan event');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (eventId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/events/${eventId}/status?status_value=${newStatus}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        fetchEvents();
      }
    } catch (e) {
      alert('Gagal mengubah status event');
    }
  };

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus "${eventName}" beserta seluruh data kehadirannya?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        fetchEvents();
      }
    } catch (e) {
      alert('Gagal menghapus event');
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (filterStatus === 'ALL') return true;
    return ev.status === filterStatus;
  });

  const activeCount = events.filter((e) => e.status === 'OPEN').length;
  const scheduledCount = events.filter((e) => e.status === 'SCHEDULED').length;
  const completedCount = events.filter((e) => e.status === 'COMPLETED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner & Quick Stat Summary Bento Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200/80 gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-950/10 border border-amber-600/30 p-2 flex items-center justify-center flex-shrink-0 shadow-sm">
            <img src="/logo-paroki.png" alt="Logo Paroki" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[11px] font-semibold text-blue-700 mb-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Litbang & Sekretariat Paroki Bintaro</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Manajemen Acara & Misa
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Kelola sesi kehadiran umat, tautan pos pintu masuk, dan tampilan tayang VideoTron
            </p>
          </div>
        </div>

        {/* Create Event Button */}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-spring hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Acara Baru</span>
        </button>
      </div>

      {/* Quick Summary Bento Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-subtle flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Acara</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tabular-nums mt-1">
            {events.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Sesi terdaftar</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Sedang Berlangsung</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono tabular-nums mt-1">
            {activeCount}
          </div>
          <span className="text-[11px] text-emerald-600/80 mt-1">Pos siap menerima tap</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-200/80 shadow-subtle flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Terjadwal</span>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 font-mono tabular-nums mt-1">
            {scheduledCount}
          </div>
          <span className="text-[11px] text-blue-600/80 mt-1">Misa & kegiatan yad</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-subtle flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Selesai</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-600 font-mono tabular-nums mt-1">
            {completedCount}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Laporan siap dicetak</span>
        </div>
      </div>

      {/* Filter Tabs - Apple Segmented Style */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 bg-slate-100/80 p-1 rounded-2xl w-fit border border-slate-200/60">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-spring ${
            filterStatus === 'ALL'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Semua Event ({events.length})
        </button>
        <button
          onClick={() => setFilterStatus('OPEN')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-spring ${
            filterStatus === 'OPEN'
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-slate-600 hover:text-emerald-700'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Berlangsung ({activeCount})</span>
        </button>
        <button
          onClick={() => setFilterStatus('SCHEDULED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-spring ${
            filterStatus === 'SCHEDULED'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-blue-700'
          }`}
        >
          Terjadwal ({scheduledCount})
        </button>
        <button
          onClick={() => setFilterStatus('COMPLETED')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-spring ${
            filterStatus === 'COMPLETED'
              ? 'bg-white text-slate-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Selesai ({completedCount})
        </button>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <span>Memuat daftar event gereja...</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center shadow-subtle flex flex-col items-center">
          <img 
            src="/illustration-community.png" 
            alt="Komunitas Paroki Bintaro" 
            className="w-48 sm:w-60 h-auto object-contain mb-4 rounded-2xl shadow-sm border border-slate-100/80"
          />
          <h3 className="text-base sm:text-lg font-bold text-slate-800">Tidak Ada Acara yang Sesuai</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {filterStatus === 'ALL'
              ? 'Mulai pencatatan kehadiran dengan membuat sesi baru untuk Misa Mingguan, Hari Raya, atau kegiatan pastoral paroki.'
              : `Tidak ada acara dengan status "${filterStatus}". Silakan pilih filter lain atau buat acara baru.`}
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-spring active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Acara Baru</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredEvents.map((ev) => {
            const startDate = new Date(ev.start_time).toLocaleString('id-ID', {
              timeZone: 'Asia/Jakarta',
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={ev.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle hover:shadow-elevated transition-spring p-6 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Category & Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
                      {ev.category}
                    </span>

                    <div className="flex items-center space-x-2">
                      {ev.status === 'OPEN' && (
                        <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                          <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                          <span>LIVE (OPEN)</span>
                        </span>
                      )}
                      {ev.status === 'SCHEDULED' && (
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/80">
                          Terjadwal
                        </span>
                      )}
                      {ev.status === 'COMPLETED' && (
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60">
                          Selesai
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Timing */}
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                    {ev.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{startDate} WIB</span>
                  </div>

                  {ev.description && (
                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                      {ev.description}
                    </p>
                  )}

                  {/* Doors Summary & Capacity */}
                  <div className="flex items-center space-x-4 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <DoorOpen className="w-4 h-4 text-slate-400" />
                      <span><strong className="font-mono tabular-nums">{ev.pos_list.length}</strong> Pos Pintu</span>
                    </div>
                    {ev.capacity_target && (
                      <div className="flex items-center space-x-1.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>
                          Kapasitas: <strong className="font-mono tabular-nums">{ev.capacity_target.toLocaleString('id-ID')}</strong> kursi
                          {ev.area_capacities && Object.keys(ev.area_capacities).length > 1 && (
                            <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-200/60 px-1.5 py-0.2 rounded-md font-mono ml-1.5">
                              {Object.keys(ev.area_capacities).length} area
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Door Links & QR Chips */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Tautan QR Pos Petugas Masuk:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ev.pos_list.map((pos) => (
                      <button
                        key={pos.id}
                        onClick={() =>
                          setQrModalData({
                            isOpen: true,
                            posName: pos.name,
                            eventName: ev.name,
                            token: pos.token,
                          })
                        }
                        className="inline-flex items-center space-x-1 text-xs px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-slate-700 hover:text-blue-700 transition-spring active:scale-95"
                      >
                        <QrCode className="w-3.5 h-3.5 text-blue-600" />
                        <span>{pos.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {/* Public Videotron Link */}
                    <a
                      href={`/videotron/${ev.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-spring active:scale-95 shadow-sm"
                      title="Buka Tampilan VideoTron Layar Penuh"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      <span>VideoTron</span>
                    </a>

                    {/* Detail & Monitor */}
                    <button
                      onClick={() => onSelectEvent(ev)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 transition-spring active:scale-95"
                    >
                      <span>Monitor & Pos</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Print PDF Report */}
                    <button
                      onClick={() => onPrintReport(ev)}
                      className="inline-flex items-center space-x-1 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-spring active:scale-95"
                      title="Cetak Laporan PDF"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">PDF</span>
                    </button>

                    {/* Export CSV */}
                    <a
                      href={`/api/stats/${ev.id}/export/csv`}
                      download
                      className="inline-flex items-center space-x-1 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-spring active:scale-95"
                      title="Unduh Data CSV untuk Excel"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">CSV</span>
                    </a>
                  </div>

                  {/* Status Toggle & Delete */}
                  <div className="flex items-center space-x-1.5">
                    {ev.status !== 'OPEN' && (
                      <button
                        onClick={() => handleUpdateStatus(ev.id, 'OPEN')}
                        className="text-xs px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-spring active:scale-95 shadow-sm"
                        title="Buka Sesi Kehadiran"
                      >
                        Buka Sesi
                      </button>
                    )}
                    {ev.status === 'OPEN' && (
                      <button
                        onClick={() => handleUpdateStatus(ev.id, 'COMPLETED')}
                        className="text-xs px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium transition-spring active:scale-95 shadow-sm"
                        title="Tutup & Selesaikan Sesi"
                      >
                        Tutup Sesi
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteEvent(ev.id, ev.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-spring active:scale-95"
                      title="Hapus Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Buat Acara Baru
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Buat sesi penghitungan kehadiran baru (Misa, Pelatihan/Gladi Bersih, Seminar, dsb).
            </p>

            <form onSubmit={handleCreateEvent} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Acara / Event <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Misa Natal 2026 - Pk 17:00 / Seminar OMK / Pelantikan Imamat"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-spring"
                />
              </div>

              {/* Category & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Acara
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-spring"
                  >
                    <option value="Misa">Misa</option>
                    <option value="Gladi Bersih">Gladi Bersih / Pelatihan</option>
                    <option value="Pelantikan">Pelantikan Imamat</option>
                    <option value="Seminar">Seminar / Pembinaan</option>
                    <option value="Perayaan">Perayaan Paroki</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Waktu Mulai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-spring font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Catatan khusus panitia, imam peraya, atau keterangan teknis..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-spring"
                />
              </div>

              {/* Capacity Settings */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableCapacityWarning}
                      onChange={(e) => setEnableCapacityWarning(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Aktifkan Peringatan Kapasitas Kursi per Ruangan / Area
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">(Opsional)</span>
                </div>

                {enableCapacityWarning && (
                  <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">
                        Target Kursi per Ruangan Terpilih:
                      </span>
                      <span className="text-[11px] font-bold text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                        Total: {totalCalculatedCapacity.toLocaleString('id-ID')} Kursi
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedBuildings.map((bld) => (
                        <div key={bld} className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-800 truncate" title={bld}>
                              {bld}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">kursi</span>
                          </div>
                          <input
                            type="number"
                            min={10}
                            step={50}
                            value={areaCapacities[bld] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : Number(e.target.value);
                              setAreaCapacities((prev) => ({
                                ...prev,
                                [bld]: val,
                              }));
                            }}
                            placeholder="500"
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Ambang batas peringatan (75% Mendekati Penuh &amp; 95% Penuh) akan dipantau mandiri untuk tiap ruangan/area yang dipilih, sehingga panitia dan VideoTron dapat langsung mengarahkan umat ke ruangan alternatif.
                    </p>
                  </div>
                )}
              </div>

              {/* Pos / Pintu Selection Grouped by Building */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Pos Pintu Masuk ({selectedPosIds.length} terpilih)
                  </label>
                  <div className="space-x-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSelectedPosIds(masterPosList.map((m) => m.id))}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPosIds([])}
                      className="text-[11px] text-slate-500 hover:underline"
                    >
                      Batal Semua
                    </button>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 max-h-60 overflow-y-auto">
                  {Object.entries(
                    masterPosList.reduce((acc, m) => {
                      const bld = m.building || 'Gedung Gereja Utama';
                      if (!acc[bld]) acc[bld] = [];
                      acc[bld].push(m);
                      return acc;
                    }, {} as Record<string, MasterPos[]>)
                  ).map(([bldName, doors]) => {
                    const allBldSelected = doors.every((d) => selectedPosIds.includes(d.id));
                    return (
                      <div key={bldName} className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
                          <div className="flex items-center space-x-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-xs font-semibold text-slate-800">{bldName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const bldDoorIds = doors.map((d) => d.id);
                              if (allBldSelected) {
                                setSelectedPosIds(selectedPosIds.filter((id) => !bldDoorIds.includes(id)));
                              } else {
                                const newIds = Array.from(new Set([...selectedPosIds, ...bldDoorIds]));
                                setSelectedPosIds(newIds);
                              }
                            }}
                            className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {allBldSelected ? 'Batal Zona Ini' : 'Pilih Zona Ini'}
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {doors.map((m) => {
                            const isSelected = selectedPosIds.includes(m.id);
                            return (
                              <button
                                type="button"
                                key={m.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedPosIds(selectedPosIds.filter((id) => id !== m.id));
                                  } else {
                                    setSelectedPosIds([...selectedPosIds, m.id]);
                                  }
                                }}
                                className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium flex items-center space-x-1.5 transition-spring active:scale-95 ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                                <span>{m.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-spring"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition-spring active:scale-95 disabled:opacity-50"
                >
                  {creating ? 'Menyimpan...' : 'Simpan & Buat Sesi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      <QrModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
        posName={qrModalData.posName}
        eventName={qrModalData.eventName}
        token={qrModalData.token}
      />
    </div>
  );
};
