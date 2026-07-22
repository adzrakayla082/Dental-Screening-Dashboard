export interface DeciduousTeethState {
  sehat: number;                     // Sehat
  karies: number;                    // Gigi Berlubang/Karies (d)
  dicabutKaries: number;             // Gigi dicabut karena karies (e)
  tumpatanKaries: number;            // Tumpatan dengan karies
  tumpatanTanpaKaries: number;       // Tumpatan tanpa karies (f)
  dicabutSebabLain: number;          // Gigi dicabut karena sebab lain
  fissureSealant: number;            // Fissure Sealant
  protesaCekat: number;              // Protesa cekat/mahkota cekat/implan/veneer
  tidakTumbuh: number;               // Gigi tidak tumbuh
  lainLain: number;                  // Lain-lain
  sudahTanggal?: number;             // Gigi Sudah Tanggal (K)
}

export interface PermanentTeethState {
  sehat: number;                     // Sehat
  karies: number;                    // Gigi Berlubang/Karies (D)
  dicabutKaries: number;             // Gigi dicabut karena karies (M)
  tumpatanKaries: number;            // Tumpatan dengan karies
  tumpatanTanpaKaries: number;       // Tumpatan tanpa karies (F)
  dicabutSebabLain: number;          // Gigi dicabut karena sebab lain
  fissureSealant: number;            // Fissure Sealant
  protesaCekat: number;              // Protesa cekat/mahkota cekat/implan/veneer
  tidakTumbuh: number;               // Gigi tidak tumbuh
  lainLain: number;                  // Lain-lain
}

export interface MukosaState {
  gusiBerdarah: boolean;             // Gusi berdarah
  lesiMukosaOral: boolean;           // Lesi Mukosa Oral
}

export interface TindakLanjutState {
  perluPerawatanSegera: boolean;     // Perlu perawatan segera
  perluPerawatanTidakSegera: boolean; // Perlu perawatan tidak segera
  perluDirujuk: boolean;             // Perlu dirujuk
  dirujukKe: 'puskesmas' | 'rs_umum' | 'rsgm_rskgm' | 'klinik_pratama' | 'klinik_utama' | 'tidak_dirujuk';
}

export interface RespondentData {
  id?: string;
  nama: string;
  alamat?: string;
  noTelepon?: string;
  namaOrangTua?: string;
  tanggalInput: string; // ISO String or YYYY-MM-DD
  tanggalPemeriksaan?: string; // YYYY-MM-DD (date of examination, defaults to today)
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  umur: number;
  kelompokUmur: '5-10' | '10-18' | '18-60' | '60+'; // 'Antara 5-10 tahun', 'Antara 10-18 tahun', 'Antara 18-60 tahun', '60 tahun ke atas'
  pendidikan: 'SD' | 'SMP' | 'SMA' | 'Diploma' | 'S1/D4' | 'S2' | 'S3' | 'Tidak Sekolah';
  pekerjaan: 'ASN/PNS/PPPK' | 'TNI/POLRI' | 'PEGAWAI BUMN' | 'PEGAWAI SWASTA' | 'WIRASWASTA/WIRAUSAHA' | 'PELAJAR/MAHASISWA' | 'PENGURUS/IBU RUMAH TANGGA' | 'ASISTEN RUMAH TANGGA' | 'TIDAK BEKERJA';
  
  // Dental states
  gigiSulung: DeciduousTeethState;
  gigiTetap: PermanentTeethState;
  teethStatus?: Record<string, string>;
  
  // Indices (calculated)
  deft: number; // d + e + f
  dmft: number; // D + M + F
  
  // Mukosa & RTL
  mukosa: MukosaState;
  tindakLanjut: TindakLanjutState;
  
  // Metadata
  createdBy: string; // User email or "Anonim"
  createdAt: any;    // Firestore Timestamp or Date
}

export interface SurveySession {
  id: string;
  name: string;
  passcode: string;
  createdAt: any;
  createdBy: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'dentist' | 'surveyor';
}

export interface AppUser {
  id?: string;
  namaLengkap: string;
  username: string;
  email: string;
  passwordHash: string;
  passwordPlain?: string; // transient property for creation/updates
  role: 'Administrator' | 'Petugas Pemeriksa';
  createdAt: string;
}

