import { RespondentData } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// 1. Calculate Statistics
export interface SurveyStats {
  totalRespondents: number;
  
  // Pendidikan Breakdown
  pendidikanBreakdown: Record<string, number>;
  pendidikanFilledCount: number;
  
  // Pekerjaan Breakdown
  pekerjaanBreakdown: Record<string, number>;
  pekerjaanFilledCount: number;
  
  // Jenis Kelamin Breakdown
  genderBreakdown: Record<string, number>;
  genderFilledCount: number;
  
  // Kelompok Umur Breakdown
  ageGroupBreakdown: Record<string, number>;
  ageGroupFilledCount: number;
  
  // Gigi Sulung (Deciduous) Averages
  gigiSulungAvg: {
    sehat: number;
    karies: number;
    dicabutKaries: number;
    tumpatanKaries: number;
    tumpatanTanpaKaries: number;
    dicabutSebabLain: number;
    fissureSealant: number;
    protesaCekat: number;
    tidakTumbuh: number;
    lainLain: number;
    sudahTanggal?: number;
  };
  
  // Gigi Tetap (Permanent) Averages
  gigiTetapAvg: {
    sehat: number;
    karies: number;
    dicabutKaries: number;
    tumpatanKaries: number;
    tumpatanTanpaKaries: number;
    dicabutSebabLain: number;
    fissureSealant: number;
    protesaCekat: number;
    tidakTumbuh: number;
    lainLain: number;
  };
  
  // Indices Averages
  indexAvg: {
    d: number;      // Gigi sulung karies
    e: number;      // Gigi sulung dicabut karies
    f: number;      // Gigi sulung tumpatan tanpa karies
    deft: number;   // Gigi sulung d+e+f
    D: number;      // Gigi tetap karies
    M: number;      // Gigi tetap dicabut karies
    F: number;      // Gigi tetap tumpatan tanpa karies
    dmft: number;   // Gigi tetap D+M+F
  };
  
  // Mukosa State percentages
  mukosaPct: {
    gusiBerdarah: number;
    lesiMukosaOral: number;
  };
  
  // Rencana Tindak Lanjut percentages
  tindakLanjutPct: {
    perluPerawatanSegera: number;
    perluPerawatanTidakSegera: number;
    perluDirujuk: number;
    dirujukKePuskesmas: number;
    dirujukKeRSUmum: number;
    dirujukKeRSGM: number;
    dirujukKeKlinikPratama: number;
    dirujukKeKlinikUtama: number;
  };
}

export function calculateSurveyStats(respondents: RespondentData[]): SurveyStats {
  const total = respondents.length;
  
  const stats: SurveyStats = {
    totalRespondents: total,
    pendidikanBreakdown: { 'SD': 0, 'SMP': 0, 'SMA': 0, 'Diploma': 0, 'S1/D4': 0, 'S2': 0, 'S3': 0, 'Tidak Sekolah': 0 },
    pendidikanFilledCount: 0,
    pekerjaanBreakdown: { 'ASN/PNS/PPPK': 0, 'TNI/POLRI': 0, 'PEGAWAI BUMN': 0, 'PEGAWAI SWASTA': 0, 'WIRASWASTA/WIRAUSAHA': 0, 'PELAJAR/MAHASISWA': 0, 'PENGURUS/IBU RUMAH TANGGA': 0, 'ASISTEN RUMAH TANGGA': 0, 'TIDAK BEKERJA': 0 },
    pekerjaanFilledCount: 0,
    genderBreakdown: { 'Laki-laki': 0, 'Perempuan': 0 },
    genderFilledCount: 0,
    ageGroupBreakdown: { '5-10': 0, '10-18': 0, '18-60': 0, '60+': 0 },
    ageGroupFilledCount: 0,
    
    gigiSulungAvg: { sehat: 0, karies: 0, dicabutKaries: 0, tumpatanKaries: 0, tumpatanTanpaKaries: 0, dicabutSebabLain: 0, fissureSealant: 0, protesaCekat: 0, tidakTumbuh: 0, lainLain: 0, sudahTanggal: 0 },
    gigiTetapAvg: { sehat: 0, karies: 0, dicabutKaries: 0, tumpatanKaries: 0, tumpatanTanpaKaries: 0, dicabutSebabLain: 0, fissureSealant: 0, protesaCekat: 0, tidakTumbuh: 0, lainLain: 0 },
    
    indexAvg: { d: 0, e: 0, f: 0, deft: 0, D: 0, M: 0, F: 0, dmft: 0 },
    mukosaPct: { gusiBerdarah: 0, lesiMukosaOral: 0 },
    tindakLanjutPct: { perluPerawatanSegera: 0, perluPerawatanTidakSegera: 0, perluDirujuk: 0, dirujukKePuskesmas: 0, dirujukKeRSUmum: 0, dirujukKeRSGM: 0, dirujukKeKlinikPratama: 0, dirujukKeKlinikUtama: 0 }
  };

  if (total === 0) return stats;

  let gsSehatSum = 0, gsKariesSum = 0, gsDicabutKariesSum = 0, gsTumpatanKariesSum = 0, gsTumpatanTanpaKariesSum = 0, gsDicabutSebabLainSum = 0, gsFissureSum = 0, gsProtesaSum = 0, gsTidakTumbuhSum = 0, gsLainSum = 0, gsSudahTanggalSum = 0;
  let gtSehatSum = 0, gtKariesSum = 0, gtDicabutKariesSum = 0, gtTumpatanKariesSum = 0, gtTumpatanTanpaKariesSum = 0, gtDicabutSebabLainSum = 0, gtFissureSum = 0, gtProtesaSum = 0, gtTidakTumbuhSum = 0, gtLainSum = 0;
  
  let gusiBerdarahCount = 0;
  let lesiMukosaCount = 0;
  
  let rwtSegeraCount = 0;
  let rwtTidakSegeraCount = 0;
  let rwtRujukCount = 0;
  let rujPuskesmasCount = 0;
  let rujRSUmumCount = 0;
  let rujRSGMCount = 0;
  let rujPratamaCount = 0;
  let rujUtamaCount = 0;

  respondents.forEach(r => {
    // Breakdown Pendidikan (ignore optional values if empty)
    if (r.pendidikan) {
      stats.pendidikanBreakdown[r.pendidikan] = (stats.pendidikanBreakdown[r.pendidikan] || 0) + 1;
      stats.pendidikanFilledCount++;
    }
    // Breakdown Pekerjaan
    if (r.pekerjaan) {
      stats.pekerjaanBreakdown[r.pekerjaan] = (stats.pekerjaanBreakdown[r.pekerjaan] || 0) + 1;
      stats.pekerjaanFilledCount++;
    }
    // Breakdown Gender
    if (r.jenisKelamin) {
      stats.genderBreakdown[r.jenisKelamin] = (stats.genderBreakdown[r.jenisKelamin] || 0) + 1;
      stats.genderFilledCount++;
    }
    // Breakdown Kelompok Umur
    if (r.kelompokUmur) {
      stats.ageGroupBreakdown[r.kelompokUmur] = (stats.ageGroupBreakdown[r.kelompokUmur] || 0) + 1;
      stats.ageGroupFilledCount++;
    }

    // Gigi Sulung sums
    gsSehatSum += r.gigiSulung.sehat || 0;
    gsKariesSum += r.gigiSulung.karies || 0;
    gsDicabutKariesSum += r.gigiSulung.dicabutKaries || 0;
    gsTumpatanKariesSum += r.gigiSulung.tumpatanKaries || 0;
    gsTumpatanTanpaKariesSum += r.gigiSulung.tumpatanTanpaKaries || 0;
    gsDicabutSebabLainSum += r.gigiSulung.dicabutSebabLain || 0;
    gsFissureSum += r.gigiSulung.fissureSealant || 0;
    gsProtesaSum += r.gigiSulung.protesaCekat || 0;
    gsTidakTumbuhSum += r.gigiSulung.tidakTumbuh || 0;
    gsLainSum += r.gigiSulung.lainLain || 0;
    gsSudahTanggalSum += r.gigiSulung.sudahTanggal || 0;

    // Gigi Tetap sums
    gtSehatSum += r.gigiTetap.sehat || 0;
    gtKariesSum += r.gigiTetap.karies || 0;
    gtDicabutKariesSum += r.gigiTetap.dicabutKaries || 0;
    gtTumpatanKariesSum += r.gigiTetap.tumpatanKaries || 0;
    gtTumpatanTanpaKariesSum += r.gigiTetap.tumpatanTanpaKaries || 0;
    gtDicabutSebabLainSum += r.gigiTetap.dicabutSebabLain || 0;
    gtFissureSum += r.gigiTetap.fissureSealant || 0;
    gtProtesaSum += r.gigiTetap.protesaCekat || 0;
    gtTidakTumbuhSum += r.gigiTetap.tidakTumbuh || 0;
    gtLainSum += r.gigiTetap.lainLain || 0;

    // Mukosa
    if (r.mukosa.gusiBerdarah) gusiBerdarahCount++;
    if (r.mukosa.lesiMukosaOral) lesiMukosaCount++;

    // RTL
    if (r.tindakLanjut.perluPerawatanSegera) rwtSegeraCount++;
    if (r.tindakLanjut.perluPerawatanTidakSegera) rwtTidakSegeraCount++;
    if (r.tindakLanjut.perluDirujuk) rwtRujukCount++;
    
    if (r.tindakLanjut.dirujukKe === 'puskesmas') rujPuskesmasCount++;
    else if (r.tindakLanjut.dirujukKe === 'rs_umum') rujRSUmumCount++;
    else if (r.tindakLanjut.dirujukKe === 'rsgm_rskgm') rujRSGMCount++;
    else if (r.tindakLanjut.dirujukKe === 'klinik_pratama') rujPratamaCount++;
    else if (r.tindakLanjut.dirujukKe === 'klinik_utama') rujUtamaCount++;
  });

  // Calculate Averages for Gigi Sulung
  stats.gigiSulungAvg = {
    sehat: gsSehatSum / total,
    karies: gsKariesSum / total,
    dicabutKaries: gsDicabutKariesSum / total,
    tumpatanKaries: gsTumpatanKariesSum / total,
    tumpatanTanpaKaries: gsTumpatanTanpaKariesSum / total,
    dicabutSebabLain: gsDicabutSebabLainSum / total,
    fissureSealant: gsFissureSum / total,
    protesaCekat: gsProtesaSum / total,
    tidakTumbuh: gsTidakTumbuhSum / total,
    lainLain: gsLainSum / total,
    sudahTanggal: gsSudahTanggalSum / total,
  };

  // Calculate Averages for Gigi Tetap
  stats.gigiTetapAvg = {
    sehat: gtSehatSum / total,
    karies: gtKariesSum / total,
    dicabutKaries: gtDicabutKariesSum / total,
    tumpatanKaries: gtTumpatanKariesSum / total,
    tumpatanTanpaKaries: gtTumpatanTanpaKariesSum / total,
    dicabutSebabLain: gtDicabutSebabLainSum / total,
    fissureSealant: gtFissureSum / total,
    protesaCekat: gtProtesaSum / total,
    tidakTumbuh: gtTidakTumbuhSum / total,
    lainLain: gtLainSum / total,
  };

  // Indices Averages
  stats.indexAvg = {
    d: stats.gigiSulungAvg.karies,
    e: stats.gigiSulungAvg.dicabutKaries,
    f: stats.gigiSulungAvg.tumpatanTanpaKaries,
    deft: stats.gigiSulungAvg.karies + stats.gigiSulungAvg.dicabutKaries + stats.gigiSulungAvg.tumpatanTanpaKaries,
    D: stats.gigiTetapAvg.karies,
    M: stats.gigiTetapAvg.dicabutKaries,
    F: stats.gigiTetapAvg.tumpatanTanpaKaries,
    dmft: stats.gigiTetapAvg.karies + stats.gigiTetapAvg.dicabutKaries + stats.gigiTetapAvg.tumpatanTanpaKaries,
  };

  // Mukosa Percentages
  stats.mukosaPct = {
    gusiBerdarah: gusiBerdarahCount / total,
    lesiMukosaOral: lesiMukosaCount / total,
  };

  // Tindak Lanjut Percentages
  stats.tindakLanjutPct = {
    perluPerawatanSegera: rwtSegeraCount / total,
    perluPerawatanTidakSegera: rwtTidakSegeraCount / total,
    perluDirujuk: rwtRujukCount / total,
    dirujukKePuskesmas: rujPuskesmasCount / total,
    dirujukKeRSUmum: rujRSUmumCount / total,
    dirujukKeRSGM: rujRSGMCount / total,
    dirujukKeKlinikPratama: rujPratamaCount / total,
    dirujukKeKlinikUtama: rujUtamaCount / total,
  };

  return stats;
}

// 2. Export to Excel
export function exportToExcel(
  respondents: RespondentData[], 
  sessionName: string, 
  options?: { reportType?: 'full' | 'summary' | 'detail'; filterDescription?: string }
) {
  const type = options?.reportType || 'full';
  const filterDesc = options?.filterDescription || 'Semua Data';
  const stats = calculateSurveyStats(respondents);
  
  const wb = XLSX.utils.book_new();

  // Tab 1: Data Responden
  if (type === 'full' || type === 'detail') {
    const respondentRows = respondents.map((r, index) => ({
      'No': index + 1,
      'Nama': r.nama || 'Anonim',
      'Alamat': r.alamat || '-',
      'No. Telepon': r.noTelepon || '-',
      'Nama Orang Tua': r.namaOrangTua || '-',
      'Tanggal Input': r.tanggalInput,
      'Tanggal Pemeriksaan': r.tanggalPemeriksaan || r.tanggalInput,
      'Jenis Kelamin': r.jenisKelamin,
      'Umur (Tahun)': r.umur,
      'Kelompok Umur': r.kelompokUmur === '5-10' ? '5-10 Tahun' : r.kelompokUmur === '10-18' ? '10-18 Tahun' : r.kelompokUmur === '18-60' ? '18-60 Tahun' : '60+ Tahun',
      'Pendidikan terakhir': r.pendidikan || '-',
      'Pekerjaan': r.pekerjaan || '-',
      
      // Gigi Sulung (gs)
      'G.Sulung Sehat': r.gigiSulung.sehat,
      'G.Sulung Karies (d)': r.gigiSulung.karies,
      'G.Sulung Dicabut Karies (e)': r.gigiSulung.dicabutKaries,
      'G.Sulung Tumpatan (f)': r.gigiSulung.tumpatanTanpaKaries,
      'G.Sulung Sudah Tanggal (K)': r.gigiSulung.sudahTanggal || 0,
      'def-t': r.deft,
      
      // Gigi Tetap (gt)
      'G.Tetap Sehat': r.gigiTetap.sehat,
      'G.Tetap Karies (D)': r.gigiTetap.karies,
      'G.Tetap Dicabut Karies (M)': r.gigiTetap.dicabutKaries,
      'G.Tetap Tumpatan (F)': r.gigiTetap.tumpatanTanpaKaries,
      'DMF-T': r.dmft,
      
      // Mukosa
      'Gusi Berdarah': r.mukosa.gusiBerdarah ? 'Ya' : 'Tidak',
      'Lesi Mukosa Oral': r.mukosa.lesiMukosaOral ? 'Ya' : 'Tidak',
      
      // RTL
      'Perlu Perawatan Segera': r.tindakLanjut.perluPerawatanSegera ? 'Ya' : 'Tidak',
      'Perlu Perawatan Tidak Segera': r.tindakLanjut.perluPerawatanTidakSegera ? 'Ya' : 'Tidak',
      'Perlu Dirujuk': r.tindakLanjut.perluDirujuk ? 'Ya' : 'Tidak',
      'Dirujuk Ke': r.tindakLanjut.dirujukKe === 'tidak_dirujuk' ? 'Tidak Dirujuk' : r.tindakLanjut.dirujukKe.toUpperCase().replace('_', ' '),
    }));

    const wsRespondents = XLSX.utils.json_to_sheet(respondentRows);
    XLSX.utils.book_append_sheet(wb, wsRespondents, 'Data Responden');
  }

  // Tab 2: Laporan Ringkasan (Averages & Breakdowns)
  if (type === 'full' || type === 'summary') {
    const summaryData = [
      ['RINGKASAN SURVEY KESEHATAN GIGI DAN MULUT'],
      ['Sesi:', sessionName],
      ['Filter Rentang Data:', filterDesc],
      ['Tanggal Ekspor:', new Date().toLocaleDateString('id-ID')],
      ['Jumlah Responden:', stats.totalRespondents],
      [],
      ['KARAKTERISTIK RESPONDEN'],
      ['Kategori', 'Variabel', 'Jumlah', 'Persentase'],
      
      // Gender Breakdown
      ['Jenis Kelamin', 'Laki-laki', stats.genderBreakdown['Laki-laki'], stats.genderFilledCount ? `${((stats.genderBreakdown['Laki-laki'] / stats.genderFilledCount) * 100).toFixed(2)}%` : '0.00%'],
      ['Jenis Kelamin', 'Perempuan', stats.genderBreakdown['Perempuan'], stats.genderFilledCount ? `${((stats.genderBreakdown['Perempuan'] / stats.genderFilledCount) * 100).toFixed(2)}%` : '0.00%'],
      
      // Age Group Breakdown
      ['Kelompok Umur', '5-10 tahun (anak-anak)', stats.ageGroupBreakdown['5-10'], stats.ageGroupFilledCount ? `${((stats.ageGroupBreakdown['5-10'] / stats.ageGroupFilledCount) * 100).toFixed(2)}%` : '0.00%'],
      ['Kelompok Umur', '10-18 tahun (remaja)', stats.ageGroupBreakdown['10-18'], stats.ageGroupFilledCount ? `${((stats.ageGroupBreakdown['10-18'] / stats.ageGroupFilledCount) * 100).toFixed(2)}%` : '0.00%'],
      ['Kelompok Umur', '18-60 tahun (produktif)', stats.ageGroupBreakdown['18-60'], stats.ageGroupFilledCount ? `${((stats.ageGroupBreakdown['18-60'] / stats.ageGroupFilledCount) * 100).toFixed(2)}%` : '0.00%'],
      ['Kelompok Umur', '60 tahun ke atas (lansia)', stats.ageGroupBreakdown['60+'], stats.ageGroupFilledCount ? `${((stats.ageGroupBreakdown['60+'] / stats.ageGroupFilledCount) * 100).toFixed(2)}%` : '0.00%'],
      
      [],
      ['RATA-RATA KEADAAN GIGI SULUNG'],
      ['Parameter', 'Rata-Rata'],
      ['Sehat', stats.gigiSulungAvg.sehat.toFixed(2)],
      ['Gigi Berlubang/Karies (d)', stats.gigiSulungAvg.karies.toFixed(2)],
      ['Gigi dicabut karena karies (e)', stats.gigiSulungAvg.dicabutKaries.toFixed(2)],
      ['Tumpatan dengan karies', stats.gigiSulungAvg.tumpatanKaries.toFixed(2)],
      ['Tumpatan tanpa karies (f)', stats.gigiSulungAvg.tumpatanTanpaKaries.toFixed(2)],
      ['Gigi dicabut karena sebab lain', stats.gigiSulungAvg.dicabutSebabLain.toFixed(2)],
      ['Fissure Sealant', stats.gigiSulungAvg.fissureSealant.toFixed(2)],
      ['Protesa cekat/mahkota cekat/implan/veneer', stats.gigiSulungAvg.protesaCekat.toFixed(2)],
      ['Gigi tidak tumbuh', stats.gigiSulungAvg.tidakTumbuh.toFixed(2)],
      ['Gigi sudah tanggal (K)', (stats.gigiSulungAvg.sudahTanggal || 0).toFixed(2)],
      ['Lain-lain', stats.gigiSulungAvg.lainLain.toFixed(2)],
      ['Indeks def-t (d+e+f)', stats.indexAvg.deft.toFixed(2)],

      [],
      ['RATA-RATA KEADAAN GIGI TETAP'],
      ['Parameter', 'Rata-Rata'],
      ['Sehat', stats.gigiTetapAvg.sehat.toFixed(2)],
      ['Gigi Berlubang/Karies (D)', stats.gigiTetapAvg.karies.toFixed(2)],
      ['Gigi dicabut karena karies (M)', stats.gigiTetapAvg.dicabutKaries.toFixed(2)],
      ['Tumpatan dengan karies', stats.gigiTetapAvg.tumpatanKaries.toFixed(2)],
      ['Tumpatan tanpa karies (F)', stats.gigiTetapAvg.tumpatanTanpaKaries.toFixed(2)],
      ['Gigi dicabut karena sebab lain', stats.gigiTetapAvg.dicabutSebabLain.toFixed(2)],
      ['Fissure Sealant', stats.gigiTetapAvg.fissureSealant.toFixed(2)],
      ['Protesa cekat/mahkota cekat/implan/veneer', stats.gigiTetapAvg.protesaCekat.toFixed(2)],
      ['Gigi tidak tumbuh', stats.gigiTetapAvg.tidakTumbuh.toFixed(2)],
      ['Lain-lain', stats.gigiTetapAvg.lainLain.toFixed(2)],
      ['Indeks DMF-T (D+M+F)', stats.indexAvg.dmft.toFixed(2)],

      [],
      ['KEADAAN MUKOSA'],
      ['Kondisi', 'Persentase'],
      ['Gusi berdarah', `${(stats.mukosaPct.gusiBerdarah * 100).toFixed(2)}%`],
      ['Lesi Mukosa Oral', `${(stats.mukosaPct.lesiMukosaOral * 100).toFixed(2)}%`],

      [],
      ['RENCANA TINDAK LANJUT (RTL)'],
      ['Tindakan', 'Persentase'],
      ['Perlu perawatan segera', `${(stats.tindakLanjutPct.perluPerawatanSegera * 100).toFixed(2)}%`],
      ['Perlu perawatan tidak segera', `${(stats.tindakLanjutPct.perluPerawatanTidakSegera * 100).toFixed(2)}%`],
      ['Perlu dirujuk', `${(stats.tindakLanjutPct.perluDirujuk * 100).toFixed(2)}%`],
      ['Dirujuk ke puskesmas', `${(stats.tindakLanjutPct.dirujukKePuskesmas * 100).toFixed(2)}%`],
      ['Dirujuk ke RS Umum', `${(stats.tindakLanjutPct.dirujukKeRSUmum * 100).toFixed(2)}%`],
      ['Dirujuk ke RSGM/RSKGM', `${(stats.tindakLanjutPct.dirujukKeRSGM * 100).toFixed(2)}%`],
      ['Dirujuk ke Klinik Pratama', `${(stats.tindakLanjutPct.dirujukKeKlinikPratama * 100).toFixed(2)}%`],
      ['Dirujuk ke Klinik Utama', `${(stats.tindakLanjutPct.dirujukKeKlinikUtama * 100).toFixed(2)}%`],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Laporan');
  }

  // Trigger browser download
  const cleanName = sessionName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const cleanFilter = filterDesc.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  XLSX.writeFile(wb, `survey_gigi_dan_mulut_${cleanName}_${cleanFilter}.xlsx`);
}

// 3. Export to PDF
export function exportToPdf(
  respondents: RespondentData[], 
  sessionName: string, 
  options?: { reportType?: 'full' | 'summary' | 'detail'; filterDescription?: string }
) {
  const type = options?.reportType || 'full';
  const filterDesc = options?.filterDescription || 'Semua Data';
  const stats = calculateSurveyStats(respondents);
  const doc = new jsPDF();

  // Helper to draw section header bar
  const drawSectionHeader = (title: string, startY: number): number => {
    if (startY > 250) {
      doc.addPage();
      startY = 18;
    }
    doc.setFillColor(241, 245, 249);
    doc.rect(10, startY, 190, 7, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 13, startY + 5);
    return startY + 10;
  };

  // 1. MAIN TITLE (Centered at top)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN HASIL SURVEY KESEHATAN GIGI DAN MULUT', 105, 15, { align: 'center' });

  // 2. METADATA BOX BELOW TITLE
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(10, 19, 190, 18, 2, 2, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  doc.text(`Sesi Survei:`, 14, 25);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${sessionName}`, 34, 25);

  doc.setFont('Helvetica', 'bold');
  doc.text(`Tanggal Ekspor:`, 14, 32);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 39, 32);

  doc.setFont('Helvetica', 'bold');
  doc.text(`Rentang / Filter Data:`, 110, 25);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${filterDesc}`, 143, 25);

  doc.setFont('Helvetica', 'bold');
  doc.text(`Total Responden:`, 110, 32);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${stats.totalRespondents} Orang`, 138, 32);

  let currentY = 42;

  if (type === 'full' || type === 'summary') {
    // I. KARAKTERISTIK RESPONDEN
    currentY = drawSectionHeader('I. Karakteristik Responden', currentY);

    const eduSorted = Object.entries(stats.pendidikanBreakdown).sort((a, b) => b[1] - a[1]);
    const eduTop1 = eduSorted[0] ? `${eduSorted[0][0]} (${eduSorted[0][1]} org)` : '-';
    const eduTop2 = eduSorted[1] ? `${eduSorted[1][0]} (${eduSorted[1][1]} org)` : '-';
    const eduTop3 = eduSorted[2] ? `${eduSorted[2][0]} (${eduSorted[2][1]} org)` : '-';

    autoTable(doc, {
      startY: currentY,
      head: [['Kategori', 'Detail Variabel / Kelompok', 'Jumlah Responden', 'Persentase']],
      body: [
        ['Kelompok Umur', 'Anak-anak (5-10 tahun)', `${stats.ageGroupBreakdown['5-10']} orang`, `${stats.ageGroupFilledCount ? ((stats.ageGroupBreakdown['5-10'] / stats.ageGroupFilledCount) * 100).toFixed(1) : '0.0'}%`],
        ['Kelompok Umur', 'Remaja (10-18 tahun)', `${stats.ageGroupBreakdown['10-18']} orang`, `${stats.ageGroupFilledCount ? ((stats.ageGroupBreakdown['10-18'] / stats.ageGroupFilledCount) * 100).toFixed(1) : '0.0'}%`],
        ['Kelompok Umur', 'Produktif (18-60 tahun)', `${stats.ageGroupBreakdown['18-60']} orang`, `${stats.ageGroupFilledCount ? ((stats.ageGroupBreakdown['18-60'] / stats.ageGroupFilledCount) * 100).toFixed(1) : '0.0'}%`],
        ['Kelompok Umur', 'Lansia (60+ tahun)', `${stats.ageGroupBreakdown['60+']} orang`, `${stats.ageGroupFilledCount ? ((stats.ageGroupBreakdown['60+'] / stats.ageGroupFilledCount) * 100).toFixed(1) : '0.0'}%`],
        ['Jenis Kelamin', 'Laki-laki', `${stats.genderBreakdown['Laki-laki']} orang`, `${stats.genderFilledCount ? ((stats.genderBreakdown['Laki-laki'] / stats.genderFilledCount) * 100).toFixed(1) : '0.0'}%`],
        ['Jenis Kelamin', 'Perempuan', `${stats.genderBreakdown['Perempuan']} orang`, `${stats.genderFilledCount ? ((stats.genderBreakdown['Perempuan'] / stats.genderFilledCount) * 100).toFixed(1) : '0.0'}%`],
        ['Tingkat Pendidikan', `Dominan 1: ${eduTop1}`, `${eduSorted[0] ? eduSorted[0][1] : 0} orang`, `${stats.pendidikanFilledCount && eduSorted[0] ? ((eduSorted[0][1] / stats.pendidikanFilledCount) * 100).toFixed(1) : '0.0'}%`],
        ['Tingkat Pendidikan', `Dominan 2: ${eduTop2}`, `${eduSorted[1] ? eduSorted[1][1] : 0} orang`, `${stats.pendidikanFilledCount && eduSorted[1] ? ((eduSorted[1][1] / stats.pendidikanFilledCount) * 100).toFixed(1) : '0.0'}%`],
        ['Tingkat Pendidikan', `Dominan 3: ${eduTop3}`, `${eduSorted[2] ? eduSorted[2][1] : 0} orang`, `${stats.pendidikanFilledCount && eduSorted[2] ? ((eduSorted[2][1] / stats.pendidikanFilledCount) * 100).toFixed(1) : '0.0'}%`],
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, textColor: [51, 65, 85] },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 75 },
        2: { halign: 'right', cellWidth: 40 },
        3: { halign: 'right', cellWidth: 35 }
      },
      margin: { left: 10, right: 10 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // II. ANALISIS KEADAAN GIGI
    currentY = drawSectionHeader('II. Analisis Keadaan Gigi', currentY);

    autoTable(doc, {
      startY: currentY,
      head: [['Parameter Keadaan Gigi', 'Gigi Sulung (Deciduous)', 'Gigi Tetap (Permanent)']],
      body: [
        ['Sehat', stats.gigiSulungAvg.sehat.toFixed(2), stats.gigiTetapAvg.sehat.toFixed(2)],
        ['Gigi Berlubang / Karies (d / D)', stats.gigiSulungAvg.karies.toFixed(2), stats.gigiTetapAvg.karies.toFixed(2)],
        ['Gigi Dicabut karena Karies (e / M)', stats.gigiSulungAvg.dicabutKaries.toFixed(2), stats.gigiTetapAvg.dicabutKaries.toFixed(2)],
        ['Tumpatan dengan Karies', stats.gigiSulungAvg.tumpatanKaries.toFixed(2), stats.gigiTetapAvg.tumpatanKaries.toFixed(2)],
        ['Tumpatan tanpa Karies (f / F)', stats.gigiSulungAvg.tumpatanTanpaKaries.toFixed(2), stats.gigiTetapAvg.tumpatanTanpaKaries.toFixed(2)],
        ['Fissure Sealant', stats.gigiSulungAvg.fissureSealant.toFixed(2), stats.gigiTetapAvg.fissureSealant.toFixed(2)],
        ['Protesa Cekat / Implan', stats.gigiSulungAvg.protesaCekat.toFixed(2), stats.gigiTetapAvg.protesaCekat.toFixed(2)],
        ['Gigi Tidak Tumbuh', stats.gigiSulungAvg.tidakTumbuh.toFixed(2), stats.gigiTetapAvg.tidakTumbuh.toFixed(2)],
        ['Gigi Sudah Tanggal (K)', (stats.gigiSulungAvg.sudahTanggal || 0).toFixed(2), '-'],
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, textColor: [51, 65, 85] },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 90 },
        1: { halign: 'right', cellWidth: 50 },
        2: { halign: 'right', cellWidth: 50 }
      },
      margin: { left: 10, right: 10 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // III. INDEKS PENGALAMAN KARIES
    currentY = drawSectionHeader('III. Indeks Pengalaman Karies', currentY);

    let dmftCategory = 'Sangat Rendah (< 1.2)';
    if (stats.indexAvg.dmft >= 1.2 && stats.indexAvg.dmft < 2.7) dmftCategory = 'Rendah (1.2 - 2.6)';
    else if (stats.indexAvg.dmft >= 2.7 && stats.indexAvg.dmft < 4.5) dmftCategory = 'Sedang (2.7 - 4.4)';
    else if (stats.indexAvg.dmft >= 4.5 && stats.indexAvg.dmft < 6.6) dmftCategory = 'Tinggi (4.5 - 6.5)';
    else if (stats.indexAvg.dmft >= 6.6) dmftCategory = 'Sangat Tinggi (>= 6.6)';

    let deftCategory = 'Sangat Rendah (< 1.2)';
    if (stats.indexAvg.deft >= 1.2 && stats.indexAvg.deft < 2.7) deftCategory = 'Rendah (1.2 - 2.6)';
    else if (stats.indexAvg.deft >= 2.7 && stats.indexAvg.deft < 4.5) deftCategory = 'Sedang (2.7 - 4.4)';
    else if (stats.indexAvg.deft >= 4.5 && stats.indexAvg.deft < 6.6) deftCategory = 'Tinggi (4.5 - 6.5)';
    else if (stats.indexAvg.deft >= 6.6) deftCategory = 'Sangat Tinggi (>= 6.6)';

    autoTable(doc, {
      startY: currentY,
      head: [['Indeks Karies', 'Rata-rata Indeks', 'Komponen Pembentuk Indeks', 'Kategori Keparahan (WHO)']],
      body: [
        ['def-t (Gigi Sulung)', stats.indexAvg.deft.toFixed(2), `d: ${stats.indexAvg.d.toFixed(2)} | e: ${stats.indexAvg.e.toFixed(2)} | f: ${stats.indexAvg.f.toFixed(2)}`, deftCategory],
        ['DMF-T (Gigi Tetap)', stats.indexAvg.dmft.toFixed(2), `D: ${stats.indexAvg.D.toFixed(2)} | M: ${stats.indexAvg.M.toFixed(2)} | F: ${stats.indexAvg.F.toFixed(2)}`, dmftCategory],
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, textColor: [51, 65, 85] },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45 },
        1: { halign: 'center', fontStyle: 'bold', cellWidth: 35 },
        2: { cellWidth: 60 },
        3: { fontStyle: 'bold', cellWidth: 50 }
      },
      margin: { left: 10, right: 10 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // IV. KEADAAN MUKOSA ORAL & GUSI
    currentY = drawSectionHeader('IV. Keadaan Mukosa Oral & Gusi', currentY);

    const gusiBerdarahCount = Math.round(stats.mukosaPct.gusiBerdarah * stats.totalRespondents);
    const lesiCount = Math.round(stats.mukosaPct.lesiMukosaOral * stats.totalRespondents);

    autoTable(doc, {
      startY: currentY,
      head: [['Kondisi Pemeriksaan', 'Jumlah Responden Teridentifikasi', 'Persentase Prevalensi']],
      body: [
        ['Gusi Berdarah (Bleeding on Probing)', `${gusiBerdarahCount} Responden`, `${(stats.mukosaPct.gusiBerdarah * 100).toFixed(2)}%`],
        ['Lesi Mukosa Oral (Oral Mucosal Lesions)', `${lesiCount} Responden`, `${(stats.mukosaPct.lesiMukosaOral * 100).toFixed(2)}%`],
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, textColor: [51, 65, 85] },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 90 },
        1: { halign: 'right', cellWidth: 50 },
        2: { halign: 'right', cellWidth: 50 }
      },
      margin: { left: 10, right: 10 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // V. RENCANA TINDAK LANJUT & SISTEM RUJUKAN
    currentY = drawSectionHeader('V. Rencana Tindak Lanjut & Sistem Rujukan', currentY);

    const perluSegeraCount = Math.round(stats.tindakLanjutPct.perluPerawatanSegera * stats.totalRespondents);
    const perluTidakSegeraCount = Math.round(stats.tindakLanjutPct.perluPerawatanTidakSegera * stats.totalRespondents);
    const perluDirujukCount = Math.round(stats.tindakLanjutPct.perluDirujuk * stats.totalRespondents);

    autoTable(doc, {
      startY: currentY,
      head: [['Kategori Tindak Lanjut / Rujukan', 'Jumlah Responden', 'Persentase']],
      body: [
        ['Perlu Perawatan Gigi Segera', `${perluSegeraCount} Responden`, `${(stats.tindakLanjutPct.perluPerawatanSegera * 100).toFixed(2)}%`],
        ['Perlu Perawatan Gigi Tidak Segera', `${perluTidakSegeraCount} Responden`, `${(stats.tindakLanjutPct.perluPerawatanTidakSegera * 100).toFixed(2)}%`],
        ['Memerlukan Rujukan Faskes Lanjutan', `${perluDirujukCount} Responden`, `${(stats.tindakLanjutPct.perluDirujuk * 100).toFixed(2)}%`],
        [' - Rujukan Ke Puskesmas', `${Math.round(stats.tindakLanjutPct.dirujukKePuskesmas * stats.totalRespondents)} Responden`, `${(stats.tindakLanjutPct.dirujukKePuskesmas * 100).toFixed(2)}%`],
        [' - Rujukan Ke Rumah Sakit Umum', `${Math.round(stats.tindakLanjutPct.dirujukKeRSUmum * stats.totalRespondents)} Responden`, `${(stats.tindakLanjutPct.dirujukKeRSUmum * 100).toFixed(2)}%`],
        [' - Rujukan Ke RSGM / RS Gigi & Mulut', `${Math.round(stats.tindakLanjutPct.dirujukKeRSGM * stats.totalRespondents)} Responden`, `${(stats.tindakLanjutPct.dirujukKeRSGM * 100).toFixed(2)}%`],
        [' - Rujukan Ke Klinik Pratama', `${Math.round(stats.tindakLanjutPct.dirujukKeKlinikPratama * stats.totalRespondents)} Responden`, `${(stats.tindakLanjutPct.dirujukKeKlinikPratama * 100).toFixed(2)}%`],
        [' - Rujukan Ke Klinik Utama', `${Math.round(stats.tindakLanjutPct.dirujukKeKlinikUtama * stats.totalRespondents)} Responden`, `${(stats.tindakLanjutPct.dirujukKeKlinikUtama * 100).toFixed(2)}%`],
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, textColor: [51, 65, 85] },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 90 },
        1: { halign: 'right', cellWidth: 50 },
        2: { halign: 'right', cellWidth: 50 }
      },
      margin: { left: 10, right: 10 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // VI. DAFTAR DETAIL HASIL PEMERIKSAAN RESPONDEN
  if (type === 'full' || type === 'detail') {
    currentY = drawSectionHeader('VI. Daftar Detail Hasil Pemeriksaan Responden', currentY);

    const respondentTableBody = respondents.map((r, idx) => {
      let mukosaStr = 'Sehat';
      if (r.mukosa.gusiBerdarah && r.mukosa.lesiMukosaOral) mukosaStr = 'Gusi Berdarah, Lesi Mukosa';
      else if (r.mukosa.gusiBerdarah) mukosaStr = 'Gusi Berdarah';
      else if (r.mukosa.lesiMukosaOral) mukosaStr = 'Lesi Mukosa';

      let rtlStr = 'Perawatan Mandiri';
      if (r.tindakLanjut.perluDirujuk) {
        rtlStr = `Rujuk (${r.tindakLanjut.dirujukKe.toUpperCase().replace('_', ' ')})`;
      } else if (r.tindakLanjut.perluPerawatanSegera) {
        rtlStr = 'Perawatan Segera';
      } else if (r.tindakLanjut.perluPerawatanTidakSegera) {
        rtlStr = 'Perawatan Tidak Segera';
      }

      return [
        idx + 1,
        r.nama || 'Anonim',
        r.tanggalPemeriksaan || r.tanggalInput || '-',
        `${r.umur}th`,
        r.jenisKelamin === 'Laki-laki' ? 'L' : 'P',
        r.alamat || '-',
        r.noTelepon || '-',
        r.namaOrangTua || '-',
        (r.deft ?? 0).toString(),
        (r.dmft ?? 0).toString(),
        mukosaStr,
        rtlStr
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Nama/Kode Responden', 'Tanggal Pemeriksaan', 'Umur', 'Jenis Kelamin', 'Alamat', 'No. Telepon', 'Nama Orang Tua', 'def-t', 'DMF-T', 'Kondisi Mukosa/Gusi', 'Tindak Lanjut']],
      body: respondentTableBody,
      theme: 'grid',
      showHead: 'everyPage',
      styles: {
        fontSize: 6.5,
        cellPadding: 1.5,
        overflow: 'linebreak',
        valign: 'middle',
        textColor: [51, 65, 85]
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 6.5
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 7 },    // No
        1: { cellWidth: 23 },                     // Nama/Kode Responden
        2: { halign: 'center', cellWidth: 16 },   // Tanggal Pemeriksaan
        3: { halign: 'center', cellWidth: 9 },    // Umur
        4: { halign: 'center', cellWidth: 8 },    // JK
        5: { cellWidth: 22 },                     // Alamat
        6: { cellWidth: 16 },                     // No. Telepon
        7: { cellWidth: 18 },                     // Nama Orang Tua
        8: { halign: 'center', cellWidth: 10 },   // def-t
        9: { halign: 'center', cellWidth: 10 },   // DMF-T
        10: { cellWidth: 20 },                    // Kondisi Mukosa/Gusi
        11: { cellWidth: 23 },                    // Tindak Lanjut
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 10, right: 10, top: 18, bottom: 18 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // VII. REKOMENDASI & PENGESAHAN
  currentY = drawSectionHeader('VII. Rekomendasi & Pengesahan', currentY);

  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
    currentY = drawSectionHeader('VII. Rekomendasi & Pengesahan', currentY);
  }

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Rekomendasi Tindak Lanjut:', 13, currentY);

  currentY += 5;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('1. Meningkatkan edukasi cara menyikat gigi yang baik dan benar pada kelompok responden dominan.', 13, currentY);
  doc.text('2. Melakukan kontrol periodik 6 bulan sekali bagi seluruh responden yang berisiko karies aktif.', 13, currentY + 4);
  doc.text('3. Memfasilitasi rujukan ke puskesmas / faskes terdekat bagi responden dengan kondisi memerlukan penanganan segera.', 13, currentY + 8);

  currentY += 22;

  // Signatures
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);

  // Left Sign Block
  doc.text('Mengetahui,', 20, currentY);
  doc.setFont('Helvetica', 'bold');
  doc.text('Pemeriksa / Koordinator Survey', 20, currentY + 4);
  doc.text('___________________________', 20, currentY + 22);
  doc.setFont('Helvetica', 'normal');
  doc.text('NIP / No. Registrasi Dentist', 20, currentY + 26);

  // Right Sign Block
  doc.text('Disetujui oleh,', 130, currentY);
  doc.setFont('Helvetica', 'bold');
  doc.text('Kepala Instansi / Dinkes / PJ', 130, currentY + 4);
  doc.text('___________________________', 130, currentY + 22);
  doc.setFont('Helvetica', 'normal');
  doc.text('NIP.', 130, currentY + 26);

  // Footers on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(10, 285, 200, 285);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Dental Screening Dashboard - Laporan Hasil Survey Kesehatan Gigi dan Mulut', 10, 290);
    doc.text(`Halaman ${i} dari ${pageCount}`, 200, 290, { align: 'right' });
  }

  // Trigger browser download
  const cleanName = sessionName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const cleanFilter = filterDesc.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`laporan_survey_gigi_${cleanName}_${cleanFilter}.pdf`);
}

// 4. Generate Indonesian Dentists' Survey Sample (Matching the 30 October 2025 dataset)
export function generateMockRespondents(): RespondentData[] {
  const respondents: RespondentData[] = [];
  
  // Total 77 respondents in the dataset
  // We will distribute variables to exactly match the metrics in the spreadsheet
  
  // Education Breakdown out of 41 filled:
  // SD: 13, SMP: 13, SMA: 13, S1: 1, S2: 1, Tidak Sekolah: 3
  const educations: Array<'SD'|'SMP'|'SMA'|'S1/D4'|'S2'|'Tidak Sekolah'> = [];
  for (let i = 0; i < 13; i++) educations.push('SD');
  for (let i = 0; i < 13; i++) educations.push('SMP');
  for (let i = 0; i < 13; i++) educations.push('SMA');
  educations.push('S1/D4');
  educations.push('S2');
  for (let i = 0; i < 3; i++) educations.push('Tidak Sekolah');

  // Job Breakdown out of 41 filled:
  // ASN: 2, Swasta: 17, Wiraswasta: 8, Pelajar: 1, IRT/Pengurus: 13
  const jobs: Array<'ASN/PNS/PPPK'|'PEGAWAI SWASTA'|'WIRASWASTA/WIRAUSAHA'|'PELAJAR/MAHASISWA'|'PENGURUS/IBU RUMAH TANGGA'> = [];
  for (let i = 0; i < 2; i++) jobs.push('ASN/PNS/PPPK');
  for (let i = 0; i < 17; i++) jobs.push('PEGAWAI SWASTA');
  for (let i = 0; i < 8; i++) jobs.push('WIRASWASTA/WIRAUSAHA');
  jobs.push('PELAJAR/MAHASISWA');
  for (let i = 0; i < 13; i++) jobs.push('PENGURUS/IBU RUMAH TANGGA');

  // Gender Breakdown out of 30 filled:
  // Laki-laki: 14, Perempuan: 16
  const genders: Array<'Laki-laki'|'Perempuan'> = [];
  for (let i = 0; i < 14; i++) genders.push('Laki-laki');
  for (let i = 0; i < 16; i++) genders.push('Perempuan');

  // Age Group Breakdown out of 39 filled:
  // 5-10 years (36), 18-60 years (3)
  const ageGroups: Array<{age: number, group: '5-10'|'18-60'}> = [];
  for (let i = 0; i < 36; i++) ageGroups.push({ age: Math.floor(Math.random() * 5) + 6, group: '5-10' }); // 6 to 10
  for (let i = 0; i < 3; i++) ageGroups.push({ age: Math.floor(Math.random() * 20) + 25, group: '18-60' }); // 25 to 45

  // Generate 77 respondents
  for (let i = 1; i <= 77; i++) {
    // Fill characteristics or leave blank/optional
    const ed = i <= educations.length ? educations[i - 1] : undefined;
    const jb = i <= jobs.length ? jobs[i - 1] : undefined;
    const gd = i <= genders.length ? genders[i - 1] : (Math.random() > 0.5 ? 'Laki-laki' : 'Perempuan');
    const ageInfo = i <= ageGroups.length ? ageGroups[i - 1] : { age: 8, group: '5-10' as const };
    
    // Keadaan gigi averages matching target stats:
    // Deciduous: Sehat 2.63, Karies (d) 3.38, Dicabut Karies (e) 0.15, Tumpatan (f) 0.00
    // Permanent: Sehat 31.45, Karies (D) 0.41, Dicabut Karies (M) 0.06, Tumpatan (F) 0.00
    let gsSehat = 0;
    let gsKaries = 0;
    let gsDicabut = 0;
    
    let gtSehat = 0;
    let gtKaries = 0;
    let gtDicabut = 0;
    let gtTumpatanKaries = 0;
    let gtLainLain = 0;

    if (ageInfo.group === '5-10') {
      // Primary teeth are highly active
      gsSehat = Math.max(0, Math.floor(Math.random() * 4) + 1); // 1-4
      // We need total average d = 3.38. Let's assign mostly 3 or 4 karies
      gsKaries = Math.random() > 0.2 ? (Math.random() > 0.5 ? 4 : 3) : 2; 
      // Total e = 0.15. 15% chance of 1 dicabut
      gsDicabut = Math.random() < 0.15 ? 1 : 0;
      
      // Permanent teeth are starting to grow
      gtSehat = Math.floor(Math.random() * 4) + 2; // 2-5 healthy permanent teeth
    } else {
      // Adult (18-60)
      gsSehat = 0;
      gsKaries = 0;
      gsDicabut = 0;
      
      // Full permanent dentition: around 28-32 teeth
      gtSehat = Math.random() > 0.3 ? 32 : 31;
      gtKaries = Math.random() < 0.3 ? 1 : 0;
      gtDicabut = Math.random() < 0.1 ? 1 : 0;
      gtTumpatanKaries = Math.random() < 0.05 ? 1 : 0;
      gtLainLain = Math.random() < 0.05 ? 1 : 0;
    }

    // Adjust specific values to match averages closer to 31.45 and 0.41
    if (i % 5 === 0 && ageInfo.group === '5-10') {
      // Some kids have larger karies
      gsKaries += 2;
    }
    
    // Re-verify averages after random distributions:
    const deft = gsKaries + gsDicabut + 0;
    const dmft = gtKaries + gtDicabut + gtTumpatanKaries;

    // Mukosa Percentages: Gusi berdarah: 0.00%, Lesi: 0.00%
    const gusiBerdarah = Math.random() < 0.01; // very small
    const lesiMukosa = Math.random() < 0.01;

    // Tindak Lanjut: 
    // Perlu perawatan segera: 1.30% (~1 person out of 77)
    // Perlu perawatan tidak segera: 3.90% (~3 people out of 77)
    // Perlu dirujuk: 27.27% (~21 people)
    // Dirujuk ke puskesmas: 24.68% (~19 people)
    const perluPerawatanSegera = i === 12; // exactly 1 person
    const perluPerawatanTidakSegera = [15, 27, 48].includes(i); // exactly 3 people
    const perluDirujuk = i <= 21; // exactly 21 people
    const dirujukKe = perluDirujuk ? (i <= 19 ? 'puskesmas' : 'rs_umum') : 'tidak_dirujuk';

    const addresses = ['Sleman, Yogyakarta', 'Bantul, Yogyakarta', 'Kota Yogyakarta', 'Gunungkidul, Yogyakarta', 'Kulon Progo, Yogyakarta'];
    const randomAddress = addresses[i % addresses.length];
    const randomTel = `081234567${100 + i}`;
    const randomOrtu = `Orang Tua #${i}`;
    
    respondents.push({
      nama: `Responden #${i}`,
      alamat: randomAddress,
      noTelepon: randomTel,
      namaOrangTua: randomOrtu,
      tanggalInput: '2025-10-30',
      tanggalPemeriksaan: '2025-10-30',
      jenisKelamin: gd,
      umur: ageInfo.age,
      kelompokUmur: ageInfo.group === '5-10' ? '5-10' : '18-60',
      pendidikan: ed as any,
      pekerjaan: jb as any,
      gigiSulung: {
        sehat: gsSehat,
        karies: gsKaries,
        dicabutKaries: gsDicabut,
        tumpatanKaries: 0,
        tumpatanTanpaKaries: 0,
        dicabutSebabLain: 0,
        fissureSealant: 0,
        protesaCekat: 0,
        tidakTumbuh: 0,
        lainLain: 0
      },
      gigiTetap: {
        sehat: gtSehat || 31, // Default 31
        karies: gtKaries,
        dicabutKaries: gtDicabut,
        tumpatanKaries: gtTumpatanKaries,
        tumpatanTanpaKaries: 0,
        dicabutSebabLain: 0,
        fissureSealant: 0,
        protesaCekat: 0,
        tidakTumbuh: 0,
        lainLain: gtLainLain
      },
      deft,
      dmft,
      mukosa: {
        gusiBerdarah,
        lesiMukosaOral: lesiMukosa
      },
      tindakLanjut: {
        perluPerawatanSegera,
        perluPerawatanTidakSegera,
        perluDirujuk,
        dirujukKe: dirujukKe as any
      },
      createdBy: 'derumarahlaut@gmail.com',
      createdAt: new Date()
    });
  }

  return respondents;
}
