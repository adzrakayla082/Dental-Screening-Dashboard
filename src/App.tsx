import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, 
  FileDown, 
  TrendingUp, 
  PlusCircle, 
  TableProperties, 
  CloudSun, 
  Sparkles,
  Award,
  Users,
  Sun,
  Moon,
  LogOut,
  Shield,
  ShieldAlert,
  BarChart3
} from 'lucide-react';
import { collection, doc, addDoc, onSnapshot, query, deleteDoc, getDocs, writeBatch, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { RespondentData, AppUser } from './types';
import { exportToExcel, exportToPdf, generateMockRespondents } from './lib/surveyEngine';
import { DUMMY_EXCEL_RESPONDENTS, parseExcelFileToRespondents } from './lib/dummyImportData';

// Subcomponents
import Dashboard from './components/Dashboard';
import DescriptiveAnalysis from './components/DescriptiveAnalysis';
import DentalForm from './components/DentalForm';
import RespondentsList from './components/RespondentsList';
import SessionManager from './components/SessionManager';
import Login from './components/Login';
import UserManagement from './components/UserManagement';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'descriptive' | 'input' | 'data' | 'cloud' | 'users'>('dashboard');
  
  // Theme Configuration (Dark Mode/Light Mode)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Session Configuration
  const [currentSessionId, setCurrentSessionId] = useState('stan-pemeriksaan-gigi-30-oktober-2025');
  const [currentSessionName, setCurrentSessionName] = useState('Stan Pemeriksaan Gigi 30 Oktober 2025');
  const [sessionPasscode, setSessionPasscode] = useState('123456');
  
  const [respondents, setRespondents] = useState<RespondentData[]>([]);
  const [loading, setLoading] = useState(false);

  // Editing Respondent State
  const [editingRespondent, setEditingRespondent] = useState<RespondentData | null>(null);

  // Batch Import Function with Duplicate Detection and Cloud Firestore WriteBatch
  const handleBatchImportRespondents = async (itemsToImport: Omit<RespondentData, 'id' | 'createdAt'>[]) => {
    setLoading(true);
    try {
      const colRef = collection(db, 'sessions', currentSessionId, 'respondents');
      const existingSnapshot = await getDocs(colRef);
      const existingNames = new Set<string>();
      existingSnapshot.forEach((docItem) => {
        const d = docItem.data();
        if (d.nama) existingNames.add(String(d.nama).trim().toLowerCase());
      });

      const batch = writeBatch(db);
      let importedCount = 0;
      let duplicateCount = 0;

      itemsToImport.forEach((item) => {
        const cleanName = String(item.nama).trim().toLowerCase();
        if (existingNames.has(cleanName)) {
          duplicateCount++;
        } else {
          const newDocRef = doc(colRef);
          batch.set(newDocRef, {
            ...item,
            createdAt: new Date().toISOString(),
            createdBy: currentUser?.email || 'System Import'
          });
          existingNames.add(cleanName);
          importedCount++;
        }
      });

      if (importedCount > 0) {
        await batch.commit();
      }

      return {
        total: itemsToImport.length,
        imported: importedCount,
        duplicates: duplicateCount
      };
    } catch (err) {
      console.error("Gagal melakukan batch import responden:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sync to Cloud Firestore when Session ID changes (only when logged in)
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    const colRef = collection(db, 'sessions', currentSessionId, 'respondents');
    const q = query(colRef);

    // Setup real-time listener
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setRespondents([]);
        setLoading(false);
        // Auto seed if active session is default stan-pemeriksaan-gigi-30-oktober-2025
        if (currentSessionId === 'stan-pemeriksaan-gigi-30-oktober-2025') {
          handleBatchImportRespondents(DUMMY_EXCEL_RESPONDENTS).catch(err => {
            console.warn("Auto-seed batch import failed:", err);
          });
        }
        return;
      }

      const list: RespondentData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          ...data,
        } as RespondentData);
      });
      
      setRespondents(list);
      setLoading(false);
    }, (error) => {
      console.error("Gagal mendengarkan data dari cloud:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentSessionId, currentUser]);

  // Cloud Actions
  const handleSaveRespondent = async (data: Omit<RespondentData, 'id' | 'createdAt' | 'createdBy'>, editId?: string) => {
    try {
      if (editId) {
        // Edit Mode
        const docRef = doc(db, 'sessions', currentSessionId, 'respondents', editId);
        await setDoc(docRef, {
          ...data,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.email || 'Anonymous'
        }, { merge: true });
        
        setEditingRespondent(null);
        setActiveTab('data'); // Go back to data list on successful edit
      } else {
        // Create Mode
        const colRef = collection(db, 'sessions', currentSessionId, 'respondents');
        await addDoc(colRef, {
          ...data,
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.email || 'Anonymous'
        });
        
        setActiveTab('data'); // Go back to data list on successful save
      }
    } catch (err) {
      console.error("Gagal menyimpan responden:", err);
      throw err;
    }
  };

  const handleDeleteRespondent = async (id: string) => {
    // Role validation check
    // Petugas Pemeriksa can delete respondents they entered (or we allow CRUD for both, but respect simple restrictions)
    try {
      const docRef = doc(db, 'sessions', currentSessionId, 'respondents', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Gagal menghapus responden:", err);
      throw err;
    }
  };

  const handleEditRespondent = (respondent: RespondentData) => {
    setEditingRespondent(respondent);
    setActiveTab('input');
  };

  const handleCancelEditRespondent = () => {
    setEditingRespondent(null);
    setActiveTab('data');
  };

  const handleLoadMockData = async (mockData: RespondentData[]) => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const colRef = collection(db, 'sessions', currentSessionId, 'respondents');
      
      mockData.forEach((item) => {
        const newDocRef = doc(colRef); // Auto-generate ID in subcollection
        // Save without ID property as it becomes the doc name
        const { id, ...payload } = item;
        batch.set(newDocRef, {
          ...payload,
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.email || 'Anonymous'
        });
      });
      
      await batch.commit();
    } catch (err) {
      console.error("Gagal mengunggah data kustom:", err);
      alert("Gagal mengunggah data ke Cloud.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearSessionData = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, 'sessions', currentSessionId, 'respondents');
      const qSnapshot = await getDocs(colRef);
      
      const docs = qSnapshot.docs;
      for (let i = 0; i < docs.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + 400);
        chunk.forEach((docItem) => {
          batch.delete(docItem.ref);
        });
        await batch.commit();
      }
      
      setRespondents([]);
    } catch (err) {
      console.error("Gagal membersihkan data:", err);
      alert("Gagal mengosongkan data.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = (id: string, name: string, passcode: string) => {
    setCurrentSessionId(id);
    setCurrentSessionName(name);
    setSessionPasscode(passcode);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setEditingRespondent(null);
    setActiveTab('dashboard');
  };

  // Trigger Exports
  const triggerPdfExport = () => {
    if (respondents.length === 0) {
      alert("Tidak ada data untuk diekspor ke PDF!");
      return;
    }
    exportToPdf(respondents, currentSessionName);
  };

  const triggerExcelExport = () => {
    if (respondents.length === 0) {
      alert("Tidak ada data untuk diekspor ke Excel!");
      return;
    }
    exportToExcel(respondents, currentSessionName);
  };

  // Guard routing - if not logged in, show Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen font-sans">
        <Login 
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            localStorage.setItem('currentUser', JSON.stringify(user));
          }} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-800 font-sans" id="app-root">
      
      {/* Top Banner & Title Bar */}
      <header className="glass-panel border-b border-white/30 sticky top-0 z-40 shadow-lg shadow-purple-900/5 backdrop-blur-xl" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left Brand Area */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600/90 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                <FileSpreadsheet className="w-5.5 h-5.5" />
              </div>
              <div>
                <h1 className="text-md sm:text-lg font-black text-slate-900 tracking-tight leading-tight">Dental Screening Dashboard</h1>
                <p className="text-[10px] text-slate-500 font-bold tracking-wide">Dashboard Pemeriksaan dan Analisis Kesehatan Gigi</p>
              </div>
            </div>

            {/* Right Export / Status Area */}
            <div className="flex items-center gap-2">
              {respondents.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={triggerPdfExport}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/50 hover:bg-white/80 border border-white/50 backdrop-blur-md text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                    title="Unduh Laporan PDF Lengkap"
                    id="btn-global-export-pdf"
                  >
                    <FileDown className="w-4 h-4 text-rose-500" />
                    <span className="hidden sm:inline">Ekspor PDF</span>
                  </button>

                  <button
                    onClick={triggerExcelExport}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/50 hover:bg-white/80 border border-white/50 backdrop-blur-md text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                    title="Unduh Data Excel Mentah"
                    id="btn-global-export-excel"
                  >
                    <FileDown className="w-4 h-4 text-emerald-500" />
                    <span className="hidden sm:inline">Ekspor Excel</span>
                  </button>
                </div>
              )}

              {/* Connected Cloud Pill */}
              <div className="hidden md:flex items-center gap-1.5 bg-purple-50/50 backdrop-blur-md border border-purple-100/40 px-3 py-1.5 rounded-xl shadow-xs">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-extrabold text-purple-700 uppercase tracking-widest font-mono">Cloud Synced</span>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2.5 bg-white/50 hover:bg-white/85 border border-white/50 backdrop-blur-md text-slate-700 rounded-xl shadow-xs transition-all duration-200 cursor-pointer hover:scale-105"
                title={darkMode ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
                id="btn-dark-mode-toggle"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-purple-600" />}
              </button>

              {/* Logged in User Badge & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200/50">
                <div className="text-right hidden lg:block">
                  <div className="text-xs font-extrabold text-slate-900 truncate max-w-[120px]" title={currentUser.namaLengkap}>{currentUser.namaLengkap}</div>
                  <div className="text-[9px] font-bold text-purple-600 uppercase tracking-wider">{currentUser.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2.5 bg-rose-50/50 hover:bg-rose-500 hover:text-white text-rose-600 border border-rose-100/30 rounded-xl shadow-xs transition-all duration-200 cursor-pointer hover:scale-105 flex items-center justify-center"
                  title="Keluar dari Aplikasi (Logout)"
                  id="btn-logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Navigation Tabs and Session Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 bg-white/35 backdrop-blur-xl border border-white/40 rounded-2xl shadow-sm" id="navigation-bar">
          
          {/* Navigation Controls */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-white/50 hover:text-slate-800'}`}
              id="tab-dashboard"
            >
              <TrendingUp className="w-4 h-4" /> Analisis Real-Time
            </button>

            <button
              onClick={() => setActiveTab('descriptive')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'descriptive' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-white/50 hover:text-slate-800'}`}
              id="tab-descriptive"
            >
              <BarChart3 className="w-4 h-4" /> Analisis Deskriptif
            </button>

            <button
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'input' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-white/50 hover:text-slate-800'}`}
              id="tab-input"
            >
              <PlusCircle className="w-4 h-4" /> {editingRespondent ? 'Edit Pemeriksaan' : 'Input Pemeriksaan'}
            </button>

            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'data' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-white/50 hover:text-slate-800'}`}
              id="tab-data"
            >
              <TableProperties className="w-4 h-4" /> Data Responden
            </button>

            {/* Admin-Only Tabs */}
            {currentUser.role === 'Administrator' && (
              <>
                <button
                  onClick={() => setActiveTab('cloud')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'cloud' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-white/50 hover:text-slate-800'}`}
                  id="tab-cloud"
                >
                  <CloudSun className="w-4 h-4" /> Koneksi Cloud
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${activeTab === 'users' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' : 'text-slate-600 hover:bg-white/50 hover:text-slate-800'}`}
                  id="tab-users"
                >
                  <Shield className="w-4 h-4" /> Manajemen User
                </button>
              </>
            )}
          </div>

          {/* Current Session Indicator */}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-white/45 backdrop-blur-md border border-white/50 rounded-xl shadow-xs">
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[150px] sm:max-w-[200px]" title={currentSessionName}>
              Sesi: <strong className="font-bold text-purple-900">{currentSessionName}</strong>
            </span>
          </div>

        </div>

        {/* Loading Overlay */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/40 backdrop-blur-xl border border-white/40 rounded-3xl shadow-lg" id="loader-view">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="text-slate-700 text-sm mt-4 font-bold">Sinkronisasi data dengan Firestore Cloud...</p>
          </div>
        ) : (
          <div className="animate-fadeIn" id="tab-content-area">
            {/* Tab Rendering */}
            {activeTab === 'dashboard' && (
              <Dashboard respondents={respondents} />
            )}

            {activeTab === 'descriptive' && (
              <DescriptiveAnalysis respondents={respondents} sessionName={currentSessionName} />
            )}

            {activeTab === 'input' && (
              <DentalForm 
                onSaveRespondent={handleSaveRespondent} 
                nextRespondentNumber={respondents.length + 1}
                editingRespondent={editingRespondent}
                onCancelEdit={handleCancelEditRespondent}
              />
            )}

            {activeTab === 'data' && (
              <RespondentsList 
                respondents={respondents} 
                onDeleteRespondent={handleDeleteRespondent}
                onEditRespondent={handleEditRespondent}
                onBatchImport={handleBatchImportRespondents}
                onClearAllData={async () => {
                  if (confirm('Apakah Anda yakin ingin menghapus seluruh data responden?')) {
                    await handleClearSessionData();
                  }
                }}
              />
            )}

            {activeTab === 'cloud' && currentUser.role === 'Administrator' && (
              <SessionManager
                currentSessionId={currentSessionId}
                currentSessionName={currentSessionName}
                sessionPasscode={sessionPasscode}
                onJoinSession={handleJoinSession}
                onLoadMockData={handleLoadMockData}
                onClearSessionData={handleClearSessionData}
                respondentsCount={respondents.length}
              />
            )}

            {activeTab === 'users' && currentUser.role === 'Administrator' && (
              <UserManagement currentUser={currentUser} />
            )}
          </div>
        )}

      </main>

      {/* Mini App Footer */}
      <footer className="text-center py-8 text-xs text-slate-500 font-semibold" id="app-footer">
        <p>Dental Screening Dashboard • Dilengkapi dengan Sinkronisasi Cloud Firestore & Ekspor Data Klinis</p>
      </footer>

    </div>
  );
}
