import React, { useEffect, useState } from 'react';
import { EventSession, LiveStats, EvaluationNotes } from '../types';
import { getAuthHeaders } from '../store/authStore';
import { 
  ArrowLeft, Printer, Download, Edit3, Plus, 
  Trash2, Save, X, CheckCircle2, Globe, Users, 
  Building, Video, Sparkles
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, LabelList 
} from 'recharts';

interface ReportPrintViewProps {
  event: EventSession;
  onBack: () => void;
}

export const ReportPrintView: React.FC<ReportPrintViewProps> = ({ event, onBack }) => {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [, setLoading] = useState(true);

  // Evaluation Notes State
  const [evalNotes, setEvalNotes] = useState<EvaluationNotes>({
    observations: [
      { category: 'Tata Ruang', note: 'Tidak ada kendala dalam pengaturan tata ruang dan bangku umat.' },
      { category: 'Tata Laksana', note: 'Secara keseluruhan petugas tata laksana sudah melayani dengan baik dan sigap.' },
      { category: 'Audio - Visual', note: 'Sarana audio dan visual berjalan baik serta stabil sepanjang acara.' }
    ],
    recommendations: 'Petugas dan panitia secara keseluruhan sudah memahami prosedur alur umat. Disarankan mempertahankan koordinasi antar pos pintu untuk kelancaran misa-misa berikutnya.',
    conclusion: `Pelaksanaan ${event.name} secara keseluruhan berjalan dengan baik, tertib, dan khidmat.`
  });

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('Tata Ruang');
  const [newNote, setNewNote] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/stats/${event.id}/live`);
        if (res.ok) {
          const data: LiveStats = await res.json();
          setStats(data);

          // Populate notes from backend if available
          const rawNotes = data.evaluation_notes || event.evaluation_notes;
          if (rawNotes) {
            try {
              const parsed = JSON.parse(rawNotes);
              if (parsed.observations && Array.isArray(parsed.observations)) {
                setEvalNotes({
                  observations: parsed.observations,
                  recommendations: parsed.recommendations || evalNotes.recommendations,
                  conclusion: parsed.conclusion || evalNotes.conclusion,
                  photo_url: parsed.photo_url || ''
                });
              }
            } catch (err) {
              console.warn('Gagal mem-parse catatan evaluasi:', err);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [event.id]);

  const handlePrint = () => {
    window.print();
  };

  const handleAddObservation = () => {
    if (!newNote.trim()) return;
    setEvalNotes({
      ...evalNotes,
      observations: [
        ...evalNotes.observations,
        { category: newCategory, note: newNote.trim() }
      ]
    });
    setNewNote('');
  };

  const handleRemoveObservation = (index: number) => {
    const updated = [...evalNotes.observations];
    updated.splice(index, 1);
    setEvalNotes({ ...evalNotes, observations: updated });
  };

  const handleSaveEvaluationNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/events/${event.id}/evaluation-notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(evalNotes),
      });
      if (!res.ok) throw new Error('Gagal menyimpan catatan evaluasi');
      setSaveSuccessMsg('Catatan evaluasi berhasil disimpan ke database!');
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setIsEditorOpen(false);
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan catatan evaluasi');
    } finally {
      setSavingNotes(false);
    }
  };

  const formattedDate = new Date(event.start_time).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Prepare chart time series data
  const formattedTimeSeries = (stats?.time_series || []).map((t) => {
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

  // Calculate peak arrival interval
  const peakBucket = formattedTimeSeries.length > 0
    ? formattedTimeSeries.reduce((max, cur) => cur.total > (max?.total || 0) ? cur : max, formattedTimeSeries[0])
    : null;

  // Group observations by category
  const groupedObservations = evalNotes.observations.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item.note);
    return acc;
  }, {} as Record<string, string[]>);

  const getCategoryIcon = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('ruang')) return <Building className="w-3.5 h-3.5" />;
    if (c.includes('laksana') || c.includes('talaks')) return <Users className="w-3.5 h-3.5" />;
    if (c.includes('audio') || c.includes('visual') || c.includes('suara')) return <Video className="w-3.5 h-3.5" />;
    return <Sparkles className="w-3.5 h-3.5" />;
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 sm:py-10">
      {/* Top action toolbar (Hidden when printing) */}
      <div className="max-w-4xl mx-auto px-4 mb-6 flex items-center justify-between no-print">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-subtle transition-spring active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Button to edit observation & recommendations */}
          <button
            onClick={() => setIsEditorOpen(true)}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-3.5 py-2 rounded-2xl shadow-subtle transition-spring active:scale-95"
          >
            <Edit3 className="w-4 h-4 text-emerald-600" />
            <span>Edit Catatan & Evaluasi</span>
          </button>

          <a
            href={`/api/stats/${event.id}/export/csv`}
            download
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 bg-white px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-subtle hover:bg-slate-50 transition-spring active:scale-95"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Unduh CSV</span>
          </a>

          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-2xl shadow-md shadow-blue-600/20 transition-spring active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (Litbang St. Matius Evaluation Format) */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-xl border border-slate-200/80 text-slate-900 print:shadow-none print:border-none print:p-0">
        
        {/* Header Block: Logo Litbang + Titles */}
        <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900/80">
          <div className="flex items-center space-x-4">
            {/* Official Parish & Litbang Seal */}
            <div className="w-16 h-16 rounded-2xl border-2 border-emerald-600/40 bg-emerald-50/30 p-2 shadow-sm flex-shrink-0 flex items-center justify-center">
              <img src="/logo-paroki.png" alt="Paroki Bintaro" className="w-full h-full object-contain" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">
                Laporan dan Evaluasi
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-0.5">
                {event.name}
              </h1>
              <p className="text-sm font-semibold text-slate-700 mt-1">
                {formattedDate} • Gereja St. Matius Penginjil Paroki Bintaro
              </p>
            </div>
          </div>

          <div className="text-right text-[11px] text-slate-500 hidden sm:block">
            <p className="font-semibold text-slate-700">Seksi Litbang DPH</p>
            <p>Tangerang Selatan, Banten</p>
            <p className="font-mono mt-1 text-[10px]">Dicetak: {new Date().toLocaleDateString('id-ID')} WIB</p>
          </div>
        </div>

        {/* Top 3 KPI Cards (Emerald Green Theme matching manual report) */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 my-5">
            {/* Total Umat */}
            <div className="border-2 border-emerald-600 rounded-2xl p-4 text-center bg-emerald-50/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-center space-x-1.5 text-emerald-800 text-xs font-bold mb-1">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Total Umat Yang Hadir</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tabular-nums my-1">
                {stats.total_umat.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Jiwa Terdata</span>
            </div>

            {/* Paroki Bintaro */}
            <div className="border-2 border-emerald-600 rounded-2xl p-4 text-center bg-emerald-50/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-center space-x-1.5 text-emerald-800 text-xs font-bold mb-1">
                <img src="/logo-paroki-blue.png" alt="" className="w-4 h-4 object-contain" />
                <span>Umat Paroki Bintaro</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-blue-600 font-mono tabular-nums my-1">
                {stats.paroki_bintaro_percentage}%
              </div>
              <span className="text-[11px] text-slate-600 font-semibold font-mono">
                {stats.paroki_bintaro_count.toLocaleString('id-ID')} Jiwa
              </span>
            </div>

            {/* Luar Paroki */}
            <div className="border-2 border-emerald-600 rounded-2xl p-4 text-center bg-emerald-50/10 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-center space-x-1.5 text-emerald-800 text-xs font-bold mb-1">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>Umat Luar Paroki Bintaro</span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-amber-600 font-mono tabular-nums my-1">
                {stats.luar_paroki_percentage}%
              </div>
              <span className="text-[11px] text-slate-600 font-semibold font-mono">
                {stats.luar_paroki_count.toLocaleString('id-ID')} Jiwa
              </span>
            </div>
          </div>
        )}

        {/* SECTION A: Waktu Kedatangan (Line Chart & Bullet Points) */}
        <div className="mb-6 pt-2">
          <div className="inline-block bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-md shadow-sm mb-3">
            A. Waktu Kedatangan (Interval 5 Menit)
          </div>

          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/40">
            {/* The Line Chart */}
            <div className="h-56 w-full mb-3">
              {formattedTimeSeries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedTimeSeries} margin={{ top: 22, right: 25, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                    <XAxis dataKey="rangeLabel" stroke="#475569" fontSize={10} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Kedatangan (Umat)"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#2563eb', stroke: '#1e3a8a', strokeWidth: 1.5 }}
                    >
                      <LabelList dataKey="total" position="top" offset={6} fill="#1e293b" fontSize={10} fontWeight="bold" />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Tidak ada rekaman waktu kedatangan umat
                </div>
              )}
            </div>

            {/* Bullet Insights below chart */}
            <ul className="space-y-1 text-xs text-slate-800 list-disc pl-5">
              <li>
                Total umat yang hadir dan tercatat adalah <strong>{stats?.total_umat || 0} umat</strong>.
              </li>
              {peakBucket && (
                <li>
                  Jam puncak kedatangan umat adalah rentang waktu <strong>{peakBucket.rangeLabel}</strong> dengan <strong>{peakBucket.total} umat</strong> ({stats && stats.total_umat > 0 ? Math.round((peakBucket.total / stats.total_umat) * 100) : 0}% dari total kehadiran).
                </li>
              )}
              <li>
                Sebagian besar umat mulai berdatangan dalam kurun waktu 30 menit sebelum misa dimulai.
              </li>
            </ul>
          </div>
        </div>

        {/* SECTION B: Observasi (Red ribbon category badges) */}
        <div className="mb-6">
          <div className="inline-block bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-md shadow-sm mb-3">
            B. Observasi
          </div>

          <div className="space-y-3.5 border border-slate-200 rounded-2xl p-4 bg-slate-50/40">
            {Object.entries(groupedObservations).map(([category, notes]) => (
              <div key={category} className="space-y-1">
                <div className="inline-flex items-center space-x-1.5 bg-rose-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                  {getCategoryIcon(category)}
                  <span>{category}</span>
                </div>
                <ul className="list-disc pl-6 space-y-1 text-xs text-slate-800">
                  {notes.map((n, idx) => (
                    <li key={idx} className="leading-relaxed">{n}</li>
                  ))}
                </ul>
              </div>
            ))}

            {Object.keys(groupedObservations).length === 0 && (
              <p className="text-xs text-slate-400 italic">Belum ada catatan observasi yang ditambahkan.</p>
            )}
          </div>
        </div>

        {/* SECTION C: Rekomendasi Seksi Litbang */}
        <div className="mb-6">
          <div className="inline-block bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-md shadow-sm mb-3">
            C. Rekomendasi seksi Litbang
          </div>

          <div className="border-2 border-emerald-500 rounded-2xl p-4 bg-emerald-50/15 text-xs text-slate-800 leading-relaxed shadow-sm">
            <p className="font-medium">{evalNotes.recommendations || 'Belum ada rekomendasi khusus untuk acara ini.'}</p>
          </div>
        </div>

        {/* SECTION D: Rincian Pos Pintu Masuk & Ruangan */}
        <div className="mb-6">
          <div className="inline-block bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-md shadow-sm mb-3">
            D. Rincian Pos Pintu Masuk & Ruangan
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Nama Pos Pintu Masuk</th>
                  <th className="py-2.5 px-3 text-right">Umat Paroki Bintaro</th>
                  <th className="py-2.5 px-3 text-right">Umat Luar Paroki</th>
                  <th className="py-2.5 px-3 text-right">Total Pintu</th>
                  <th className="py-2.5 px-3 text-right">Kontribusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {stats && Object.entries(
                  stats.pos_breakdown.reduce((acc, p) => {
                    const bld = p.building || 'Gedung Gereja Utama';
                    if (!acc[bld]) acc[bld] = [];
                    acc[bld].push(p);
                    return acc;
                  }, {} as Record<string, typeof stats.pos_breakdown>)
                ).map(([bldName, doors]) => {
                  const bldTotal = doors.reduce((sum, d) => sum + d.total, 0);
                  const bldPb = doors.reduce((sum, d) => sum + d.paroki_bintaro, 0);
                  const bldLp = doors.reduce((sum, d) => sum + d.luar_paroki, 0);
                  const bldPct = stats.total_umat > 0 ? ((bldTotal / stats.total_umat) * 100).toFixed(1) : '0.0';

                  return (
                    <React.Fragment key={bldName}>
                      <tr className="bg-slate-100/90 font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                        <td colSpan={5} className="py-1.5 px-3">
                          📍 {bldName} ({doors.length} Pos Pintu)
                        </td>
                      </tr>
                      {doors.map((p) => {
                        const pct = stats.total_umat > 0 
                          ? ((p.total / stats.total_umat) * 100).toFixed(1) 
                          : '0.0';

                        return (
                          <tr key={p.pos_id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 pl-6 font-medium text-slate-900">{p.pos_name}</td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums">{p.paroki_bintaro.toLocaleString('id-ID')}</td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums">{p.luar_paroki.toLocaleString('id-ID')}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">{p.total.toLocaleString('id-ID')}</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-500 tabular-nums">{pct}%</td>
                          </tr>
                        );
                      })}
                      <tr className="bg-emerald-50/30 font-semibold text-[11px] border-b border-slate-300">
                        <td className="py-1.5 px-3 pl-6 text-slate-600 italic">Subtotal {bldName}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-blue-700 tabular-nums">{bldPb.toLocaleString('id-ID')}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-amber-700 tabular-nums">{bldLp.toLocaleString('id-ID')}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">{bldTotal.toLocaleString('id-ID')}</td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-700 tabular-nums">{bldPct}%</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <tr>
                  <td className="py-2.5 px-3">TOTAL KESELURUHAN</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">{stats?.paroki_bintaro_count.toLocaleString('id-ID')}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">{stats?.luar_paroki_count.toLocaleString('id-ID')}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900 tabular-nums">{stats?.total_umat.toLocaleString('id-ID')}</td>
                  <td className="py-2.5 px-3 text-right font-mono">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* SECTION PENUTUP (Green Ribbon Arrow Banner) */}
        {evalNotes.conclusion && (
          <div className="bg-emerald-700 text-white p-3.5 rounded-2xl font-medium text-xs shadow-sm flex items-center space-x-2 my-6">
            <strong className="font-extrabold uppercase tracking-wide bg-emerald-900/60 px-2.5 py-1 rounded-xl text-[11px] flex-shrink-0">
              Penutup:
            </strong>
            <span className="leading-relaxed">{evalNotes.conclusion}</span>
          </div>
        )}
      </div>

      {/* Interactive Evaluation Notes Editor Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto no-print animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Edit Catatan & Evaluasi Laporan
                </h3>
                <p className="text-xs text-slate-500">
                  Perubahan akan tersimpan di database dan langsung tercetak pada PDF
                </p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-spring"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success alert */}
            {saveSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* Observasi Items List */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                1. Poin-Poin Observasi
              </label>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {evalNotes.observations.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs gap-2">
                    <div className="space-y-1 flex-1">
                      <span className="inline-block bg-rose-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {item.category}
                      </span>
                      <p className="text-slate-800 leading-relaxed">{item.note}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveObservation(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-spring"
                      title="Hapus poin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new observation */}
              <div className="bg-slate-100/80 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 block">Tambah Poin Baru:</span>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['Tata Ruang', 'Tata Laksana', 'Audio - Visual', 'Parkir & Keamanan', 'Lainnya'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`text-[11px] px-3 py-1 rounded-xl font-semibold transition-spring active:scale-95 ${
                        newCategory === cat
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Contoh: Petugas talaks sigap mengatur antrean..."
                    className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-spring"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddObservation();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddObservation}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-spring active:scale-95 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Rekomendasi Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                2. Rekomendasi Seksi Litbang
              </label>
              <textarea
                rows={3}
                value={evalNotes.recommendations || ''}
                onChange={(e) => setEvalNotes({ ...evalNotes, recommendations: e.target.value })}
                placeholder="Tuliskan rekomendasi atau saran perbaikan kedepannya..."
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-spring"
              />
            </div>

            {/* Penutup Textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                3. Catatan Penutup / Kesimpulan
              </label>
              <textarea
                rows={2}
                value={evalNotes.conclusion || ''}
                onChange={(e) => setEvalNotes({ ...evalNotes, conclusion: e.target.value })}
                placeholder="Kesimpulan umum jalannya acara..."
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-spring"
              />
            </div>

            {/* Modal footer actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition-spring"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSaveEvaluationNotes}
                disabled={savingNotes}
                className="inline-flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-spring active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingNotes ? 'Menyimpan...' : 'Simpan Catatan Evaluasi'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
