import React, { useEffect, useState } from 'react';
import { MasterPos } from '../types';
import { getAuthHeaders } from '../store/authStore';
import { DoorOpen, Plus, Trash2, Building2, MapPin, Sparkles } from 'lucide-react';

const PRESET_BUILDINGS = [
  'Gedung Gereja Utama',
  'Gedung Karya Pastoral (GKP)',
  'Tenda & Selasar Luar',
];

export const MasterPosPage: React.FC = () => {
  const [masterDoors, setMasterDoors] = useState<MasterPos[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [building, setBuilding] = useState('Gedung Gereja Utama');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const fetchMasterDoors = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/master-pos', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setMasterDoors(data);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterDoors();
  }, []);

  const handleAddDoor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const payload = {
        building: building.trim() || 'Gedung Gereja Utama',
        name: name.trim(),
        code: code.trim() || name.toLowerCase().replace(/\s+/g, '-'),
        description: description.trim() || undefined,
        display_order: masterDoors.length + 1,
        is_active: true,
      };

      const res = await fetch('/api/master-pos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setName('');
        setCode('');
        setDescription('');
        setIsAddOpen(false);
        fetchMasterDoors();
      } else {
        const err = await res.json();
        alert(err.detail || 'Gagal menambah master pintu');
      }
    } catch (e) {
      alert('Gagal menambah master pintu');
    }
  };

  const handleDeleteDoor = async (id: number, doorName: string) => {
    if (!window.confirm(`Hapus master pintu "${doorName}"?`)) return;
    try {
      const res = await fetch(`/api/master-pos/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        fetchMasterDoors();
      }
    } catch (e) {
      alert('Gagal menghapus');
    }
  };

  // Group doors by building
  const groupedDoors = masterDoors.reduce((acc, door) => {
    const bld = door.building || 'Gedung Gereja Utama';
    if (!acc[bld]) acc[bld] = [];
    acc[bld].push(door);
    return acc;
  }, {} as Record<string, MasterPos[]>);

  const buildingKeys = Object.keys(groupedDoors);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/80 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-xs font-semibold text-blue-700 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Konfigurasi Denah Pos Gereja</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Master Data Pos Pintu Masuk
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Hirarki pos jaga per gedung / ruangan yang otomatis dijadikan template saat pembuatan event baru
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-spring active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Master Pintu</span>
        </button>
      </div>

      {/* Add Door Form Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Tambah Master Pintu / Ruangan</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pintu atau ruangan ini akan menjadi template pilihan untuk setiap event baru.
            </p>

            <form onSubmit={handleAddDoor} className="mt-5 space-y-4">
              {/* Building selector / input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Gedung / Lokasi / Zona <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {PRESET_BUILDINGS.map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setBuilding(preset)}
                      className={`text-[11px] px-3 py-1 rounded-xl border font-medium transition-spring active:scale-95 ${
                        building === preset
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="Atau ketik nama gedung / zona kustom..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-spring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Pos / Pintu / Ruangan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!code) setCode(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  }}
                  placeholder="Contoh: Auditorium Lt. 2 / Pintu Tenda Depan"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-spring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Teknis Pos
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="gkp-auditorium"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono transition-spring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan / Lokasi Fisik
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Gedung Karya Pastoral Lt. 2 sisi timur"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-spring"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-spring"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-spring active:scale-95"
                >
                  Simpan Master Pintu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Master Doors List Grouped by Building */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
          <span>Memuat data master pos...</span>
        </div>
      ) : buildingKeys.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center text-xs text-slate-500">
          Belum ada master pintu tersimpan.
        </div>
      ) : (
        <div className="space-y-6">
          {buildingKeys.map((bldName) => {
            const doors = groupedDoors[bldName];
            return (
              <div
                key={bldName}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden"
              >
                {/* Building Section Header */}
                <div className="bg-slate-50/90 px-5 py-3.5 border-b border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 tracking-tight">{bldName}</h3>
                      <p className="text-[11px] text-slate-500">
                        {doors.length} Pos Pintu / Ruangan Terdaftar
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full">
                    Zona Aktif
                  </span>
                </div>

                {/* Doors under this building */}
                <div className="divide-y divide-slate-100">
                  {doors.map((door) => (
                    <div
                      key={door.id}
                      className="p-4 sm:px-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200/80">
                          <DoorOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-900">
                              {door.name}
                            </span>
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60">
                              {door.code}
                            </span>
                          </div>
                          {door.description && (
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span>{door.description}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteDoor(door.id, door.name)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-spring active:scale-95"
                        title="Hapus Master Pintu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
