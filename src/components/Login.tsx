import React, { useState, useEffect } from 'react';
import { KeyRound, User, Lock, FileSpreadsheet, ShieldAlert, Sun, Moon } from 'lucide-react';
import { authenticateUser, initializeDefaultAdmin } from '../lib/dbService';
import { AppUser } from '../types';

interface LoginProps {
  darkMode?: boolean;
  setDarkMode?: (dark: boolean) => void;
  onLoginSuccess: (user: AppUser) => void;
}

export default function Login({ darkMode, setDarkMode, onLoginSuccess }: LoginProps) {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Make sure default admin exists in the database
    initializeDefaultAdmin();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password) {
      setError('Silakan lengkapi semua kolom.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await authenticateUser(usernameOrEmail, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Username/Email atau Password salah.');
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan sistem saat mencoba masuk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative" id="login-view">
      <div className="absolute inset-0 bg-transparent pointer-events-none" />
      
      {/* Floating Theme Toggle in Top Right of screen */}
      {setDarkMode !== undefined && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-3 bg-white/40 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-slate-900/80 border border-white/50 dark:border-slate-800 backdrop-blur-md text-slate-700 dark:text-slate-300 rounded-2xl shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 flex items-center justify-center"
            title={darkMode ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
            id="btn-login-theme-toggle"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-500 animate-spin-slow" /> : <Moon className="w-5 h-5 text-purple-600" />}
          </button>
        </div>
      )}

      <div className="glass-panel-heavy dark:bg-slate-900/75 dark:border-white/10 rounded-3xl p-8 max-w-md w-full border border-white/50 shadow-2xl relative z-10 animate-fadeIn text-slate-800 dark:text-slate-200">
         {/* Brand Area */}
         <div className="flex flex-col items-center text-center mb-8">
           <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-500/20 mb-4 animate-pulse">
             <FileSpreadsheet className="w-8 h-8" />
           </div>
           <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Dental Screening Dashboard</h1>
           <p className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wide mt-1">Dashboard Pemeriksaan dan Analisis Kesehatan Gigi</p>
         </div>

         {error && (
          <div className="mb-6 p-4 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/30 rounded-2xl flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs font-semibold animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div>
              <p>{error}</p>
            </div>
          </div>
        )}

         <form onSubmit={handleSubmit} className="space-y-5">
           {/* Username or Email Input */}
           <div className="space-y-1.5">
             <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Username atau Email</label>
             <div className="relative">
               <User className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-purple-600/65 dark:text-purple-400/80" />
               <input
                 type="text"
                 value={usernameOrEmail}
                 onChange={(e) => setUsernameOrEmail(e.target.value)}
                 placeholder="Masukkan username atau email..."
                className="w-full pl-11 pr-4 py-3 bg-white/40 dark:bg-slate-950/40 border border-white/50 dark:border-slate-800/80 rounded-2xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white/80 dark:focus:bg-slate-900/80 transition-all font-medium shadow-xs"
                 id="login-username-input"
               />
             </div>
           </div>

           {/* Password Input */}
           <div className="space-y-1.5">
             <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">Password</label>
             <div className="relative">
               <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-purple-600/65 dark:text-purple-400/80" />
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder="Masukkan password Anda..."
                className="w-full pl-11 pr-4 py-3 bg-white/40 dark:bg-slate-950/40 border border-white/50 dark:border-slate-800/80 rounded-2xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white/80 dark:focus:bg-slate-900/80 transition-all font-medium shadow-xs"
                 id="login-password-input"
               />
             </div>
           </div>

           {/* Login Button */}
           <button
             type="submit"
             disabled={loading}
             className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-purple-600/15 hover:shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
             id="login-submit-button"
           >
             {loading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             ) : (
               <>
                 <KeyRound className="w-4 h-4" />
                 <span>Masuk Sekarang</span>
               </>
             )}
           </button>

           {/* Quick Fill Helpers */}
           <div className="pt-2 flex flex-col gap-2 border-t border-white/20 dark:border-white/10 mt-4">
             <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center">Pilih Akun Masuk Cepat:</span>
             <div className="grid grid-cols-2 gap-2">
               <button
                 type="button"
                 onClick={() => {
                   setUsernameOrEmail('admin');
                   setPassword('admin123');
                   setError(null);
                 }}
                 className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                   usernameOrEmail.toLowerCase() === 'admin'
                     ? 'bg-purple-100 dark:bg-purple-900/60 border-purple-400 dark:border-purple-500 text-purple-950 dark:text-purple-100 shadow-xs ring-2 ring-purple-500/30 dark:ring-purple-400/30'
                     : 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border-purple-200/60 dark:border-purple-800/50 text-purple-900 dark:text-purple-200'
                 }`}
                 id="btn-login-quick-admin"
               >
                 <span>👑 Admin</span>
               </button>
               <button
                 type="button"
                 onClick={() => {
                   setUsernameOrEmail('petugas');
                   setPassword('petugas123');
                   setError(null);
                 }}
                 className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                   usernameOrEmail.toLowerCase() === 'petugas'
                     ? 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-400 dark:border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-xs ring-2 ring-emerald-500/30 dark:ring-emerald-400/30'
                     : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border-emerald-200/60 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200'
                 }`}
                 id="btn-login-quick-petugas"
               >
                 <span>🩺 Petugas</span>
               </button>
             </div>
           </div>
         </form>
       </div>
    </div>
  );
}
