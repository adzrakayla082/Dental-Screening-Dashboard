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

// 3b. Export Descriptive Analysis Report to PDF
export function exportDescriptiveAnalysisToPdf(
  respondents: RespondentData[],
  sessionName: string
) {
  const stats = calculateSurveyStats(respondents);
  const doc = new jsPDF();
  const total = stats.totalRespondents;

  const drawSectionHeader = (title: string, startY: number): number => {
    if (startY > 245) {
      doc.addPage();
      startY = 18;
    }
    doc.setFillColor(237, 233, 254);
    doc.rect(10, startY, 190, 7, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(88, 28, 135);
    doc.text(title, 13, startY + 5);
    return startY + 11;
  };

  // 1. Header & Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('LAPORAN ANALISIS DESKRIPTIF HASIL PEMERIKSAAN KESEHATAN GIGI DAN MULUT', 105, 14, { align: 'center' });

  // Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(10, 18, 190, 18, 2, 2, 'FD');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  doc.text(`Sesi Pemeriksaan:`, 14, 24);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${sessionName}`, 42, 24);

  doc.setFont('Helvetica', 'bold');
  doc.text(`Tanggal Laporan:`, 14, 31);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 42, 31);

  doc.setFont('Helvetica', 'bold');
  doc.text(`Total Responden:`, 120, 24);
  doc.setFont('Helvetica', 'normal');
  doc.text(`${total} Responden`, 148, 24);

  doc.setFont('Helvetica', 'bold');
  doc.text(`Status Data:`, 120, 31);
  doc.setFont('Helvetica', 'normal');
  doc.text(`Analisis Otomatis Aktual`, 148, 31);

  let currentY = 41;

  // I. KARAKTERISTIK RESPONDEN
  currentY = drawSectionHeader('I. KARAKTERISTIK RESPONDEN', currentY);

  const eduSorted = Object.entries(stats.pendidikanBreakdown).sort((a, b) => b[1] - a[1]);
  const jobSorted = Object.entries(stats.pekerjaanBreakdown).sort((a, b) => b[1] - a[1]);

  autoTable(doc, {
    startY: currentY,
    head: [['Variabel Karakteristik', 'Kategori / Kelompok', 'Jumlah (Orang)', 'Persentase (%)']],
    body: [
      ['Kelompok Umur', 'Anak-anak (5-10 tahun)', `${stats.ageGroupBreakdown['5-10'] || 0}`, `${stats.ageGroupFilledCount ? (((stats.ageGroupBreakdown['5-10'] || 0) / stats.ageGroupFilledCount) * 100).toFixed(1) : '0.0'}%`],
      ['Kelompok Umur', 'Remaja (10-18 tahun)', `${stats.ageGroupBreakdown['10-18'] || 0}`, `${stats.ageGroupFilledCount ? (((stats.ageGroupBreakdown['10-18'] || 0) / stats.ageGroupFilledCount) * 100).toFixed(1) : '0.0'}%`],
      ['Kelompok Umur', 'Produktif (18-60 tahun)', `${stats.ageGroupBreakdown['18-60'] || 0}`, `${stats.ageGroupFilledCount ? (((stats.ageGroupBreakdown['18-60'] || 0) / stats.ageGroupFilledCount) * 100).toFixed(1) : '0.0'}%`],
      ['Kelompok Umur', 'Lansia (60+ tahun)', `${stats.ageGroupBreakdown['60+'] || 0}`, `${stats.ageGroupFilledCount ? (((stats.ageGroupBreakdown['60+'] || 0) / stats.ageGroupFilledCount) * 100).toFixed(1) : '0.0'}%`],
      ['Jenis Kelamin', 'Laki-laki', `${stats.genderBreakdown['Laki-laki'] || 0}`, `${stats.genderFilledCount ? (((stats.genderBreakdown['Laki-laki'] || 0) / stats.genderFilledCount) * 100).toFixed(1) : '0.0'}%`],
      ['Jenis Kelamin', 'Perempuan', `${stats.genderBreakdown['Perempuan'] || 0}`, `${stats.genderFilledCount ? (((stats.genderBreakdown['Perempuan'] || 0) / stats.genderFilledCount) * 100).toFixed(1) : '0.0'}%`],
      ['Pendidikan Orang Tua (Dominan)', `${eduSorted[0]?.[0] || '-'}`, `${eduSorted[0]?.[1] || 0}`, `${stats.pendidikanFilledCount && eduSorted[0] ? ((eduSorted[0][1] / stats.pendidikanFilledCount) * 100).toFixed(1) : '0.0'}%`],
      ['Pendidikan Orang Tua (Ke-2)', `${eduSorted[1]?.[0] || '-'}`, `${eduSorted[1]?.[1] || 0}`, `${stats.pendidikanFilledCount && eduSorted[1] ? ((eduSorted[1][1] / stats.pendidikanFilledCount) * 100).toFixed(1) : '0.0'}%`],
      ['Pekerjaan Orang Tua (Dominan)', `${jobSorted[0]?.[0] || '-'}`, `${jobSorted[0]?.[1] || 0}`, `${stats.pekerjaanFilledCount && jobSorted[0] ? ((jobSorted[0][1] / stats.pekerjaanFilledCount) * 100).toFixed(1) : '0.0'}%`],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: [51, 65, 85] },
    headStyles: { fillColor: [88, 28, 135], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { cellWidth: 70 },
      2: { halign: 'right', cellWidth: 38 },
      3: { halign: 'right', cellWidth: 37 }
    },
    margin: { left: 10, right: 10 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // II. ANALISIS KONDISI GIGI SULUNG & INDEKS def-t
  currentY = drawSectionHeader('II. ANALISIS KONDISI GIGI SULUNG & INDEKS def-t', currentY);

  autoTable(doc, {
    startY: currentY,
    head: [['Parameter Odontogram Gigi Sulung', 'Komponen Indeks', 'Jumlah Total Elemen', 'Rata-rata per Responden']],
    body: [
      ['Gigi Sehat', '-', `${Math.round(stats.gigiSulungAvg.sehat * total)}`, stats.gigiSulungAvg.sehat.toFixed(2)],
      ['Gigi Berlubang / Karies', 'd (decayed)', `${Math.round(stats.gigiSulungAvg.karies * total)}`, stats.gigiSulungAvg.karies.toFixed(2)],
      ['Gigi Dicabut karena Karies', 'e (extracted)', `${Math.round(stats.gigiSulungAvg.dicabutKaries * total)}`, stats.gigiSulungAvg.dicabutKaries.toFixed(2)],
      ['Gigi dengan Tumpatan tanpa Karies', 'f (filled)', `${Math.round(stats.gigiSulungAvg.tumpatanTanpaKaries * total)}`, stats.gigiSulungAvg.tumpatanTanpaKaries.toFixed(2)],
      ['Gigi Tumpatan dengan Karies Sekunder', '-', `${Math.round(stats.gigiSulungAvg.tumpatanKaries * total)}`, stats.gigiSulungAvg.tumpatanKaries.toFixed(2)],
      ['Gigi Sudah Tanggal', 'K', `${Math.round((stats.gigiSulungAvg.sudahTanggal || 0) * total)}`, (stats.gigiSulungAvg.sudahTanggal || 0).toFixed(2)],
      ['Gigi Tidak Tumbuh / Agenesis', '-', `${Math.round(stats.gigiSulungAvg.tidakTumbuh * total)}`, stats.gigiSulungAvg.tidakTumbuh.toFixed(2)],
      ['Fissure Sealant & Protesa Cekat', '-', `${Math.round((stats.gigiSulungAvg.fissureSealant + stats.gigiSulungAvg.protesaCekat) * total)}`, (stats.gigiSulungAvg.fissureSealant + stats.gigiSulungAvg.protesaCekat).toFixed(2)],
      ['TOTAL INDEKS def-t (d + e + f)', 'def-t', `${Math.round((stats.indexAvg.deft) * total)}`, stats.indexAvg.deft.toFixed(2)],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: [51, 65, 85] },
    headStyles: { fillColor: [88, 28, 135], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'right', cellWidth: 42 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 43 }
    },
    margin: { left: 10, right: 10 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // III. ANALISIS KONDISI GIGI TETAP & INDEKS DMF-T
  currentY = drawSectionHeader('III. ANALISIS KONDISI GIGI TETAP & INDEKS DMF-T', currentY);

  autoTable(doc, {
    startY: currentY,
    head: [['Parameter Odontogram Gigi Tetap', 'Komponen Indeks', 'Jumlah Total Elemen', 'Rata-rata per Responden']],
    body: [
      ['Gigi Sehat', '-', `${Math.round(stats.gigiTetapAvg.sehat * total)}`, stats.gigiTetapAvg.sehat.toFixed(2)],
      ['Gigi Berlubang / Karies', 'D (Decayed)', `${Math.round(stats.gigiTetapAvg.karies * total)}`, stats.gigiTetapAvg.karies.toFixed(2)],
      ['Gigi Dicabut karena Karies', 'M (Missing)', `${Math.round(stats.gigiTetapAvg.dicabutKaries * total)}`, stats.gigiTetapAvg.dicabutKaries.toFixed(2)],
      ['Gigi dengan Tumpatan tanpa Karies', 'F (Filled)', `${Math.round(stats.gigiTetapAvg.tumpatanTanpaKaries * total)}`, stats.gigiTetapAvg.tumpatanTanpaKaries.toFixed(2)],
      ['Gigi Tumpatan dengan Karies Sekunder', '-', `${Math.round(stats.gigiTetapAvg.tumpatanKaries * total)}`, stats.gigiTetapAvg.tumpatanKaries.toFixed(2)],
      ['Fissure Sealant', '-', `${Math.round(stats.gigiTetapAvg.fissureSealant * total)}`, stats.gigiTetapAvg.fissureSealant.toFixed(2)],
      ['Gigi Tidak Tumbuh / Impaksi', '-', `${Math.round(stats.gigiTetapAvg.tidakTumbuh * total)}`, stats.gigiTetapAvg.tidakTumbuh.toFixed(2)],
      ['Protesa Cekat / Implan', '-', `${Math.round(stats.gigiTetapAvg.protesaCekat * total)}`, stats.gigiTetapAvg.protesaCekat.toFixed(2)],
      ['TOTAL INDEKS DMF-T (D + M + F)', 'DMF-T', `${Math.round((stats.indexAvg.dmft) * total)}`, stats.indexAvg.dmft.toFixed(2)],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: [51, 65, 85] },
    headStyles: { fillColor: [88, 28, 135], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'right', cellWidth: 42 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 43 }
    },
    margin: { left: 10, right: 10 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // IV. KONDISI MUKOSA ORAL & GUSI
  currentY = drawSectionHeader('IV. KONDISI MUKOSA ORAL DAN GUSI', currentY);

  const gusiBerdarahCount = Math.round(stats.mukosaPct.gusiBerdarah * total);
  const lesiCount = Math.round(stats.mukosaPct.lesiMukosaOral * total);
  const mukosaSehatCount = Math.max(0, total - Math.max(gusiBerdarahCount, lesiCount));

  autoTable(doc, {
    startY: currentY,
    head: [['Kondisi Mukosa / Jaringan Lunak Mulut', 'Jumlah Teridentifikasi', 'Persentase Prevalensi (%)']],
    body: [
      ['Gusi Berdarah / Bleeding on Probing (BOP)', `${gusiBerdarahCount} orang`, `${(stats.mukosaPct.gusiBerdarah * 100).toFixed(2)}%`],
      ['Lesi Mukosa Oral (Oral Mucosal Lesions)', `${lesiCount} orang`, `${(stats.mukosaPct.lesiMukosaOral * 100).toFixed(2)}%`],
      ['Kondisi Mukosa / Gusi Sehat (Tanpa Kelainan)', `${mukosaSehatCount} orang`, `${((mukosaSehatCount / total) * 100).toFixed(2)}%`],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: [51, 65, 85] },
    headStyles: { fillColor: [88, 28, 135], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 90 },
      1: { halign: 'right', cellWidth: 50 },
      2: { halign: 'right', fontStyle: 'bold', cellWidth: 50 }
    },
    margin: { left: 10, right: 10 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // V. TINDAK LANJUT DAN RUJUKAN
  currentY = drawSectionHeader('V. TINDAK LANJUT DAN RUJUKAN', currentY);

  autoTable(doc, {
    startY: currentY,
    head: [['Kategori Kebutuhan Perawatan / Rujukan', 'Jumlah Responden', 'Persentase (%)']],
    body: [
      ['Perawatan Gigi Segera', `${Math.round(stats.tindakLanjutPct.perluPerawatanSegera * total)} orang`, `${(stats.tindakLanjutPct.perluPerawatanSegera * 100).toFixed(2)}%`],
      ['Perawatan Gigi Tidak Segera', `${Math.round(stats.tindakLanjutPct.perluPerawatanTidakSegera * total)} orang`, `${(stats.tindakLanjutPct.perluPerawatanTidakSegera * 100).toFixed(2)}%`],
      ['Memerlukan Rujukan Faskes Lanjutan', `${Math.round(stats.tindakLanjutPct.perluDirujuk * total)} orang`, `${(stats.tindakLanjutPct.perluDirujuk * 100).toFixed(2)}%`],
      [' - Tujuan Rujukan: Puskesmas', `${Math.round(stats.tindakLanjutPct.dirujukKePuskesmas * total)} orang`, `${(stats.tindakLanjutPct.dirujukKePuskesmas * 100).toFixed(2)}%`],
      [' - Tujuan Rujukan: Rumah Sakit Umum', `${Math.round(stats.tindakLanjutPct.dirujukKeRSUmum * total)} orang`, `${(stats.tindakLanjutPct.dirujukKeRSUmum * 100).toFixed(2)}%`],
      [' - Tujuan Rujukan: RSGM / RS Gigi & Mulut', `${Math.round(stats.tindakLanjutPct.dirujukKeRSGM * total)} orang`, `${(stats.tindakLanjutPct.dirujukKeRSGM * 100).toFixed(2)}%`],
      [' - Tujuan Rujukan: Klinik Pratama', `${Math.round(stats.tindakLanjutPct.dirujukKeKlinikPratama * total)} orang`, `${(stats.tindakLanjutPct.dirujukKeKlinikPratama * 100).toFixed(2)}%`],
      [' - Tujuan Rujukan: Klinik Utama', `${Math.round(stats.tindakLanjutPct.dirujukKeKlinikUtama * total)} orang`, `${(stats.tindakLanjutPct.dirujukKeKlinikUtama * 100).toFixed(2)}%`],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, textColor: [51, 65, 85] },
    headStyles: { fillColor: [88, 28, 135], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 90 },
      1: { halign: 'right', cellWidth: 50 },
      2: { halign: 'right', fontStyle: 'bold', cellWidth: 50 }
    },
    margin: { left: 10, right: 10 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // VI. KESIMPULAN DESKRIPTIF & REKOMENDASI
  currentY = drawSectionHeader('VI. KESIMPULAN DESKRIPTIF & REKOMENDASI', currentY);

  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
    currentY = drawSectionHeader('VI. KESIMPULAN DESKRIPTIF & REKOMENDASI', currentY);
  }

  let dmftCat = 'Sangat Rendah (< 1.2)';
  if (stats.indexAvg.dmft >= 1.2 && stats.indexAvg.dmft < 2.7) dmftCat = 'Rendah (1.2 - 2.6)';
  else if (stats.indexAvg.dmft >= 2.7 && stats.indexAvg.dmft < 4.5) dmftCat = 'Sedang (2.7 - 4.4)';
  else if (stats.indexAvg.dmft >= 4.5 && stats.indexAvg.dmft < 6.6) dmftCat = 'Tinggi (4.5 - 6.5)';
  else if (stats.indexAvg.dmft >= 6.6) dmftCat = 'Sangat Tinggi (>= 6.6)';

  let deftCat = 'Sangat Rendah (< 1.2)';
  if (stats.indexAvg.deft >= 1.2 && stats.indexAvg.deft < 2.7) deftCat = 'Rendah (1.2 - 2.6)';
  else if (stats.indexAvg.deft >= 2.7 && stats.indexAvg.deft < 4.5) deftCat = 'Sedang (2.7 - 4.4)';
  else if (stats.indexAvg.deft >= 4.5 && stats.indexAvg.deft < 6.6) deftCat = 'Tinggi (4.5 - 6.5)';
  else if (stats.indexAvg.deft >= 6.6) deftCat = 'Sangat Tinggi (>= 6.6)';

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Kesimpulan Otomatis:', 13, currentY);

  currentY += 5;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const conclLines = [
    `1. Berdasarkan pemeriksaan pada ${total} responden, diperoleh rata-rata indeks def-t sebesar ${stats.indexAvg.deft.toFixed(2)} (${deftCat}) dan DMF-T sebesar ${stats.indexAvg.dmft.toFixed(2)} (${dmftCat}).`,
    `2. Komponen karies berlubang aktif (d/D) merupakan penyumbang karies terbesar dibanding komponen perawatan/tumpatan (f/F).`,
    `3. Prevalensi gusi berdarah mencapai ${(stats.mukosaPct.gusiBerdarah * 100).toFixed(1)}% dan lesi mukosa oral ditemukan pada ${(stats.mukosaPct.lesiMukosaOral * 100).toFixed(1)}% populasi.`,
    `4. Sebanyak ${Math.round(stats.tindakLanjutPct.perluDirujuk * total)} responden (${(stats.tindakLanjutPct.perluDirujuk * 100).toFixed(1)}%) memerlukan tindak lanjut rujukan ke faskes.`
  ];

  conclLines.forEach((line) => {
    doc.text(line, 13, currentY);
    currentY += 4.5;
  });

  currentY += 3;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Rekomendasi Intervensi:', 13, currentY);

  currentY += 5;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  const recLines = [
    '1. Meningkatkan program Promosi Kesehatan Gigi dan Mulut (UKGS/UKGM) serta edukasi teknik sikat gigi yang benar.',
    '2. Melakukan program penambalan gigi awal (Restorative Care) untuk menekan angka karies aktif.',
    '3. Memfasilitasi rujukan aktif ke Puskesmas/RSGM terdekat bagi responden yang membutuhkan perawatan lanjutan.'
  ];

  recLines.forEach((line) => {
    doc.text(line, 13, currentY);
    currentY += 4.5;
  });

  currentY += 15;

  // Signatures
  if (currentY > 250) {
    doc.addPage();
    currentY = 25;
  }

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);

  doc.text('Mengetahui,', 20, currentY);
  doc.setFont('Helvetica', 'bold');
  doc.text('Pemeriksa / Tim Analis Data', 20, currentY + 4);
  doc.text('___________________________', 20, currentY + 20);
  doc.setFont('Helvetica', 'normal');
  doc.text('NIP / No. Reg Dental Officer', 20, currentY + 24);

  doc.text('Disetujui oleh,', 130, currentY);
  doc.setFont('Helvetica', 'bold');
  doc.text('Kepala Instansi / Penanggung Jawab', 130, currentY + 4);
  doc.text('___________________________', 130, currentY + 20);
  doc.setFont('Helvetica', 'normal');
  doc.text('NIP.', 130, currentY + 24);

  // Add Page Numbers Footers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(10, 285, 200, 285);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Dental Screening Dashboard - Laporan Analisis Deskriptif Hasil Pemeriksaan Kesehatan Gigi dan Mulut', 10, 290);
    doc.text(`Halaman ${i} dari ${pageCount}`, 200, 290, { align: 'right' });
  }

  const cleanName = sessionName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`laporan_analisis_deskriptif_${cleanName}.pdf`);
}

// 4. Generate 50 Varied, Realistic and Accurately Calculated Dental Screening Respondents
export function generateMockRespondents(): RespondentData[] {
  const firstNames = [
    "Aditya", "Anisa", "Muhammad", "Siti", "Budi", "Dewi", "Gabriel", "Ni Wayan", "Rizka", "Eko",
    "Fani", "Hendra", "Indah", "Joko", "Kiki", "Lutfi", "Maya", "Naufal", "Olivia", "Pandu",
    "Qonita", "Raditya", "Salsabila", "Taufik", "Umar", "Vina", "Wahyu", "Xavier", "Yasmin", "Zainal",
    "Achmad", "Bella", "Candra", "Dina", "Erlangga", "Fitri", "Gilang", "Hany", "Iqbal", "Julia",
    "Kevin", "Laila", "Maulana", "Nadia", "Oktavianus", "Putu Ayu", "Qaisar", "Riana", "Surya", "Tri"
  ];
  
  const lastNames = [
    "Pratama", "Rahmawati", "Rizky", "Nurhaliza", "Santoso", "Lestari", "Fernando", "Sari", "Amalia", "Prasetyo",
    "Novitasari", "Kurniawan", "Permatasari", "Susilo", "Hakim", "Zaki", "Putri", "Wijaya", "Aulia", "Bagas",
    "Firdaus", "Hidayat", "Faruq", "Panduwinata", "Mahardika", "Zhafira", "Abidin", "Fauzi", "Safitri", "Maryana",
    "Putra", "Handayani", "Ramadhan", "Nurhasanah", "Maulana", "Kencana", "Alexander", "Nuraini", "Ibrahim", "Syahputri",
    "Dwi", "Suardana", "Mansur", "Subagyo", "Suryono", "Kasmuri", "Triyono", "Haryanto", "Kusnan", "Sunarto"
  ];

  const addresses = [
    "Jl. Kaliurang Km 5, Sleman", "Godean Km 3, Sleman", "Jl. Magelang Km 7, Sleman", "Jl. Parangtritis Km 4, Bantul",
    "Jl. Imogiri Barat, Bantul", "Jl. Solo Km 9, Kalasan", "Kraton, Kota Yogyakarta", "Jl. Wonosari Km 6, Banguntapan",
    "Kotagede, Yogyakarta", "Wates, Kulon Progo", "Wonosari, Gunungkidul", "Manggisan, Bantul", "Gondomanan, Kota Yogyakarta",
    "Srandakan, Bantul", "Ngaglik, Sleman", "Mlati, Sleman", "Piyungan, Bantul", "Prambanan, Sleman", "Tebet, Kota Yogyakarta",
    "Sewa, Bantul", "Mantrijeron, Kota Yogyakarta", "Kasihan, Bantul", "Sleman, Yogyakarta", "Banggai, Gunungkidul",
    "Gamping, Sleman", "Danurejan, Kota Yogyakarta", "Sentolo, Kulon Progo", "Gondokusuman, Kota Yogyakarta", "Pundong, Bantul"
  ];

  const educations: Array<'SD'|'SMP'|'SMA'|'Diploma'|'S1/D4'|'S2'|'S3'|'Tidak Sekolah'> = ['SD', 'SMP', 'SMA', 'S1/D4', 'S2', 'Diploma', 'Tidak Sekolah'];
  const jobs: Array<'ASN/PNS/PPPK'|'PEGAWAI SWASTA'|'WIRASWASTA/WIRAUSAHA'|'PELAJAR/MAHASISWA'|'PENGURUS/IBU RUMAH TANGGA'|'TIDAK BEKERJA'> = [
    'ASN/PNS/PPPK', 'PEGAWAI SWASTA', 'WIRASWASTA/WIRAUSAHA', 'PELAJAR/MAHASISWA', 'PENGURUS/IBU RUMAH TANGGA', 'TIDAK BEKERJA'
  ];
  const referrals: Array<'puskesmas' | 'rs_umum' | 'rsgm_rskgm' | 'klinik_pratama' | 'klinik_utama' | 'tidak_dirujuk'> = [
    'puskesmas', 'rs_umum', 'rsgm_rskgm', 'klinik_pratama', 'tidak_dirujuk'
  ];

  const respondents: RespondentData[] = [];

  for (let i = 0; i < 50; i++) {
    const fn = firstNames[i];
    const ln = lastNames[i];
    const name = `${fn} ${ln}`;
    const gender: 'Laki-laki' | 'Perempuan' = i % 2 === 0 ? 'Laki-laki' : 'Perempuan';
    
    // Distribute ages realistically across 4 age groups
    let age: number;
    let group: '5-10' | '10-18' | '18-60' | '60+';
    if (i < 22) {
      age = 5 + (i % 6); // 5 to 10
      group = '5-10';
    } else if (i < 34) {
      age = 11 + (i % 8); // 11 to 18
      group = '10-18';
    } else if (i < 45) {
      age = 22 + (i % 35); // 22 to 56
      group = '18-60';
    } else {
      age = 60 + (i % 10); // 60 to 69
      group = '60+';
    }

    const edu = educations[i % educations.length];
    const job = group === '5-10' ? (i % 3 === 0 ? 'PELAJAR/MAHASISWA' : jobs[i % jobs.length]) : jobs[i % jobs.length];
    const addr = addresses[i % addresses.length] + ", Yogyakarta";
    const phone = `081234567${(100 + i).toString().padStart(3, '0')}`;
    const parentName = `Orang Tua ${ln}`;

    // Dental State calculations
    let gsKaries = 0, gsDicabut = 0, gsTumpatan = 0, gsSehat = 0, gsSudahTanggal = 0;
    let gtKaries = 0, gtDicabut = 0, gtTumpatan = 0, gtSehat = 0, gtSealant = 0;

    if (group === '5-10') {
      gsKaries = (i % 5) + 1; // 1 to 5
      gsDicabut = i % 3 === 0 ? 1 : 0;
      gsTumpatan = i % 4 === 0 ? 1 : 0;
      gsSehat = Math.max(0, 20 - gsKaries - gsDicabut - gsTumpatan - (i % 5));
      gsSudahTanggal = Math.min(10, i % 6);
      
      gtKaries = i % 5 === 0 ? 1 : 0;
      gtSehat = 4 + (i % 6);
    } else if (group === '10-18') {
      gsSudahTanggal = 16 + (i % 5);
      gsSehat = Math.max(0, 20 - gsSudahTanggal);
      
      gtKaries = (i % 4);
      gtDicabut = i % 6 === 0 ? 1 : 0;
      gtTumpatan = i % 3 === 0 ? 1 : 0;
      gtSehat = Math.max(10, 28 - gtKaries - gtDicabut - gtTumpatan);
      gtSealant = i % 3 === 0 ? 1 : 0;
    } else if (group === '18-60') {
      gsSudahTanggal = 20;
      
      gtKaries = (i % 4) + 1;
      gtDicabut = (i % 3);
      gtTumpatan = (i % 3);
      gtSehat = Math.max(15, 32 - gtKaries - gtDicabut - gtTumpatan);
    } else {
      // 60+
      gsSudahTanggal = 20;
      
      gtKaries = (i % 3) + 2;
      gtDicabut = (i % 5) + 4;
      gtTumpatan = 1;
      gtSehat = Math.max(5, 32 - gtKaries - gtDicabut - gtTumpatan);
    }

    const deft = gsKaries + gsDicabut + gsTumpatan;
    const dmft = gtKaries + gtDicabut + gtTumpatan;

    const gusiBerdarah = (i % 3 === 0);
    const lesiMukosaOral = (i % 7 === 0);

    const perluPerawatanSegera = (deft > 4 || dmft > 4 || lesiMukosaOral);
    const perluPerawatanTidakSegera = !perluPerawatanSegera && (deft > 0 || dmft > 0 || gusiBerdarah);
    const perluDirujuk = perluPerawatanSegera || (i % 2 === 0 && perluPerawatanTidakSegera);
    const dirujukKe = perluDirujuk ? referrals[i % (referrals.length - 1)] : 'tidak_dirujuk';

    respondents.push({
      nama: name,
      alamat: addr,
      noTelepon: phone,
      namaOrangTua: parentName,
      tanggalInput: '2025-10-30',
      tanggalPemeriksaan: '2025-10-30',
      jenisKelamin: gender,
      umur: age,
      kelompokUmur: group,
      pendidikan: edu,
      pekerjaan: job,
      gigiSulung: {
        sehat: gsSehat,
        karies: gsKaries,
        dicabutKaries: gsDicabut,
        tumpatanKaries: 0,
        tumpatanTanpaKaries: gsTumpatan,
        dicabutSebabLain: 0,
        fissureSealant: 0,
        protesaCekat: 0,
        tidakTumbuh: 0,
        sudahTanggal: gsSudahTanggal,
        lainLain: 0
      },
      gigiTetap: {
        sehat: gtSehat,
        karies: gtKaries,
        dicabutKaries: gtDicabut,
        tumpatanKaries: 0,
        tumpatanTanpaKaries: gtTumpatan,
        dicabutSebabLain: 0,
        fissureSealant: gtSealant,
        protesaCekat: 0,
        tidakTumbuh: 0,
        lainLain: 0
      },
      deft,
      dmft,
      mukosa: {
        gusiBerdarah,
        lesiMukosaOral
      },
      tindakLanjut: {
        perluPerawatanSegera,
        perluPerawatanTidakSegera,
        perluDirujuk,
        dirujukKe
      },
      createdBy: 'derumarahlaut@gmail.com',
      createdAt: '2025-10-30T08:00:00Z'
    });
  }

  return respondents;
}
