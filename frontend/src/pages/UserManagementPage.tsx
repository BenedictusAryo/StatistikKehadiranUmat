import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { getAuthHeaders, useAuthStore } from '../store/authStore';
import { Plus, Shield, Trash2, Sparkles, UserCheck } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'LITBANG'>('LITBANG');
  const currentUser = useAuthStore((s) => s.user);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/users', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Gagal menambah user');
      }

      setEmail('');
      setPassword('');
      setFullName('');
      setIsAddOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan user');
    }
  };

  const handleDeleteUser = async (id: number, email: string) => {
    if (id === currentUser?.id) {
      alert('Tidak dapat menghapus akun Anda sendiri');
      return;
    }
    if (!window.confirm(`Hapus akun "${email}"?`)) return;

    try {
      const res = await fetch(`/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) fetchUsers();
    } catch (e) {
      alert('Gagal menghapus');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200/80 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-xs font-semibold text-blue-700 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Hak Akses & Otorisasi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manajemen Pengguna & Akses (RBAC)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola akun Tim IT Paroki (Admin) dan Tim Litbang Paroki Bintaro
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-blue-600/20 transition-spring active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Add User Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Tambah Akun Pengguna</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tentukan hak akses akun (Admin IT atau Litbang).
            </p>

            <form onSubmit={handleAddUser} className="mt-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Tim Litbang Matius"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-spring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@parokibintaro.org"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono transition-spring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 transition-spring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peran (Role)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium transition-spring"
                >
                  <option value="LITBANG">LITBANG (Buat Event, Pantau & Ekspor Data)</option>
                  <option value="ADMIN">ADMIN / TIM IT (Akses Penuh Seluruh Sistem)</option>
                </select>
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
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
            <span>Memuat data pengguna...</span>
          </div>
        ) : (
          users.map((u) => {
            const isSelf = u.id === currentUser?.id;

            return (
              <div key={u.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center space-x-3.5">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${
                    u.role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-200/60' : 'bg-blue-50 text-blue-600 border-blue-200/60'
                  }`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{u.full_name}</span>
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                        u.role === 'ADMIN' 
                          ? 'bg-purple-50 text-purple-700 border-purple-200/60' 
                          : 'bg-blue-50 text-blue-700 border-blue-200/60'
                      }`}>
                        {u.role === 'ADMIN' ? 'TIM IT' : 'LITBANG'}
                      </span>
                      {isSelf && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <UserCheck className="w-3 h-3" />
                          <span>Anda</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">{u.email}</p>
                  </div>
                </div>

                {!isSelf && (
                  <button
                    onClick={() => handleDeleteUser(u.id, u.email)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-spring active:scale-95"
                    title="Hapus Pengguna"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
