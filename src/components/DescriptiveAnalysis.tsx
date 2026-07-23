import React, { useMemo } from 'react';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  Printer, 
  FileDown, 
  Users, 
  Activity, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Heart, 
  FileText,
  FileSpreadsheet,
  Award,
  BookOpen
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { RespondentData } from '../types';
import { calculateSurveyStats, exportDescriptiveAnalysisToPdf, exportToExcel } from '../lib/surveyEngine';

interface DescriptiveAnalysisProps {
  respondents: RespondentData[];
  sessionName: string;
}

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#64748b'];

export default function DescriptiveAnalysis({ respondents, sessionName }: DescriptiveAnalysisProps) {
  const stats = useMemo(() => calculateSurveyStats(respondents), [respondents]);

  // Derived statistics for charts & tables
  const total = stats.totalRespondents;

  // 1. Umur distribution stats
  const ageStats = useMemo(() => {
    if (total === 0) return { min: 0, max: 0, avg: 0, median: 0 };
    const ages = respondents.map(r => r.umur).filter(u => typeof u === 'number' && !isNaN(u)).sort((a, b) => a - b);
    if (ages.length === 0) return { min: 0, max: 0, avg: 0, median: 0 };
    
    const sum = ages.reduce((a, b) => a + b, 0);
    const avg = sum / ages.length;
    const min = ages[0];
    const max = ages[ages.length - 1];
    const mid = Math.floor(ages.length / 2);
    const median = ages.length % 2 !== 0 ? ages[mid] : (ages[mid - 1] + ages[mid]) / 2;

    return { min, max, avg: parseFloat(avg.toFixed(1)), median };
  }, [respondents, total]);

  // Chart data: Kelompok Umur
  const ageGroupData = [
    { name: 'Anak (5-10 th)', count: stats.ageGroupBreakdown['5-10'] || 0 },
    { name: 'Remaja (10-18 th)', count: stats.ageGroupBreakdown['10-18'] || 0 },
    { name: 'Produktif (18-60 th)', count: stats.ageGroupBreakdown['18-60'] || 0 },
    { name: 'Lansia (60+ th)', count: stats.ageGroupBreakdown['60+'] || 0 },
  ];

  // Chart data: Gender
  const genderData = [
    { name: 'Laki-laki', value: stats.genderBreakdown['Laki-laki'] || 0 },
    { name: 'Perempuan', value: stats.genderBreakdown['Perempuan'] || 0 },
  ];

  // Chart data: Pendidikan Ortui Top
  const pendidikanData = Object.entries(stats.pendidikanBreakdown)
    .map(([name, count]) => ({ name, count: Number(count) }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);

  // Chart data: Pekerjaan Ortui Top
  const pekerjaanData = Object.entries(stats.pekerjaanBreakdown)
    .map(([name, count]) => ({ name, count: Number(count) }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);

  // Chart Data: Indeks def-t breakdown
  const deftData = [
    { name: 'd (Karies)', value: parseFloat((stats.indexAvg.d * total).toFixed(0)), avg: parseFloat(stats.indexAvg.d.toFixed(2)) },
    { name: 'e (Dicabut)', value: parseFloat((stats.indexAvg.e * total).toFixed(0)), avg: parseFloat(stats.indexAvg.e.toFixed(2)) },
    { name: 'f (Tumpatan)', value: parseFloat((stats.indexAvg.f * total).toFixed(0)), avg: parseFloat(stats.indexAvg.f.toFixed(2)) },
  ];

  // Chart Data: Indeks DMF-T breakdown
  const dmftData = [
    { name: 'D (Karies)', value: parseFloat((stats.indexAvg.D * total).toFixed(0)), avg: parseFloat(stats.indexAvg.D.toFixed(2)) },
    { name: 'M (Dicabut)', value: parseFloat((stats.indexAvg.M * total).toFixed(0)), avg: parseFloat(stats.indexAvg.M.toFixed(2)) },
    { name: 'F (Tumpatan)', value: parseFloat((stats.indexAvg.F * total).toFixed(0)), avg: parseFloat(stats.indexAvg.F.toFixed(2)) },
  ];

  // Chart Data: Mukosa
  const gusiBerdarahCount = Math.round(stats.mukosaPct.gusiBerdarah * total);
  const lesiCount = Math.round(stats.mukosaPct.lesiMukosaOral * total);
  const mukosaSehatCount = Math.max(0, total - Math.max(gusiBerdarahCount, lesiCount));

  const mukosaData = [
    { name: 'Mukosa Sehat', value: mukosaSehatCount },
    { name: 'Gusi Berdarah (BOP)', value: gusiBerdarahCount },
    { name: 'Lesi Mukosa Oral', value: lesiCount },
  ];

  // Chart Data: Rujukan
  const rujukanData = [
    { name: 'Puskesmas', count: Math.round(stats.tindakLanjutPct.dirujukKePuskesmas * total) },
    { name: 'RS Umum', count: Math.round(stats.tindakLanjutPct.dirujukKeRSUmum * total) },
    { name: 'RSGM', count: Math.round(stats.tindakLanjutPct.dirujukKeRSGM * total) },
    { name: 'Klinik Pratama', count: Math.round(stats.tindakLanjutPct.dirujukKeKlinikPratama * total) },
    { name: 'Klinik Utama', count: Math.round(stats.tindakLanjutPct.dirujukKeKlinikUtama * total) },
  ].filter(r => r.count > 0);

  // WHO Severity Category calculations
  let dmftCategory = 'Sangat Rendah (< 1.2)';
  let dmftSeverityBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (stats.indexAvg.dmft >= 1.2 && stats.indexAvg.dmft < 2.7) {
    dmftCategory = 'Rendah (1.2 - 2.6)';
    dmftSeverityBadge = 'bg-blue-100 text-blue-800 border-blue-300';
  } else if (stats.indexAvg.dmft >= 2.7 && stats.indexAvg.dmft < 4.5) {
    dmftCategory = 'Sedang (2.7 - 4.4)';
    dmftSeverityBadge = 'bg-amber-100 text-amber-800 border-amber-300';
  } else if (stats.indexAvg.dmft >= 4.5 && stats.indexAvg.dmft < 6.6) {
    dmftCategory = 'Tinggi (4.5 - 6.5)';
    dmftSeverityBadge = 'bg-orange-100 text-orange-800 border-orange-300';
  } else if (stats.indexAvg.dmft >= 6.6) {
    dmftCategory = 'Sangat Tinggi (>= 6.6)';
    dmftSeverityBadge = 'bg-rose-100 text-rose-800 border-rose-300';
  }

  let deftCategory = 'Sangat Rendah (< 1.2)';
  let deftSeverityBadge = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (stats.indexAvg.deft >= 1.2 && stats.indexAvg.deft < 2.7) {
    deftCategory = 'Rendah (1.2 - 2.6)';
    deftSeverityBadge = 'bg-blue-100 text-blue-800 border-blue-300';
  } else if (stats.indexAvg.deft >= 2.7 && stats.indexAvg.deft < 4.5) {
    deftCategory = 'Sedang (2.7 - 4.4)';
    deftSeverityBadge = 'bg-amber-100 text-amber-800 border-amber-300';
  } else if (stats.indexAvg.deft >= 4.5 && stats.indexAvg.deft < 6.6) {
    deftCategory = 'Tinggi (4.5 - 6.5)';
    deftSeverityBadge = 'bg-orange-100 text-orange-800 border-orange-300';
  } else if (stats.indexAvg.deft >= 6.6) {
    deftCategory = 'Sangat Tinggi (>= 6.6)';
    deftSeverityBadge = 'bg-rose-100 text-rose-800 border-rose-300';
  }

  // Dynamic Narrative Conclusion Generator
  const narrativeConclusion = useMemo(() => {
    if (total === 0) {
      return "Belum ada data responden yang tersimpan di dalam sesi ini. Silakan tambahkan data melalui menu 'Input Pemeriksaan' untuk menghasilkan analisis deskriptif otomatis.";
    }

    const dominantAgeGroup = Object.entries(stats.ageGroupBreakdown).sort((a,b) => Number(b[1]) - Number(a[1]))[0];
    const dominantGender = stats.genderBreakdown['Laki-laki'] >= stats.genderBreakdown['Perempuan'] ? 'Laki-laki' : 'Perempuan';
    const dominantPendidikan = pendidikanData[0] ? pendidikanData[0].name : 'Tidak teridentifikasi';
    
    const totalSegera = Math.round(stats.tindakLanjutPct.perluPerawatanSegera * total);
    const totalRujuk = Math.round(stats.tindakLanjutPct.perluDirujuk * total);

    return `Berdasarkan hasil analisis terhadap ${total} responden pada sesi '${sessionName}', diperoleh gambaran klinis sebagai berikut:

1. Karakteristik Responden: Mayoritas responden berada dalam kelompok umur ${dominantAgeGroup ? dominantAgeGroup[0] + ' tahun' : 'tertentu'} dengan jenis kelamin terbanyak adalah ${dominantGender}. Sebagian besar orang tua responden berpendidikan ${dominantPendidikan}.

2. Pengalaman Karies Gigi Sulung (def-t): Rata-rata indeks def-t responden adalah ${stats.indexAvg.deft.toFixed(2)} (kategori ${deftCategory}). Komponen karies yang paling dominan adalah 'd' (karies aktif) sebesar ${stats.indexAvg.d.toFixed(2)} per responden.

3. Pengalaman Karies Gigi Tetap (DMF-T): Rata-rata indeks DMF-T responden adalah ${stats.indexAvg.dmft.toFixed(2)} (kategori ${dmftCategory}). Komponen 'D' (karies gigi tetap aktif) mencapai rata-rata ${stats.indexAvg.D.toFixed(2)} per responden, sementara komponen 'M' (dicabut) rata-rata ${stats.indexAvg.M.toFixed(2)} dan 'F' (tumpatan) rata-rata ${stats.indexAvg.F.toFixed(2)}.

4. Jaringan Lunak & Mukosa: Prevalensi gusi berdarah (Bleeding on Probing) ditemukan pada ${(stats.mukosaPct.gusiBerdarah * 100).toFixed(1)}% responden (${gusiBerdarahCount} orang), dan lesi mukosa oral terdeteksi pada ${(stats.mukosaPct.lesiMukosaOral * 100).toFixed(1)}% responden (${lesiCount} orang).

5. Kebutuhan Perawatan & Rujukan: Sebanyak ${totalSegera} responden (${(stats.tindakLanjutPct.perluPerawatanSegera * 100).toFixed(1)}%) memerlukan perawatan gigi segera, dan ${totalRujuk} responden (${(stats.tindakLanjutPct.perluDirujuk * 100).toFixed(1)}%) membutuhkan rujukan ke fasilitas kesehatan tingkat lanjutan.`;
  }, [stats, total, sessionName, deftCategory, dmftCategory, gusiBerdarahCount, lesiCount, pendidikanData]);

  const handlePrintPdf = () => {
    if (total === 0) {
      alert("Tidak ada data responden untuk dicetak!");
      return;
    }
    exportDescriptiveAnalysisToPdf(respondents, sessionName);
  };

  const handleExportExcel = () => {
    if (total === 0) {
      alert("Tidak ada data responden untuk diekspor!");
      return;
    }
    exportToExcel(respondents, sessionName);
  };

  if (total === 0) {
    return (
      <div className="glass-panel p-10 rounded-3xl text-center space-y-4 max-w-4xl mx-auto my-8 border border-white/40 shadow-xl">
        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Belum Ada Data Responden</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Silakan input data responden terlebih dahulu atau muat data simulasi pada menu 'Koneksi Cloud' untuk melihat Analisis Deskriptif lengkap.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-2 sm:p-4 animate-fadeIn" id="descriptive-analysis-root">
      
      {/* Action Banner & Header */}
      <div className="glass-panel p-6 rounded-3xl shadow-xl border border-white/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden" id="analysis-header">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Laporan Real-Time Otomatis
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Analisis Deskriptif Pemeriksaan Kesehatan Gigi & Mulut
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-2xl">
            Hasil rekapitulasi kuantitatif, indeks epidemiologi karies (def-t & DMF-T), kondisi mukosa oral, serta estimasi rujukan berdasarkan <strong className="text-purple-700 font-bold">{total} Responden</strong> terdaftar.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto relative z-10">
          <button
            onClick={handlePrintPdf}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-purple-600/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
            id="btn-print-descriptive-pdf"
            title="Cetak Laporan PDF Resmi Analisis Deskriptif"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Analisis PDF</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
            id="btn-export-descriptive-excel"
            title="Unduh Data Mentah Format Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* KPI SUMMARY HIGHLIGHTS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="descriptive-kpis">
        <div className="glass-panel p-5 rounded-2xl border border-white/40 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Responden</span>
            <div className="p-2 bg-purple-100 text-purple-600 rounded-xl"><Users className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{total}</div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">Rata-rata Umur: {ageStats.avg} tahun</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/40 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata def-t</span>
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Activity className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.indexAvg.deft.toFixed(2)}</div>
          <div className="mt-1">
            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${deftSeverityBadge}`}>
              {deftCategory}
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/40 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata DMF-T</span>
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl"><ShieldAlert className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.indexAvg.dmft.toFixed(2)}</div>
          <div className="mt-1">
            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${dmftSeverityBadge}`}>
              {dmftCategory}
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/40 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perlu Rujukan</span>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><AlertCircle className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{Math.round(stats.tindakLanjutPct.perluDirujuk * total)} <span className="text-xs font-semibold text-slate-500">orang</span></div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">{(stats.tindakLanjutPct.perluDirujuk * 100).toFixed(1)}% dari total populasi</p>
        </div>
      </div>

      {/* SECTION 1: KARAKTERISTIK RESPONDEN */}
      <section className="glass-panel p-6 rounded-3xl border border-white/40 shadow-md space-y-6" id="sec-karakteristik">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
          <div className="p-2.5 bg-purple-600 text-white rounded-2xl shadow-md">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">1. Karakteristik Responden</h2>
            <p className="text-xs text-slate-500 font-medium">Distribusi demografis populasi sampel pemeriksaan (Umur, Gender, Pendidikan, Pekerjaan)</p>
          </div>
        </div>

        {/* Age metrics cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Umur Minimal</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{ageStats.min} <span className="text-xs font-normal">tahun</span></div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Umur Maksimal</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{ageStats.max} <span className="text-xs font-normal">tahun</span></div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Rata-rata Umur</div>
            <div className="text-lg font-black text-purple-700 mt-0.5">{ageStats.avg} <span className="text-xs font-normal">tahun</span></div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Median Umur</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{ageStats.median} <span className="text-xs font-normal">tahun</span></div>
          </div>
        </div>

        {/* Charts Grid: Kelompok Umur & Gender */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kelompok Umur Chart */}
          <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              Distribusi Kelompok Umur
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageGroupData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: any) => [`${value} orang`, 'Jumlah']} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gender Pie Chart */}
          <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <PieChartIcon className="w-4 h-4 text-purple-600" />
              Distribusi Jenis Kelamin
            </h3>
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#06b6d4" />
                    <Cell fill="#ec4899" />
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} orang`, 'Jumlah']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tables Grid: Pendidikan & Pekerjaan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pendidikan Ortui Table */}
          <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Distribusi Pendidikan Orang Tua</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-extrabold text-[10px]">
                  <tr>
                    <th className="p-2 rounded-l-lg">Tingkat Pendidikan</th>
                    <th className="p-2 text-right">Jumlah</th>
                    <th className="p-2 text-right rounded-r-lg">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 font-medium">
                  {pendidikanData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2 font-bold text-slate-800 dark:text-slate-200">{row.name}</td>
                      <td className="p-2 text-right">{row.count} org</td>
                      <td className="p-2 text-right font-bold text-purple-600">{((Number(row.count) / Number(stats.pendidikanFilledCount || total)) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                  {pendidikanData.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-3 text-center text-slate-400">Tidak ada data pendidikan</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pekerjaan Ortui Table */}
          <div className="bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Distribusi Pekerjaan Orang Tua</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-extrabold text-[10px]">
                  <tr>
                    <th className="p-2 rounded-l-lg">Sektor Pekerjaan</th>
                    <th className="p-2 text-right">Jumlah</th>
                    <th className="p-2 text-right rounded-r-lg">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 font-medium">
                  {pekerjaanData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2 font-bold text-slate-800 dark:text-slate-200">{row.name}</td>
                      <td className="p-2 text-right">{row.count} org</td>
                      <td className="p-2 text-right font-bold text-purple-600">{((Number(row.count) / Number(stats.pekerjaanFilledCount || total)) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                  {pekerjaanData.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-3 text-center text-slate-400">Tidak ada data pekerjaan</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 & 3: ANALISIS GIGI SULUNG & INDEKS def-t */}
      <section className="glass-panel p-6 rounded-3xl border border-white/40 shadow-md space-y-6" id="sec-gigi-sulung">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
          <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-md">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">2 & 3. Analisis Kondisi Gigi Sulung & Indeks def-t</h2>
            <p className="text-xs text-slate-500 font-medium">Kondisi klinis elemen gigi sulung (Deciduous teeth) dan kalkulasi indeks def-t</p>
          </div>
        </div>

        {/* Index def-t Highlight Banner */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wide">Rata-rata Indeks def-t Populasi</div>
            <div className="text-3xl font-black text-amber-900 dark:text-amber-100 mt-0.5">
              {stats.indexAvg.deft.toFixed(2)} <span className="text-xs font-medium text-amber-700">gigi / responden</span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              Rincian komponen: <strong className="font-bold">d (karies) = {stats.indexAvg.d.toFixed(2)}</strong> | <strong className="font-bold">e (dicabut) = {stats.indexAvg.e.toFixed(2)}</strong> | <strong className="font-bold">f (tumpatan) = {stats.indexAvg.f.toFixed(2)}</strong>
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-black border ${deftSeverityBadge}`}>
              Kategori WHO: {deftCategory}
            </span>
          </div>
        </div>

        {/* Grid: Table & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Table Gigi Sulung */}
          <div className="lg:col-span-7 bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Kondisi Klinis Elemen Gigi Sulung</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-extrabold text-[10px]">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">Parameter Gigi Sulung</th>
                    <th className="p-2.5 text-right">Jumlah Total (Elemen)</th>
                    <th className="p-2.5 text-right rounded-r-lg">Rata-rata / Responden</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 font-medium">
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Gigi Sehat</td>
                    <td className="p-2.5 text-right">{Math.round(stats.gigiSulungAvg.sehat * total)}</td>
                    <td className="p-2.5 text-right font-bold text-emerald-600">{stats.gigiSulungAvg.sehat.toFixed(2)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 bg-amber-50/30">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Gigi Karies / Berlubang (d)</td>
                    <td className="p-2.5 text-right">{Math.round(stats.gigiSulungAvg.karies * total)}</td>
                    <td className="p-2.5 text-right font-bold text-amber-600">{stats.gigiSulungAvg.karies.toFixed(2)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Gigi Dicabut krn Karies (e)</td>
                    <td className="p-2.5 text-right">{Math.round(stats.gigiSulungAvg.dicabutKaries * total)}</td>
                    <td className="p-2.5 text-right font-bold text-rose-600">{stats.gigiSulungAvg.dicabutKaries.toFixed(2)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Tumpatan tanpa Karies (f)</td>
                    <td className="p-2.5 text-right">{Math.round(stats.gigiSulungAvg.tumpatanTanpaKaries * total)}</td>
                    <td className="p-2.5 text-right font-bold text-blue-600">{stats.gigiSulungAvg.tumpatanTanpaKaries.toFixed(2)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Tumpatan dengan Karies</td>
                    <td className="p-2.5 text-right">{Math.round(stats.gigiSulungAvg.tumpatanKaries * total)}</td>
                    <td className="p-2.5 text-right font-bold">{stats.gigiSulungAvg.tumpatanKaries.toFixed(2)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Gigi Sudah Tanggal (K)</td>
                    <td className="p-2.5 text-right">{Math.round((stats.gigiSulungAvg.sudahTanggal || 0) * total)}</td>
                    <td className="p-2.5 text-right font-bold">{(stats.gigiSulungAvg.sudahTanggal || 0).toFixed(2)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Gigi Tidak Tumbuh / Erupsi</td>
                    <td className="p-2.5 text-right">{Math.round(stats.gigiSulungAvg.tidakTumbuh * total)}</td>
                    <td className="p-2.5 text-right font-bold">{stats.gigiSulungAvg.tidakTumbuh.toFixed(2)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Fissure Sealant / Protesa Cekat</td>
                    <td className="p-2.5 text-right">{Math.round((stats.gigiSulungAvg.fissureSealant + stats.gigiSulungAvg.protesaCekat) * total)}</td>
                    <td className="p-2.5 text-right font-bold">{(stats.gigiSulungAvg.fissureSealant + stats.gigiSulungAvg.protesaCekat).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart Component Breakdown def-t */}
          <div className="lg:col-span-5 bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Komponen Indeks def-t (d, e, f)</h3>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deftData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: any, name: any, props: any) => [`Total: ${value} gigi (Rata-rata: ${props.payload.avg})`, name]} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500 font-medium text-center mt-2">
              Indeks def-t menggambarkan total pengalaman karies pada gigi sulung anak.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4 & 5: ANALISIS GIGI TETAP & INDEKS DMF-T */}
      <section className="glass-panel p-6 rounded-3xl border border-white/40 shadow-md space-y-6" id="sec-gigi-tetap">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
          <div className="p-2.5 bg-rose-600 text-white rounded-2xl shadow-md">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">4 & 5. Analisis Kondisi Gigi Tetap & Indeks DMF-T</h2>
            <p className="text-xs text-slate-500 font-medium">Kondisi klinis elemen gigi tetap (Permanent teeth) dan kalkulasi indeks DMF-T (WHO Standard)</p>
          </div>
        </div>

        {/* Index DMF-T Highlight Banner */}
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-extrabold text-rose-800 dark:text-rose-300 uppercase tracking-wide">Rata-rata Indeks DMF-T Populasi</div>
            <div className="text-3xl font-black text-rose-900 dark:text-rose-100 mt-0.5">
              {stats.indexAvg.dmft.toFixed(2)} <span className="text-xs font-medium text-rose-700">gigi / responden</span>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
              Rincian komponen: <strong className="font-bold">D (karies) = {stats.indexAvg.D.toFixed(2)}</strong> | <strong className="font-bold">M (dicabut) = {stats.indexAvg.M.toFixed(2)}</strong> | <strong className="font-bold">F (tumpatan) = {stats.indexAvg.F.toFixed(2)}</strong>
            </p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-black border ${dmftSeverityBadge}`}>
              Kategori WHO: {dmftCategory}
            </span>
          </div>
        </div>

        {/* Grid: Table & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Table Gigi Tetap */}
          <div className="lg:col-span-7 bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Kondisi Klinis Elemen Gigi Tetap</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-extrabold text-[10px]">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">Parameter Gigi Tetap</th>
                    <th className="p-2.5 text-right">Jumlah Total (Elemen)</th>
                    <th className="p-2.5 text-right rounded-r-lg">Rata-rata / Responden</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 font-medium">
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Gigi Sehat</td>
                    <td className="p-2.5 text-right">{Math.round(stats.gigiTetapAvg.sehat * total)}</td>
                    <td className="p-2.5 text-right font-bold text-emerald-600">{stats.gigiTetapAvg.sehat.toFixed(2)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 bg-rose-50/30">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Gigi Berlubang / Karies (D)</td>
                    <td className="p-2.5 text-right">{Math.round(stats.gigiTetapAvg.karies * total)}</td>
                    <td className="p-2.5 text-right font-bold text-rose-600">{stats.gigiTetapAvg.karies.toFixed(2)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Gigi Dicabut krn Karies (M)</td>
                    <td className="p-2.5 text-right">{Math.round(stats.gigiTetapAvg.dicabutKaries * total)}</td>
                    <td className="p-2.5 text-right font-bold text-purple-600">{stats.gigiTetapAvg.dicabutKaries.toFixed(2)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Tumpatan tanpa Karies (F)</td>
                    <td className="p-2.5 text-right">{Math.round(stats.gigiTetapAvg.tumpatanTanpaKaries * total)}</td>
                    <td className="p-2.5 text-right font-bold text-blue-600">{stats.gigiTetapAvg.tumpatanTanpaKaries.toFixed(2)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Tumpatan dengan Karies</td>
                    <td className="p-2.5 text-right">{Math.round(stats.gigiTetapAvg.tumpatanKaries * total)}</td>
                    <td className="p-2.5 text-right font-bold">{stats.gigiTetapAvg.tumpatanKaries.toFixed(2)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Fissure Sealant</td>
                    <td className="p-2.5 text-right">{Math.round(stats.gigiTetapAvg.fissureSealant * total)}</td>
                    <td className="p-2.5 text-right font-bold">{stats.gigiTetapAvg.fissureSealant.toFixed(2)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Gigi Tidak Tumbuh / Impaksi</td>
                    <td className="p-2.5 text-right">{Math.round(stats.gigiTetapAvg.tidakTumbuh * total)}</td>
                    <td className="p-2.5 text-right font-bold">{stats.gigiTetapAvg.tidakTumbuh.toFixed(2)}</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Protesa Cekat / Implan</td>
                    <td className="p-2.5 text-right">{Math.round(stats.gigiTetapAvg.protesaCekat * total)}</td>
                    <td className="p-2.5 text-right font-bold">{stats.gigiTetapAvg.protesaCekat.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart Component Breakdown DMF-T */}
          <div className="lg:col-span-5 bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Komponen Indeks DMF-T (D, M, F)</h3>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dmftData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: any, name: any, props: any) => [`Total: ${value} gigi (Rata-rata: ${props.payload.avg})`, name]} />
                  <Bar dataKey="value" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-500 font-medium text-center mt-2">
              Indeks DMF-T adalah standar internasional WHO untuk mengukur derajat karies permanent.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: KONDISI MUKOSA ORAL & GUSI */}
      <section className="glass-panel p-6 rounded-3xl border border-white/40 shadow-md space-y-6" id="sec-mukosa">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
          <div className="p-2.5 bg-cyan-600 text-white rounded-2xl shadow-md">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">6. Kondisi Mukosa Oral dan Gusi</h2>
            <p className="text-xs text-slate-500 font-medium">Prevalensi perdarahan gusi (Bleeding on Probing) dan adanya lesi mukosa oral</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Table Mukosa */}
          <div className="lg:col-span-7 bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Rekapitulasi Jaringan Lunak Mulut</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-extrabold text-[10px]">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">Kondisi Mukosa / Gusi</th>
                    <th className="p-2.5 text-right">Jumlah Responden</th>
                    <th className="p-2.5 text-right rounded-r-lg">Prevalensi (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 font-medium">
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Gusi Berdarah (Bleeding on Probing)</td>
                    <td className="p-2.5 text-right font-bold text-rose-600">{gusiBerdarahCount} orang</td>
                    <td className="p-2.5 text-right font-bold text-rose-600">{(stats.mukosaPct.gusiBerdarah * 100).toFixed(2)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Lesi Mukosa Oral (Oral Mucosal Lesion)</td>
                    <td className="p-2.5 text-right font-bold text-amber-600">{lesiCount} orang</td>
                    <td className="p-2.5 text-right font-bold text-amber-600">{(stats.mukosaPct.lesiMukosaOral * 100).toFixed(2)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 bg-emerald-50/30">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Kondisi Mukosa / Gusi Sehat (Tanpa Kelainan)</td>
                    <td className="p-2.5 text-right font-bold text-emerald-600">{mukosaSehatCount} orang</td>
                    <td className="p-2.5 text-right font-bold text-emerald-600">{((mukosaSehatCount / total) * 100).toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pie Chart Mukosa */}
          <div className="lg:col-span-5 bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Proporsi Kesehatan Mukosa</h3>
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mukosaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} orang`, 'Jumlah']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: TINDAK LANJUT & RUJUKAN */}
      <section className="glass-panel p-6 rounded-3xl border border-white/40 shadow-md space-y-6" id="sec-tindak-lanjut">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60">
          <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-md">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">7. Tindak Lanjut dan Sistem Rujukan</h2>
            <p className="text-xs text-slate-500 font-medium">Kategori kebutuhan perawatan dan fasilitas kesehatan rujukan lanjutan</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Table Tindak Lanjut */}
          <div className="lg:col-span-7 bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 space-y-3">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Tingkat Kebutuhan Perawatan & Rujukan</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-extrabold text-[10px]">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">Kategori Perawatan</th>
                    <th className="p-2.5 text-right">Jumlah</th>
                    <th className="p-2.5 text-right rounded-r-lg">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 font-medium">
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Perawatan Gigi Segera</td>
                    <td className="p-2.5 text-right text-rose-600 font-bold">{Math.round(stats.tindakLanjutPct.perluPerawatanSegera * total)} orang</td>
                    <td className="p-2.5 text-right text-rose-600 font-bold">{(stats.tindakLanjutPct.perluPerawatanSegera * 100).toFixed(2)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Perawatan Gigi Tidak Segera</td>
                    <td className="p-2.5 text-right text-amber-600 font-bold">{Math.round(stats.tindakLanjutPct.perluPerawatanTidakSegera * total)} orang</td>
                    <td className="p-2.5 text-right text-amber-600 font-bold">{(stats.tindakLanjutPct.perluPerawatanTidakSegera * 100).toFixed(2)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">Memerlukan Rujukan Faskes Lanjutan</td>
                    <td className="p-2.5 text-right text-purple-600 font-bold">{Math.round(stats.tindakLanjutPct.perluDirujuk * total)} orang</td>
                    <td className="p-2.5 text-right text-purple-600 font-bold">{(stats.tindakLanjutPct.perluDirujuk * 100).toFixed(2)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 bg-slate-50/50">
                    <td className="p-2.5 text-slate-500 pl-6">• Target Rujukan: Puskesmas</td>
                    <td className="p-2.5 text-right">{Math.round(stats.tindakLanjutPct.dirujukKePuskesmas * total)} orang</td>
                    <td className="p-2.5 text-right">{(stats.tindakLanjutPct.dirujukKePuskesmas * 100).toFixed(2)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 bg-slate-50/50">
                    <td className="p-2.5 text-slate-500 pl-6">• Target Rujukan: Rumah Sakit Umum</td>
                    <td className="p-2.5 text-right">{Math.round(stats.tindakLanjutPct.dirujukKeRSUmum * total)} orang</td>
                    <td className="p-2.5 text-right">{(stats.tindakLanjutPct.dirujukKeRSUmum * 100).toFixed(2)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 bg-slate-50/50">
                    <td className="p-2.5 text-slate-500 pl-6">• Target Rujukan: RSGM / RS Gigi & Mulut</td>
                    <td className="p-2.5 text-right">{Math.round(stats.tindakLanjutPct.dirujukKeRSGM * total)} orang</td>
                    <td className="p-2.5 text-right">{(stats.tindakLanjutPct.dirujukKeRSGM * 100).toFixed(2)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 bg-slate-50/50">
                    <td className="p-2.5 text-slate-500 pl-6">• Target Rujukan: Klinik Pratama</td>
                    <td className="p-2.5 text-right">{Math.round(stats.tindakLanjutPct.dirujukKeKlinikPratama * total)} orang</td>
                    <td className="p-2.5 text-right">{(stats.tindakLanjutPct.dirujukKeKlinikPratama * 100).toFixed(2)}%</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 bg-slate-50/50">
                    <td className="p-2.5 text-slate-500 pl-6">• Target Rujukan: Klinik Utama</td>
                    <td className="p-2.5 text-right">{Math.round(stats.tindakLanjutPct.dirujukKeKlinikUtama * total)} orang</td>
                    <td className="p-2.5 text-right">{(stats.tindakLanjutPct.dirujukKeKlinikUtama * 100).toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Chart Rujukan */}
          <div className="lg:col-span-5 bg-white/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">Tujuan Fasilitas Kesehatan Rujukan</h3>
            <div className="h-60 w-full">
              {rujukanData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rujukanData} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(value: any) => [`${value} orang`, 'Jumlah']} />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Tidak ada responden yang dirujuk
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9 & 10: KESIMPULAN DESKRIPTIF OTOMATIS */}
      <section className="glass-panel p-6 rounded-3xl border border-purple-200/60 shadow-xl space-y-4 bg-gradient-to-br from-purple-50/50 via-white/80 to-purple-50/20 dark:from-purple-950/20 dark:to-slate-900/80" id="sec-kesimpulan">
        <div className="flex items-center gap-3 pb-3 border-b border-purple-200/60">
          <div className="p-2.5 bg-purple-600 text-white rounded-2xl shadow-md">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">9. Kesimpulan & Sintesis Analisis Deskriptif</h2>
            <p className="text-xs text-slate-500 font-medium">Ringkasan naratif ilmiah berdasarkan pengolahan data riil populasi</p>
          </div>
        </div>

        <div className="p-5 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-purple-100 dark:border-purple-900/40 shadow-inner">
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans">
            {narrativeConclusion}
          </p>
        </div>

        {/* Footer print callout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-500 font-medium">
            Laporan ini dibuat otomatis secara dinamis dari data terkini tanpa estimasi buatan.
          </div>
          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/20 transition-all cursor-pointer hover:scale-105"
            id="btn-bottom-print-pdf"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan PDF Resmi</span>
          </button>
        </div>
      </section>

    </div>
  );
}
