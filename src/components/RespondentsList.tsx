import React, { useState } from 'react';
import { Search, Trash2, Eye, Edit, ShieldAlert, CheckCircle2, User, ChevronLeft, ChevronRight, X, Heart, AlertCircle, Sparkles, FileDown, FileSpreadsheet, Users } from 'lucide-react';
import { RespondentData } from '../types';
import Odontogram from './Odontogram';
import { exportToPdf, exportToExcel } from '../lib/surveyEngine';

interface RespondentsListProps {
  respondents: RespondentData[];
  onDeleteRespondent: (id: string) => Promise<void>;
  onEditRespondent?: (respondent: RespondentData) => void;
}

export default function RespondentsList({ respondents, onDeleteRespondent, onEditRespondent }: RespondentsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [ageGroupFilter, setAgeGroupFilter] = useState('all');
  const [referralFilter, setReferralFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  
  const [selectedRespondent, setSelectedRespondent] = useState<RespondentData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Handle Filtering
  const filtered = respondents.filter(r => {
    const matchesSearch = r.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = genderFilter === 'all' || r.jenisKelamin === genderFilter;
    const matchesAgeGroup = ageGroupFilter === 'all' || r.kelompokUmur === ageGroupFilter;
    
    let matchesReferral = true;
    if (referralFilter === 'rujuk') matchesReferral = r.tindakLanjut.perluDirujuk;
    else if (referralFilter === 'tidak') matchesReferral = !r.tindakLanjut.perluDirujuk;
    
    const examDate = r.tanggalPemeriksaan || r.tanggalInput;
    const matchesStartDate = !startDateFilter || examDate >= startDateFilter;
    const matchesEndDate = !endDateFilter || examDate <= endDateFilter;
    
    return matchesSearch && matchesGender && matchesAgeGroup && matchesReferral && matchesStartDate && matchesEndDate;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data responden "${name}"? Tindakan ini akan menghapusnya dari cloud secara permanen.`)) {
      try {
        await onDeleteRespondent(id);
      } catch (err) {
        console.error("Gagal menghapus:", err);
        alert("Gagal menghapus responden dari Cloud Firestore.");
      }
    }
  };

  // Safe division helper
  const renderIndexBadge = (val: number, limit: number) => {
    let color = 'bg-slate-50 text-slate-700 border-slate-200';
    if (val > 0 && val < limit) color = 'bg-amber-50 text-amber-700 border-amber-200';
    else if (val >= limit) color = 'bg-rose-50 text-rose-700 border-rose-200';
    return <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full border ${color}`}>{val}</span>;
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto p-2" id="respondents-list-root">
      {/* Export & Data Header */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl shadow-sm border border-white/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" id="respondents-export-header">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Data Responden ({filtered.length} Terpilih / {respondents.length} Total)
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Daftar lengkap hasil pemeriksaan. Ekspor data terfilter atau seluruh data responden secara langsung.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              const dataToExport = filtered.length > 0 ? filtered : respondents;
              if (dataToExport.length === 0) return alert("Tidak ada data untuk diekspor!");
              const desc = filtered.length !== respondents.length ? `Data Terfilter (${filtered.length}/${respondents.length})` : 'Semua Data';
              exportToPdf(dataToExport, 'Data Responden', { filterDescription: desc });
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer hover:scale-[1.02]"
            id="btn-list-export-pdf"
            title="Unduh Laporan Hasil Survey PDF"
          >
            <FileDown className="w-4 h-4" />
            <span>Ekspor PDF</span>
          </button>

          <button
            onClick={() => {
              const dataToExport = filtered.length > 0 ? filtered : respondents;
              if (dataToExport.length === 0) return alert("Tidak ada data untuk diekspor!");
              const desc = filtered.length !== respondents.length ? `Data Terfilter (${filtered.length}/${respondents.length})` : 'Semua Data';
              exportToExcel(dataToExport, 'Data Responden', { filterDescription: desc });
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer hover:scale-[1.02]"
            id="btn-list-export-excel"
            title="Unduh Data Mentah Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Filtering Header */}
      <div className="glass-panel p-5 rounded-2xl shadow-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 border border-white/40" id="filters-container">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-purple-600/70" />
          <input
            type="text"
            placeholder="Cari nama responden..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white/40 border border-white/50 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white/80 transition-all font-medium shadow-xs"
          />
        </div>

        {/* Gender */}
        <select
          value={genderFilter}
          onChange={e => { setGenderFilter(e.target.value); setCurrentPage(1); }}
          className="px-3.5 py-2.5 bg-white/40 border border-white/50 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white/80 transition-all font-semibold shadow-xs cursor-pointer"
        >
          <option value="all">Semua Jenis Kelamin</option>
          <option value="Laki-laki">Laki-laki</option>
          <option value="Perempuan">Perempuan</option>
        </select>

        {/* Age Group */}
        <select
          value={ageGroupFilter}
          onChange={e => { setAgeGroupFilter(e.target.value); setCurrentPage(1); }}
          className="px-3.5 py-2.5 bg-white/40 border border-white/50 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white/80 transition-all font-semibold shadow-xs cursor-pointer"
        >
          <option value="all">Semua Kelompok Umur</option>
          <option value="5-10">Anak-anak (5-10 th)</option>
          <option value="10-18">Remaja (10-18 th)</option>
          <option value="18-60">Produktif (18-60 th)</option>
          <option value="60+">Lansia (60+ th)</option>
        </select>

        {/* Referral Status */}
        <select
          value={referralFilter}
          onChange={e => { setReferralFilter(e.target.value); setCurrentPage(1); }}
          className="px-3.5 py-2.5 bg-white/40 border border-white/50 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white/80 transition-all font-semibold shadow-xs cursor-pointer"
        >
          <option value="all">Semua Status Rujukan</option>
          <option value="rujuk">Memerlukan Rujukan</option>
          <option value="tidak">Tidak Perlu Rujukan</option>
        </select>

        {/* Start Date */}
        <div className="flex flex-col gap-1">
          <input
            type="date"
            value={startDateFilter}
            onChange={e => { setStartDateFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3.5 py-2.5 bg-white/40 border border-white/50 rounded-xl text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white/80 transition-all font-semibold shadow-xs cursor-pointer"
            title="Mulai Tanggal Pemeriksaan"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1">
          <input
            type="date"
            value={endDateFilter}
            onChange={e => { setEndDateFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3.5 py-2.5 bg-white/40 border border-white/50 rounded-xl text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white/80 transition-all font-semibold shadow-xs cursor-pointer"
            title="Sampai Tanggal Pemeriksaan"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel rounded-3xl shadow-lg border border-white/30 overflow-hidden" id="respondents-table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/30 text-slate-600 border-b border-white/30 font-bold uppercase tracking-wider">
                <th className="py-4 px-4 text-[10px]">Nama Responden</th>
                <th className="py-4 px-3 text-[10px]">Umur</th>
                <th className="py-4 px-3 text-[10px]">Gender</th>
                <th className="py-4 px-3 text-[10px] text-center">Indeks def-t</th>
                <th className="py-4 px-3 text-[10px] text-center">Indeks DMF-T</th>
                <th className="py-4 px-3 text-[10px]">Mukosa</th>
                <th className="py-4 px-3 text-[10px]">Tindak Lanjut</th>
                <th className="py-4 px-4 text-[10px] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20 text-slate-700">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-bold bg-white/25">
                    Tidak ada responden yang cocok dengan kriteria pencarian atau filter.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((r) => (
                  <tr key={r.id} className="hover:bg-white/30 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-purple-950 truncate max-w-[150px]" title={r.nama}>
                      <div className="font-extrabold text-purple-950">{r.nama}</div>
                      {r.namaOrangTua && (
                        <div className="text-[10px] text-slate-500 font-semibold truncate dark:text-slate-400">Ortu: {r.namaOrangTua}</div>
                      )}
                      <div className="text-[10px] text-slate-400 font-medium truncate" title={r.alamat || '-'}>
                        {r.alamat || '-'} {r.noTelepon ? `| Telp: ${r.noTelepon}` : ''}
                      </div>
                      <div className="text-[9px] text-purple-600 dark:text-purple-400 font-mono font-bold mt-0.5">Tgl: {r.tanggalPemeriksaan || r.tanggalInput}</div>
                    </td>
                    <td className="py-3.5 px-3 font-bold font-mono text-slate-800">{r.umur} th</td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${r.jenisKelamin === 'Laki-laki' ? 'bg-purple-100/50 text-purple-800 border border-purple-200/20' : 'bg-pink-100/50 text-pink-800 border border-pink-200/20'}`}>
                        {r.jenisKelamin}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {renderIndexBadge(r.deft, 3)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {renderIndexBadge(r.dmft, 2)}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col gap-0.5 text-[10px]">
                        {r.mukosa.gusiBerdarah && <span className="text-rose-600 font-bold">• Gusi Berdarah</span>}
                        {r.mukosa.lesiMukosaOral && <span className="text-amber-600 font-bold">• Lesi Mukosa</span>}
                        {!r.mukosa.gusiBerdarah && !r.mukosa.lesiMukosaOral && <span className="text-slate-400 font-medium">Sehat</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      {r.tindakLanjut.perluDirujuk ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-800 bg-rose-100/40 border border-rose-200/20 px-2.5 py-1 rounded-full">
                          Rujuk ({r.tindakLanjut.dirujukKe.toUpperCase().replace('_', ' ')})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/40 border border-emerald-200/20 px-2.5 py-1 rounded-full">
                          Perawatan Mandiri
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedRespondent(r)}
                          className="p-1.5 bg-white/50 hover:bg-purple-600 text-purple-600 hover:text-white border border-white/50 rounded-xl transition-all hover:scale-105 cursor-pointer"
                          title="Lihat Detail Pemeriksaan"
                          id={`btn-view-${r.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditRespondent && onEditRespondent(r)}
                          className="p-1.5 bg-white/50 hover:bg-amber-500 text-amber-500 hover:text-white border border-white/50 rounded-xl transition-all hover:scale-105 cursor-pointer"
                          title="Ubah Data Responden"
                          id={`btn-edit-${r.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id!, r.nama)}
                          className="p-1.5 bg-white/50 hover:bg-rose-600 text-rose-600 hover:text-white border border-white/50 rounded-xl transition-all hover:scale-105 cursor-pointer"
                          title="Hapus Responden"
                          id={`btn-delete-${r.id}`}
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="bg-white/20 border-t border-white/25 px-4 py-3.5 flex items-center justify-between" id="pagination-controls">
            <span className="text-xs text-slate-600 font-semibold">
              Menampilkan <strong>{startIndex + 1}</strong> - <strong>{Math.min(startIndex + itemsPerPage, filtered.length)}</strong> dari <strong>{filtered.length}</strong> responden
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 bg-white/50 border border-white/60 rounded-xl text-slate-700 hover:bg-white/90 disabled:opacity-30 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-purple-950 px-2 font-mono">Halaman {currentPage} / {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 bg-white/50 border border-white/60 rounded-xl text-slate-700 hover:bg-white/90 disabled:opacity-30 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Detail Modal (Dental Record Map) */}
      {selectedRespondent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn" id="respondent-detail-modal">
          <div className="glass-panel-heavy rounded-3xl border border-white/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-scaleIn">
            
            {/* Modal Header */}
            <div className="bg-purple-950/90 backdrop-blur-md text-white px-6 py-4.5 rounded-t-3xl flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-300 shadow-inner">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">{selectedRespondent.nama}</h3>
                  <p className="text-[10px] text-purple-200 font-extrabold font-mono tracking-wide">Umur: {selectedRespondent.umur} Tahun | Gender: {selectedRespondent.jenisKelamin}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRespondent(null)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition text-purple-200 cursor-pointer"
                id="btn-close-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-sm text-slate-700">
              
              {/* Characteristics Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 bg-white/40 p-4 rounded-2xl border border-white/50 shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pendidikan</span>
                  <span className="text-xs font-bold text-purple-950">{selectedRespondent.pendidikan || 'Tidak Sekolah'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pekerjaan</span>
                  <span className="text-xs font-bold text-purple-950">{selectedRespondent.pekerjaan || 'Tidak Bekerja'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Alamat</span>
                  <span className="text-xs font-bold text-purple-950 truncate block" title={selectedRespondent.alamat || '-'}>{selectedRespondent.alamat || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">No. Telepon</span>
                  <span className="text-xs font-bold text-purple-950 truncate block" title={selectedRespondent.noTelepon || '-'}>{selectedRespondent.noTelepon || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Nama Orang Tua</span>
                  <span className="text-xs font-bold text-purple-950 truncate block" title={selectedRespondent.namaOrangTua || '-'}>{selectedRespondent.namaOrangTua || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Tgl Pemeriksaan</span>
                  <span className="text-xs font-bold text-purple-950 block">{selectedRespondent.tanggalPemeriksaan || selectedRespondent.tanggalInput}</span>
                </div>
              </div>

              {/* Comparative Tooth Chart Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Primary Teeth */}
                <div className="border border-emerald-200/30 bg-emerald-50/20 p-4.5 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex justify-between items-center border-b border-emerald-200/20 pb-2">
                    <span className="font-extrabold text-emerald-900 text-xs uppercase tracking-wider">I. Gigi Sulung (Deciduous)</span>
                    <span className="bg-emerald-100 text-emerald-800 font-mono text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200/20">def-t: {selectedRespondent.deft}</span>
                  </div>
                  <div className="space-y-2 text-xs font-medium">
                    <div className="flex justify-between text-slate-600">
                      <span>Sehat</span>
                      <strong className="font-mono text-slate-900 font-black">{selectedRespondent.gigiSulung.sehat}</strong>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>Berlubang / Karies (d)</span>
                      <strong className="font-mono font-black">{selectedRespondent.gigiSulung.karies}</strong>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Dicabut karies (e)</span>
                      <strong className="font-mono font-black">{selectedRespondent.gigiSulung.dicabutKaries}</strong>
                    </div>
                    <div className="flex justify-between text-purple-600">
                      <span>Tumpatan tanpa karies (f)</span>
                      <strong className="font-mono font-black">{selectedRespondent.gigiSulung.tumpatanTanpaKaries}</strong>
                    </div>
                    {selectedRespondent.gigiSulung.tumpatanKaries > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Tumpatan dgn karies</span>
                        <strong className="font-mono font-black">{selectedRespondent.gigiSulung.tumpatanKaries}</strong>
                      </div>
                    )}
                    {(selectedRespondent.gigiSulung.sudahTanggal ?? 0) > 0 && (
                      <div className="flex justify-between text-cyan-700 font-bold">
                        <span>Gigi Sudah Tanggal (K)</span>
                        <strong className="font-mono font-black">{selectedRespondent.gigiSulung.sudahTanggal}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Permanent Teeth */}
                <div className="border border-purple-200/30 bg-purple-50/20 p-4.5 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex justify-between items-center border-b border-purple-200/20 pb-2">
                    <span className="font-extrabold text-purple-900 text-xs uppercase tracking-wider">II. Gigi Tetap (Permanent)</span>
                    <span className="bg-purple-100 text-purple-800 font-mono text-[10px] font-black px-2.5 py-0.5 rounded-full border border-purple-200/20">DMF-T: {selectedRespondent.dmft}</span>
                  </div>
                  <div className="space-y-2 text-xs font-medium">
                    <div className="flex justify-between text-slate-600">
                      <span>Sehat</span>
                      <strong className="font-mono text-slate-900 font-black">{selectedRespondent.gigiTetap.sehat}</strong>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>Berlubang / Karies (D)</span>
                      <strong className="font-mono font-black">{selectedRespondent.gigiTetap.karies}</strong>
                    </div>
                    <div className="flex justify-between text-amber-600">
                      <span>Dicabut karies (M)</span>
                      <strong className="font-mono font-black">{selectedRespondent.gigiTetap.dicabutKaries}</strong>
                    </div>
                    <div className="flex justify-between text-purple-600">
                      <span>Tumpatan tanpa karies (F)</span>
                      <strong className="font-mono font-black">{selectedRespondent.gigiTetap.tumpatanTanpaKaries}</strong>
                    </div>
                    {selectedRespondent.gigiTetap.tumpatanKaries > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Tumpatan dgn karies</span>
                        <strong className="font-mono font-black">{selectedRespondent.gigiTetap.tumpatanKaries}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Visual Odontogram Record (Read-Only) */}
              <div className="border border-white/30 rounded-3xl overflow-hidden shadow-sm">
                <Odontogram 
                  teethStatus={selectedRespondent.teethStatus || {}} 
                  readOnly={true} 
                />
              </div>

              {/* Mukosa Detail & Follow Up Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-white/20 pt-5">
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Kondisi Mukosa Oral</span>
                  <div className="flex flex-col gap-1.5">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold border ${selectedRespondent.mukosa.gusiBerdarah ? 'text-rose-700 bg-rose-100/40 border-rose-200/20' : 'text-slate-600 bg-white/40 border-white/50'}`}>
                      {selectedRespondent.mukosa.gusiBerdarah ? '● Gusi Berdarah (BOP)' : '○ Gusi Sehat (Tanpa Berdarah)'}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold border ${selectedRespondent.mukosa.lesiMukosaOral ? 'text-amber-700 bg-amber-100/40 border-amber-200/20' : 'text-slate-600 bg-white/40 border-white/50'}`}>
                      {selectedRespondent.mukosa.lesiMukosaOral ? '● Ada Lesi Mukosa Oral' : '○ Mukosa Oral Normal'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Rencana Tindak Lanjut</span>
                  <div className="space-y-1.5 text-xs font-semibold">
                    {selectedRespondent.tindakLanjut.perluPerawatanSegera && (
                      <div className="flex items-center gap-2 text-rose-700 bg-rose-100/40 border border-rose-200/20 px-3 py-1.5 rounded-xl">
                        <AlertCircle className="w-4 h-4 text-rose-500" /> Perlu Perawatan Segera
                      </div>
                    )}
                    {selectedRespondent.tindakLanjut.perluPerawatanTidakSegera && (
                      <div className="flex items-center gap-2 text-amber-700 bg-amber-100/40 border border-amber-200/20 px-3 py-1.5 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-amber-500" /> Perlu Perawatan Rutin
                      </div>
                    )}
                    <div className={`p-3 rounded-2xl border ${selectedRespondent.tindakLanjut.perluDirujuk ? 'bg-rose-100/20 border-rose-200/20' : 'bg-emerald-100/20 border-emerald-200/20'}`}>
                      <strong className="block text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Rujukan Faskes</strong>
                      <span className="font-extrabold text-purple-950 text-xs">
                        {selectedRespondent.tindakLanjut.perluDirujuk 
                          ? `Dirujuk ke ${selectedRespondent.tindakLanjut.dirujukKe.toUpperCase().replace('_', ' ')}` 
                          : 'Tidak memerlukan rujukan lanjutan'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white/30 backdrop-blur-md px-6 py-4 rounded-b-3xl border-t border-white/20 flex justify-end">
              <button
                onClick={() => setSelectedRespondent(null)}
                className="px-4.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/10 cursor-pointer transition"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
