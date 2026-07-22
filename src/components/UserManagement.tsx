import React, { useState, useEffect } from 'react';
import { getUsers, addUser, updateUser, deleteUser } from '../lib/dbService';
import { AppUser } from '../types';
import { UserPlus, Edit, Trash2, ShieldAlert, Users, Check, X, Key, Mail, UserCheck, Search, Shield, ChevronLeft, ChevronRight } from 'lucide-react';

interface UserManagementProps {
  currentUser: AppUser;
}

export default function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [namaLengkap, setNamaLengkap] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [passwordPlain, setPasswordPlain] = useState('');
  const [role, setRole] = useState<'Administrator' | 'Petugas Pemeriksa'>('Petugas Pemeriksa');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAddModal = () => {
    setEditId(null);
    setNamaLengkap('');
    setUsername('');
    setEmail('');
    setPasswordPlain('');
    setRole('Petugas Pemeriksa');
    setError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (user: AppUser) => {
    setEditId(user.id || null);
    setNamaLengkap(user.namaLengkap);
    setUsername(user.username);
    setEmail(user.email);
    setPasswordPlain(''); // Keep blank to not change password unless typed
    setRole(user.role);
    setError(null);
    setShowModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!namaLengkap.trim() || !username.trim() || !email.trim()) {
      setError('Mohon lengkapi semua data wajib.');
      return;
    }

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format email tidak valid.');
      return;
    }

    if (!editId && !passwordPlain) {
      setError('Password wajib diisi untuk pengguna baru.');
      return;
    }

    try {
      // Check if username/email already exists (except for the user being edited)
      const isDuplicateUsername = users.some(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.id !== editId);
      const isDuplicateEmail = users.some(u => u.email.toLowerCase() === email.trim().toLowerCase() && u.id !== editId);

      if (isDuplicateUsername) {
        setError('Username sudah digunakan oleh pengguna lain.');
        return;
      }
      if (isDuplicateEmail) {
        setError('Email sudah digunakan oleh pengguna lain.');
        return;
      }

      if (editId) {
        // Edit User
        await updateUser(editId, {
          namaLengkap: namaLengkap.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          role,
          passwordPlain: passwordPlain ? passwordPlain : undefined
        });
        setSuccessMsg('Pengguna berhasil diperbarui!');
      } else {
        // Add User
        await addUser({
          namaLengkap: namaLengkap.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          role,
          passwordPlain,
          passwordHash: '' // Will be generated inside addUser
        });
        setSuccessMsg('Pengguna baru berhasil ditambahkan!');
      }

      setShowModal(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError('Gagal menyimpan data pengguna.');
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (user.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${user.namaLengkap}"?`)) {
      try {
        await deleteUser(user.id!);
        setSuccessMsg('Pengguna berhasil dihapus.');
        fetchUsers();
      } catch (err) {
        console.error(err);
        setError('Gagal menghapus pengguna.');
      }
    }
  };

  const filteredUsers = users.filter(u =>
    u.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-2" id="user-management-root">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-2">
            <Users className="w-5.5 h-5.5 text-indigo-600" />
            Manajemen Pengguna (User Management)
          </h2>
          <p className="text-xs text-slate-500 font-bold tracking-wide mt-1">Daftar petugas kesehatan gigi dan administrator aplikasi</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all cursor-pointer hover:scale-[1.02]"
          id="btn-add-user"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50/70 border border-emerald-200/50 rounded-2xl flex items-start gap-3 text-emerald-800 text-xs font-semibold animate-fadeIn">
          <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <p>{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50/70 border border-rose-200/50 rounded-2xl flex items-start gap-3 text-rose-800 text-xs font-semibold animate-fadeIn">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Filter and Table */}
      <div className="glass-panel p-4 rounded-2xl shadow-md border border-white/40">
        <div className="relative mb-4 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-indigo-600/70" />
          <input
            type="text"
            placeholder="Cari pengguna berdasarkan nama, username, email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/40 border border-white/50 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/80 transition-all font-medium shadow-xs"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-slate-500 text-xs font-semibold mt-3">Memuat pengguna...</p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-white/30 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-white/30 text-slate-600 border-b border-white/30 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 text-[10px]">Nama Lengkap</th>
                    <th className="py-3.5 px-4 text-[10px]">Username</th>
                    <th className="py-3.5 px-4 text-[10px]">Email</th>
                    <th className="py-3.5 px-4 text-[10px]">Hak Akses (Role)</th>
                    <th className="py-3.5 px-4 text-[10px] text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20 text-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 font-bold bg-white/25">
                        Tidak ada pengguna yang terdaftar atau cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/30 transition-colors">
                        <td className="py-3.5 px-4 font-extrabold text-indigo-950 flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${u.role === 'Administrator' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                            {u.namaLengkap.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-indigo-950">{u.namaLengkap}</div>
                            <div className="text-[9px] text-slate-400">Dibuat: {new Date(u.createdAt).toLocaleDateString('id-ID')}</div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">@{u.username}</td>
                        <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${u.role === 'Administrator' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200/20' : 'bg-emerald-100 text-emerald-800 border border-emerald-200/20'}`}>
                            {u.role === 'Administrator' ? <Shield className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 bg-white/50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-white/50 rounded-xl transition-all hover:scale-105 cursor-pointer"
                              title="Edit Pengguna"
                              id={`btn-edit-user-${u.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 bg-white/50 hover:bg-rose-600 text-rose-600 hover:text-white border border-white/50 rounded-xl transition-all hover:scale-105 cursor-pointer"
                              title="Hapus Pengguna"
                              id={`btn-delete-user-${u.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* User Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn" id="user-modal">
          <div className="glass-panel-heavy rounded-3xl border border-white/50 max-w-md w-full overflow-hidden shadow-2xl relative animate-scaleIn">
            
            {/* Modal Header */}
            <div className="bg-indigo-950/90 backdrop-blur-md text-white px-6 py-4.5 rounded-t-3xl flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black tracking-tight">
                  {editId ? 'Ubah Data Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition text-indigo-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: drg. Ahmad Fauzi"
                  value={namaLengkap}
                  onChange={e => setNamaLengkap(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/40 border border-white/50 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/80 transition-all font-medium shadow-xs"
                />
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Username *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-sm">@</span>
                  <input
                    type="text"
                    required
                    placeholder="fauzi123"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full pl-8 pr-3.5 py-2.5 bg-white/40 border border-white/50 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/80 transition-all font-medium shadow-xs font-mono"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="nama@dentasync.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white/40 border border-white/50 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/80 transition-all font-medium shadow-xs"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Hak Akses (Role)</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as 'Administrator' | 'Petugas Pemeriksa')}
                  className="w-full px-3.5 py-2.5 bg-white/40 border border-white/50 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/80 transition-all font-semibold shadow-xs cursor-pointer"
                >
                  <option value="Administrator">Administrator</option>
                  <option value="Petugas Pemeriksa">Petugas Pemeriksa</option>
                </select>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Password {editId ? '(Kosongkan jika tidak diubah)' : '*'}
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder={editId ? "Ubah password..." : "Masukkan password baru..."}
                    value={passwordPlain}
                    onChange={e => setPasswordPlain(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white/40 border border-white/50 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/80 transition-all font-medium shadow-xs"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/25 transition cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
