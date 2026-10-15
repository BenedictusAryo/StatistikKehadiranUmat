import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Lock, Mail, ArrowRight, AlertCircle, Sparkles, CheckCircle2, ShieldCheck, BarChart3, Radio } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setAuth } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Email atau kata sandi tidak sesuai');
      }

      const data = await res.json();
      setAuth(data.access_token, data.user);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat masuk');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col lg:grid lg:grid-cols-12 selection:bg-blue-600 selection:text-white">
      {/* Visual / Editorial Showcase Section (Desktop: Left 7 cols) */}
      <section className="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-white/[0.08]">
        {/* Background Artwork Layer */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/illustration-church-mass.png" 
            alt="Perayaan Ekaristi Gereja Santo Matius Penginjil Paroki Bintaro" 
            className="w-full h-full object-cover object-center scale-[1.02] filter brightness-90"
          />
          {/* Subtle multi-stop gradient overlay for readable typography */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/70 to-[#070b14]/50" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#070b14]/40 to-[#070b14]/90" />
        </div>

        {/* Top Branding Header */}
        <div className="relative z-10 flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-amber-400/40 p-1 shadow-elevated shadow-black/60 flex items-center justify-center">
            <img 
              src="/logo-paroki.png" 
              alt="Logo Paroki Bintaro" 
              className="w-full h-full object-contain filter drop-shadow" 
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold tracking-tight text-white leading-tight">
                Gereja Santo Matius Penginjil
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                Paroki Bintaro
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Keuskupan Agung Jakarta • DPH Seksi Litbang
            </p>
          </div>
        </div>

        {/* Middle Editorial Hero Message */}
        <div className="relative z-10 my-auto py-12 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/15 text-xs text-amber-200 mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold tracking-wide">Sistem Informasi Kehadiran Umat Misa</span>
          </div>
          
          <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Mencatat Kehadiran Umat, Memperkuat Pelayanan Pastoral.
          </h1>
          
          <p className="mt-4 text-sm xl:text-base text-slate-300 leading-relaxed font-normal">
            Platform terpadu untuk monitoring jemaat secara real-time via tablet kiosk di setiap pintu gereja, siaran videotron ruang ibadah, dan pelaporan evaluasi kapasitas untuk Litbang.
          </p>

          {/* Micro Telemetry Badges */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/[0.05] backdrop-blur-md border border-white/10 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center mb-2 border border-blue-500/30">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Kiosk Multi-Pintu</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Offline-first sync</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.05] backdrop-blur-md border border-white/10 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center mb-2 border border-amber-500/30">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Layar Videotron</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Update live jemaat</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.05] backdrop-blur-md border border-white/10 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2 border border-emerald-500/30">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Analisis Litbang</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Ekspor CSV & PDF</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status / Credit */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Aman dengan autentikasi berbasis peran (Admin IT & Litbang)</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">v1.0 Production</span>
        </div>
      </section>

      {/* Login Form Section (Desktop: Right 5 cols, Mobile: Full screen) */}
      <section className="lg:col-span-5 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 relative overflow-hidden">
        {/* Subtle mobile backdrop */}
        <div className="lg:hidden absolute inset-0 z-0 opacity-20 pointer-events-none">
          <img 
            src="/illustration-church-mass.png" 
            alt="Gereja St Matius" 
            className="w-full h-full object-cover filter blur-sm"
          />
        </div>

        <div className="w-full max-w-sm relative z-10">
          {/* Mobile church header logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-amber-400/40 p-2 mx-auto mb-4 shadow-elevated flex items-center justify-center transition-spring hover:scale-105">
              <img 
                src="/logo-paroki.png" 
                alt="Logo Paroki Bintaro" 
                className="w-full h-full object-contain filter drop-shadow" 
              />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Masuk ke Portal
            </h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Statistik Kehadiran Umat • Paroki Bintaro
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2.5 transition-spring">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="litbang@matius.id"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/80 transition-spring shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/80 transition-spring shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white text-sm font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition-spring active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </span>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Access Credentials for Dev / Testing */}
          {import.meta.env.DEV && (
            <div className="mt-8 pt-6 border-t border-white/[0.08] text-center">
              <div className="flex items-center justify-center space-x-1.5 mb-3 text-[11px] text-slate-400 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Akses Cepat Pengujian (Dev Only):</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredentials('litbang@matius.id', 'LitbangMatius2026!')}
                  className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-[11px] text-amber-300 transition-spring text-left flex flex-col active:scale-95"
                >
                  <span className="font-bold text-amber-200">Litbang</span>
                  <span className="font-mono text-[10px] text-amber-400/80 mt-0.5 truncate">litbang@matius.id</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('admin@matius.id', 'AdminMatius2026!')}
                  className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-[11px] text-blue-300 transition-spring text-left flex flex-col active:scale-95"
                >
                  <span className="font-bold text-blue-200">Admin IT</span>
                  <span className="font-mono text-[10px] text-blue-400/80 mt-0.5 truncate">admin@matius.id</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-[11px] text-slate-500">
              Gereja Katolik St. Matius Penginjil • Bintaro
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

