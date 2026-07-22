import React from 'react';
import { Award, CheckCircle, AlertTriangle, Users, BookOpen, Briefcase, ChevronRight, HelpCircle, FileBarChart2, FileDown, FileSpreadsheet } from 'lucide-react';
import { RespondentData } from '../types';
import { calculateSurveyStats, exportToPdf, exportToExcel } from '../lib/surveyEngine';

interface DashboardProps {
  respondents: RespondentData[];
}

export default function Dashboard({ respondents }: DashboardProps) {
  const stats = calculateSurveyStats(respondents);

  if (respondents.length === 0) {
    return (
      <div className="text-center py-16 glass-panel rounded-3xl max-w-3xl mx-auto p-8 animate-fadeIn" id="dashboard-empty-state">
        <div className="w-16 h-16 bg-white/50 backdrop-blur-md text-purple-600 border border-white/50 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
          <FileBarChart2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900">Belum Ada Data Terkumpul</h3>
        <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto leading-relaxed">
          Sesi ini masih kosong. Silakan masuk ke tab <strong>"Input Pemeriksaan"</strong> untuk merekam data responden pertama Anda, atau buka tab <strong>"Koneksi Cloud"</strong> untuk memuat data simulasi 30 Oktober 2025.
        </p>
      </div>
    );
  }

  // Helper for progress bar
  const ProgressBar = ({ label, count, pct, colorClass = 'bg-purple-600' }: { label: string, count: number, pct: number, colorClass?: string, key?: React.Key }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-semibold">
        <span className="text-slate-700 truncate max-w-[180px] font-medium">{label}</span>
        <span className="text-slate-900 font-bold font-mono">{count} <span className="text-[10px] font-normal text-slate-500">org</span> ({pct.toFixed(1)}%)</span>
      </div>
      <div className="w-full bg-black/5 h-2.5 rounded-full overflow-hidden border border-white/20 backdrop-blur-xs">
        <div style={{ width: `${pct}%` }} className={`${colorClass} h-full rounded-full transition-all duration-500 shadow-xs`} />
      </div>
    </div>
  );

  // WHO Severity class finder for DMF-T
  const getSeverity = (index: number) => {
    if (index === 0) return { label: 'Bebas Karies', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', desc: 'Sangat baik, tidak ada pengalaman karies.' };
    if (index < 1.2) return { label: 'Sangat Rendah', color: 'bg-green-50 text-green-700 border-green-200', desc: 'Tingkat karies sangat rendah menurut standar WHO.' };
    if (index < 2.7) return { label: 'Rendah', color: 'bg-amber-50 text-amber-700 border-amber-200', desc: 'Tingkat karies terkendali, pertahankan kebersihan mulut.' };
    if (index < 4.5) return { label: 'Sedang', color: 'bg-orange-50 text-orange-700 border-orange-200', desc: 'Karies sedang, perlu peningkatan tindakan tumpat/segel.' };
    return { label: 'Tinggi / Sangat Tinggi', color: 'bg-rose-50 text-rose-700 border-rose-200', desc: 'Indeks tinggi, memerlukan tindakan preventif dan kuratif masif.' };
  };

  const dmftSeverity = getSeverity(stats.indexAvg.dmft);
  const deftSeverity = getSeverity(stats.indexAvg.deft);

  // Sort breakdowns for clean rendering
  const sortedEdu = Object.entries(stats.pendidikanBreakdown)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  
  const sortedJob = Object.entries(stats.pekerjaanBreakdown)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-2 animate-fadeIn" id="dashboard-root">
      {/* Export Action Header */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl shadow-sm border border-white/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" id="dashboard-export-header">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileBarChart2 className="w-5 h-5 text-purple-600" />
            Ringkasan Analisis & Ekspor Laporan
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Unduh rekapitulasi data pemeriksaan dalam format PDF resmi atau file Excel mentah (.xlsx).
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => exportToPdf(respondents, 'Sesi Utama')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer hover:scale-[1.02]"
            id="btn-dashboard-export-pdf"
            title="Ekspor Laporan PDF Lengkap"
          >
            <FileDown className="w-4 h-4" />
            <span>Ekspor PDF</span>
          </button>

          <button
            onClick={() => exportToExcel(respondents, 'Sesi Utama')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer hover:scale-[1.02]"
            id="btn-dashboard-export-excel"
            title="Ekspor Data Excel Mentah (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-grid">
        <div className="glass-panel p-5 rounded-2xl shadow-md shadow-purple-950/5 hover:scale-[1.02] hover:bg-white/60 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Responden</span>
            <span className="p-1.5 bg-purple-50/60 backdrop-blur-md text-purple-600 rounded-xl"><Users className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-950 font-mono tracking-tight">{stats.totalRespondents}</span>
            <span className="text-[11px] font-medium text-slate-500">Orang terdata</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-md shadow-purple-950/5 hover:scale-[1.02] hover:bg-white/60 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rata-Rata def-t</span>
            <span className="p-1.5 bg-emerald-50/60 backdrop-blur-md text-emerald-600 rounded-xl"><CheckCircle className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 font-mono tracking-tight">{stats.indexAvg.deft.toFixed(2)}</span>
            <span className="text-[10px] text-emerald-700/80 font-bold font-mono">d:{stats.indexAvg.d.toFixed(1)} e:{stats.indexAvg.e.toFixed(1)} f:{stats.indexAvg.f.toFixed(1)}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-md shadow-purple-950/5 hover:scale-[1.02] hover:bg-white/60 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rata-Rata DMF-T</span>
            <span className="p-1.5 bg-purple-50/60 backdrop-blur-md text-purple-500 rounded-xl"><Award className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-600 font-mono tracking-tight">{stats.indexAvg.dmft.toFixed(2)}</span>
            <span className="text-[10px] text-purple-700/80 font-bold font-mono">D:{stats.indexAvg.D.toFixed(1)} M:{stats.indexAvg.M.toFixed(1)} F:{stats.indexAvg.F.toFixed(1)}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-md shadow-purple-950/5 hover:scale-[1.02] hover:bg-white/60 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tingkat Rujukan</span>
            <span className="p-1.5 bg-rose-50/60 backdrop-blur-md text-rose-500 rounded-xl"><AlertTriangle className="w-4 h-4" /></span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 font-mono tracking-tight">{((stats.tindakLanjutPct.perluDirujuk || 0) * 100).toFixed(1)}%</span>
            <span className="text-[11px] font-medium text-slate-500">Butuh intervensi</span>
          </div>
        </div>
      </div>

      {/* Main Analysis Tabular Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gigi Sulung & Tetap comparative table */}
        <div className="glass-panel rounded-3xl p-6 shadow-md space-y-4 lg:col-span-2" id="teeth-state-table-container">
          <div className="border-b border-white/30 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">I. Rata-Rata Temuan Klinis Gigi & Mulut</h3>
            <span className="text-[9px] bg-white/60 text-purple-700 border border-purple-100/30 font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">Tabel Komparasi</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/30 text-slate-600 border-b border-white/40">
                  <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">Kategori Keadaan Gigi</th>
                  <th className="py-3 px-3 text-right font-bold uppercase tracking-wider text-[10px]">Rata-Rata Gigi Sulung (def-t)</th>
                  <th className="py-3 px-3 text-right font-bold uppercase tracking-wider text-[10px]">Rata-Rata Gigi Tetap (DMF-T)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20 text-slate-700">
                <tr className="hover:bg-white/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">Gigi Sehat</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-extrabold">{stats.gigiSulungAvg.sehat.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-extrabold">{stats.gigiTetapAvg.sehat.toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-white/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">Gigi Berlubang / Karies (d / D)</td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-extrabold">{stats.gigiSulungAvg.karies.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-600 font-extrabold">{stats.gigiTetapAvg.karies.toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-white/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">Gigi dicabut karena karies (e / M)</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-600 font-bold">{stats.gigiSulungAvg.dicabutKaries.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-600 font-bold">{stats.gigiTetapAvg.dicabutKaries.toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-white/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">Tumpatan dengan karies</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">{stats.gigiSulungAvg.tumpatanKaries.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">{stats.gigiTetapAvg.tumpatanKaries.toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-white/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">Tumpatan tanpa karies (f / F)</td>
                  <td className="py-2.5 px-3 text-right font-mono text-indigo-600 font-bold">{stats.gigiSulungAvg.tumpatanTanpaKaries.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-indigo-600 font-bold">{stats.gigiTetapAvg.tumpatanTanpaKaries.toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-white/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">Gigi dicabut sebab lain</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">{stats.gigiSulungAvg.dicabutSebabLain.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">{stats.gigiTetapAvg.dicabutSebabLain.toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-white/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">Fissure Sealant</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">{stats.gigiSulungAvg.fissureSealant.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">{stats.gigiTetapAvg.fissureSealant.toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-white/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">Protesa cekat/mahkota/implan/veneer</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">{stats.gigiSulungAvg.protesaCekat.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">{stats.gigiTetapAvg.protesaCekat.toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-white/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">Gigi tidak tumbuh</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">{stats.gigiSulungAvg.tidakTumbuh.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">{stats.gigiTetapAvg.tidakTumbuh.toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-white/30 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">Gigi sudah tanggal (K)</td>
                  <td className="py-2.5 px-3 text-right font-mono text-cyan-700 font-bold">{(stats.gigiSulungAvg.sudahTanggal || 0).toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">-</td>
                </tr>
                <tr className="hover:bg-white/40 bg-white/20 font-bold border-t-2 border-indigo-200">
                  <td className="py-3 px-3 font-bold text-indigo-950">Indeks Karies Gabungan (def-t / DMF-T)</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600 font-extrabold text-sm">{stats.indexAvg.deft.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right font-mono text-indigo-600 font-extrabold text-sm">{stats.indexAvg.dmft.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Interpretasi Klinis Box */}
        <div className="glass-panel rounded-3xl p-6 shadow-md space-y-4 flex flex-col justify-between" id="clinical-interpretation-card">
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-purple-950 border-b border-white/30 pb-3 uppercase tracking-wider">II. Interpretasi Epidemiologis</h3>
            
            {/* DMF-T Level */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Keparahan Karies Gigi Tetap (DMF-T)</span>
              <div className={`p-3 rounded-2xl border font-bold text-xs flex justify-between items-center shadow-xs backdrop-blur-md ${dmftSeverity.color}`}>
                <span>DMF-T: {stats.indexAvg.dmft.toFixed(2)}</span>
                <span className="uppercase text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full bg-white/80 text-slate-900 border border-white/40 shadow-xs">{dmftSeverity.label}</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{dmftSeverity.desc}</p>
            </div>

            {/* def-t Level */}
            <div className="space-y-2 pt-4 border-t border-white/20">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Keparahan Karies Gigi Sulung (def-t)</span>
              <div className={`p-3 rounded-2xl border font-bold text-xs flex justify-between items-center shadow-xs backdrop-blur-md ${deftSeverity.color}`}>
                <span>def-t: {stats.indexAvg.deft.toFixed(2)}</span>
                <span className="uppercase text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full bg-white/80 text-slate-900 border border-white/40 shadow-xs">{deftSeverity.label}</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{deftSeverity.desc}</p>
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/50 text-xs text-slate-700 space-y-2 shadow-xs">
            <strong className="text-purple-950 font-extrabold block uppercase tracking-wide text-[10px]">Indeks Kesehatan Gusi & Mukosa</strong>
            <div className="flex justify-between items-center font-medium">
              <span>Gusi Berdarah (BOP)</span>
              <span className="font-mono text-slate-900 font-extrabold bg-rose-100/50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200/20">{((stats.mukosaPct.gusiBerdarah || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center font-medium">
              <span>Lesi Mukosa Oral</span>
              <span className="font-mono text-slate-900 font-extrabold bg-amber-100/50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200/20">{((stats.mukosaPct.lesiMukosaOral || 0) * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Demographics Visualization (Custom SVG Charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gender Breakdown (Donut SVG Chart) */}
        <div className="glass-panel rounded-3xl p-6 shadow-md space-y-4" id="gender-chart-container">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-emerald-500 rounded-full" /> Karakteristik Jenis Kelamin
          </h4>
          
          <div className="flex items-center justify-around py-2">
            {/* Custom SVG Donut */}
            <div className="relative w-28 h-28">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                {stats.genderFilledCount > 0 && (
                  <>
                    {/* Laki-laki segment */}
                    <circle
                      cx="18" cy="18" r="15.915" fill="none"
                      stroke="#a855f7" strokeWidth="3.5"
                      strokeDasharray={`${(stats.genderBreakdown['Laki-laki'] / stats.genderFilledCount) * 100} ${100 - ((stats.genderBreakdown['Laki-laki'] / stats.genderFilledCount) * 100)}`}
                      strokeDashoffset="0"
                    />
                    {/* Perempuan segment */}
                    <circle
                      cx="18" cy="18" r="15.915" fill="none"
                      stroke="#ec4899" strokeWidth="3.5"
                      strokeDasharray={`${(stats.genderBreakdown['Perempuan'] / stats.genderFilledCount) * 100} ${100 - ((stats.genderBreakdown['Perempuan'] / stats.genderFilledCount) * 100)}`}
                      strokeDashoffset={`${-((stats.genderBreakdown['Laki-laki'] / stats.genderFilledCount) * 100)}`}
                    />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                <span className="text-base font-black text-slate-900 font-mono">{stats.genderFilledCount}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-600 rounded-full shadow-md shadow-purple-600/30" />
                <div className="text-xs">
                  <span className="text-slate-500 block font-medium">Laki-laki</span>
                  <strong className="text-slate-800 font-extrabold font-mono">{stats.genderBreakdown['Laki-laki']} org ({stats.genderFilledCount ? ((stats.genderBreakdown['Laki-laki'] / stats.genderFilledCount) * 100).toFixed(0) : 0}%)</strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-pink-500 rounded-full shadow-md shadow-pink-500/30" />
                <div className="text-xs">
                  <span className="text-slate-500 block font-medium">Perempuan</span>
                  <strong className="text-slate-800 font-extrabold font-mono">{stats.genderBreakdown['Perempuan']} org ({stats.genderFilledCount ? ((stats.genderBreakdown['Perempuan'] / stats.genderFilledCount) * 100).toFixed(0) : 0}%)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Age Group Breakdown (Vertical SVG bar charts) */}
        <div className="glass-panel rounded-3xl p-6 shadow-md space-y-4" id="age-chart-container">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-purple-500 rounded-full" /> Distribusi Kelompok Umur
          </h4>

          <div className="space-y-3 py-1">
            <ProgressBar
              label="5-10 tahun (anak-anak)"
              count={stats.ageGroupBreakdown['5-10']}
              pct={stats.ageGroupFilledCount ? (stats.ageGroupBreakdown['5-10'] / stats.ageGroupFilledCount) * 100 : 0}
              colorClass="bg-gradient-to-r from-emerald-400 to-emerald-600"
            />
            <ProgressBar
              label="10-18 tahun (remaja)"
              count={stats.ageGroupBreakdown['10-18']}
              pct={stats.ageGroupFilledCount ? (stats.ageGroupBreakdown['10-18'] / stats.ageGroupFilledCount) * 100 : 0}
              colorClass="bg-gradient-to-r from-purple-400 to-purple-600"
            />
            <ProgressBar
              label="18-60 tahun (produktif)"
              count={stats.ageGroupBreakdown['18-60']}
              pct={stats.ageGroupFilledCount ? (stats.ageGroupBreakdown['18-60'] / stats.ageGroupFilledCount) * 100 : 0}
              colorClass="bg-gradient-to-r from-amber-400 to-amber-600"
            />
            <ProgressBar
              label="60 tahun ke atas (lansia)"
              count={stats.ageGroupBreakdown['60+']}
              pct={stats.ageGroupFilledCount ? (stats.ageGroupBreakdown['60+'] / stats.ageGroupFilledCount) * 100 : 0}
              colorClass="bg-gradient-to-r from-rose-400 to-rose-600"
            />
          </div>
        </div>

        {/* RTL & Referral Distribution */}
        <div className="glass-panel rounded-3xl p-6 shadow-md space-y-4" id="rtl-chart-container">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-rose-500 rounded-full" /> Rencana Tindak Lanjut (RTL)
          </h4>

          <div className="space-y-3.5 text-xs font-medium text-slate-700">
            <div className="flex justify-between items-center py-1 border-b border-white/20">
              <span className="text-slate-600">Perlu Perawatan Segera</span>
              <strong className="font-mono text-rose-600 font-extrabold">{((stats.tindakLanjutPct.perluPerawatanSegera || 0) * 100).toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/20">
              <span className="text-slate-600">Perlu Perawatan Tidak Segera</span>
              <strong className="font-mono text-amber-600 font-extrabold">{((stats.tindakLanjutPct.perluPerawatanTidakSegera || 0) * 100).toFixed(1)}%</strong>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-white/20">
              <span className="text-slate-600">Memerlukan Rujukan Klinis</span>
              <strong className="font-mono text-purple-600 font-extrabold">{((stats.tindakLanjutPct.perluDirujuk || 0) * 100).toFixed(1)}%</strong>
            </div>

            {stats.tindakLanjutPct.perluDirujuk > 0 && (
              <div className="mt-2.5 space-y-2 bg-white/40 backdrop-blur-md p-3 rounded-2xl border border-white/50 shadow-xs">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Faskes Rujukan Terpilih</span>
                {stats.tindakLanjutPct.dirujukKePuskesmas > 0 && (
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>Puskesmas</span>
                    <strong className="font-mono text-slate-800 font-bold">{((stats.tindakLanjutPct.dirujukKePuskesmas || 0) * 100).toFixed(1)}%</strong>
                  </div>
                )}
                {stats.tindakLanjutPct.dirujukKeRSUmum > 0 && (
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>RS Umum</span>
                    <strong className="font-mono text-slate-800 font-bold">{((stats.tindakLanjutPct.dirujukKeRSUmum || 0) * 100).toFixed(1)}%</strong>
                  </div>
                )}
                {stats.tindakLanjutPct.dirujukKeRSGM > 0 && (
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>RSGM / RS Gigi & Mulut</span>
                    <strong className="font-mono text-slate-800 font-bold">{((stats.tindakLanjutPct.dirujukKeRSGM || 0) * 100).toFixed(1)}%</strong>
                  </div>
                )}
                {stats.tindakLanjutPct.dirujukKeKlinikPratama > 0 && (
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>Klinik Pratama</span>
                    <strong className="font-mono text-slate-800 font-bold">{((stats.tindakLanjutPct.dirujukKeKlinikPratama || 0) * 100).toFixed(1)}%</strong>
                  </div>
                )}
                {stats.tindakLanjutPct.dirujukKeKlinikUtama > 0 && (
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>Klinik Utama</span>
                    <strong className="font-mono text-slate-800 font-bold">{((stats.tindakLanjutPct.dirujukKeKlinikUtama || 0) * 100).toFixed(1)}%</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Social Demographics Detail Progress Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pendidikan List */}
        <div className="glass-panel rounded-3xl p-6 shadow-md space-y-4" id="education-chart-container">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-purple-600" /> Pendidikan Terakhir / Orang Tua
          </h4>
          <div className="space-y-3.5">
            {sortedEdu.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Data pendidikan tidak tersedia</p>
            ) : (
              sortedEdu.map(([eduName, count]) => (
                <ProgressBar
                  key={eduName}
                  label={eduName}
                  count={count}
                  pct={stats.pendidikanFilledCount ? (count / stats.pendidikanFilledCount) * 100 : 0}
                  colorClass="bg-gradient-to-r from-purple-500 to-purple-600"
                />
              ))
            )}
          </div>
        </div>

        {/* Pekerjaan List */}
        <div className="glass-panel rounded-3xl p-6 shadow-md space-y-4" id="occupation-chart-container">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-emerald-600" /> Pekerjaan / Orang Tua
          </h4>
          <div className="space-y-3.5">
            {sortedJob.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Data pekerjaan tidak tersedia</p>
            ) : (
              sortedJob.map(([jobName, count]) => (
                <ProgressBar
                  key={jobName}
                  label={jobName}
                  count={count}
                  pct={stats.pekerjaanFilledCount ? (count / stats.pekerjaanFilledCount) * 100 : 0}
                  colorClass="bg-gradient-to-r from-emerald-500 to-emerald-600"
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
