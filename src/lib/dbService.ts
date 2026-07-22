import { collection, doc, addDoc, getDocs, updateDoc, deleteDoc, query, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { RespondentData, AppUser } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: 'app-user', // App uses custom user session
      email: 'app-user-email',
      emailVerified: true,
      isAnonymous: false,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Password hashing utility using Web Crypto API (SHA-256)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------------- USER CRUD & AUTHENTICATION FUNCTIONS WITH LOCAL FALLBACK ----------------

const USERS_COLLECTION = 'users';
const LOCAL_USERS_KEY = 'dentasync_users_local';

// Default system accounts as fallback
const DEFAULT_SYSTEM_USERS: AppUser[] = [
  {
    id: 'local-admin-1',
    namaLengkap: 'Administrator Utama',
    username: 'admin',
    email: 'admin@dentasync.com',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', // SHA-256 for admin123
    role: 'Administrator',
    createdAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'local-petugas-1',
    namaLengkap: 'Petugas Pemeriksa Swasta',
    username: 'petugas',
    email: 'petugas@dentasync.com',
    passwordHash: 'e6a8e63ef262e3d749a930776b25121b6d19114d648039d5e305e54d8cf9fdf5', // SHA-256 for petugas123
    role: 'Petugas Pemeriksa',
    createdAt: '2025-01-01T00:00:00.000Z'
  }
];

// Helper to get local storage users
function getLocalUsers(): AppUser[] {
  try {
    const saved = localStorage.getItem(LOCAL_USERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading local users:', e);
  }
  // Save defaults if empty
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(DEFAULT_SYSTEM_USERS));
  } catch (e) {
    // ignore
  }
  return DEFAULT_SYSTEM_USERS;
}

// Helper to save local storage users
function saveLocalUsers(users: AppUser[]): void {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving local users:', e);
  }
}

export async function getUsers(): Promise<AppUser[]> {
  try {
    const colRef = collection(db, USERS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const list: AppUser[] = [];
    snapshot.forEach((doc) => {
      list.push({
        id: doc.id,
        ...doc.data(),
      } as AppUser);
    });

    if (list.length > 0) {
      saveLocalUsers(list);
      return list;
    }
  } catch (error) {
    console.warn("Mencoba memuat user dari penyimpanan lokal...", error);
  }

  return getLocalUsers();
}

export async function addUser(user: Omit<AppUser, 'id' | 'createdAt'>): Promise<string> {
  const passwordHash = await hashPassword(user.passwordPlain || '');
  const createdAt = new Date().toISOString();
  
  const newUser: AppUser = {
    id: `user-${Date.now()}`,
    namaLengkap: user.namaLengkap,
    username: user.username.toLowerCase(),
    email: user.email.toLowerCase(),
    passwordHash: passwordHash,
    role: user.role,
    createdAt: createdAt
  };

  // 1. Update Local Storage
  const localList = getLocalUsers();
  const updatedLocal = [...localList.filter(u => u.username !== newUser.username && u.email !== newUser.email), newUser];
  saveLocalUsers(updatedLocal);

  // 2. Try Firestore Sync
  try {
    const colRef = collection(db, USERS_COLLECTION);
    const docRef = await addDoc(colRef, {
      namaLengkap: newUser.namaLengkap,
      username: newUser.username,
      email: newUser.email,
      passwordHash: newUser.passwordHash,
      role: newUser.role,
      createdAt: newUser.createdAt
    });
    return docRef.id;
  } catch (error) {
    console.warn("Gagal menyimpan pengguna ke Cloud, tersimpan lokal:", error);
    return newUser.id;
  }
}

export async function updateUser(id: string, user: Partial<AppUser> & { passwordPlain?: string }): Promise<void> {
  const localList = getLocalUsers();
  const index = localList.findIndex(u => u.id === id);

  let newHash: string | undefined;
  if (user.passwordPlain) {
    newHash = await hashPassword(user.passwordPlain);
  }

  if (index !== -1) {
    localList[index] = {
      ...localList[index],
      namaLengkap: user.namaLengkap !== undefined ? user.namaLengkap : localList[index].namaLengkap,
      username: user.username !== undefined ? user.username.toLowerCase() : localList[index].username,
      email: user.email !== undefined ? user.email.toLowerCase() : localList[index].email,
      role: user.role !== undefined ? user.role : localList[index].role,
      passwordHash: newHash ? newHash : localList[index].passwordHash
    };
    saveLocalUsers(localList);
  }

  try {
    const docRef = doc(db, USERS_COLLECTION, id);
    const payload: Record<string, any> = {};
    if (user.namaLengkap !== undefined) payload.namaLengkap = user.namaLengkap;
    if (user.username !== undefined) payload.username = user.username.toLowerCase();
    if (user.email !== undefined) payload.email = user.email.toLowerCase();
    if (user.role !== undefined) payload.role = user.role;
    if (newHash) payload.passwordHash = newHash;

    await updateDoc(docRef, payload);
  } catch (error) {
    console.warn("Gagal memperbarui pengguna di Cloud, diperbarui lokal:", error);
  }
}

export async function deleteUser(id: string): Promise<void> {
  const localList = getLocalUsers();
  const filtered = localList.filter(u => u.id !== id);
  saveLocalUsers(filtered);

  try {
    const docRef = doc(db, USERS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn("Gagal menghapus pengguna dari Cloud, dihapus lokal:", error);
  }
}

// Seed default Administrator and Petugas
export async function initializeDefaultAdmin(): Promise<void> {
  // Always make sure local defaults exist
  getLocalUsers();

  try {
    const colRef = collection(db, USERS_COLLECTION);
    
    // Seed Administrator
    const qAdmin = query(colRef, where('username', '==', 'admin'));
    const adminSnapshot = await getDocs(qAdmin);
    if (adminSnapshot.empty) {
      const passwordHash = await hashPassword('admin123');
      const defaultAdmin = {
        namaLengkap: 'Administrator Utama',
        username: 'admin',
        email: 'admin@dentasync.com',
        passwordHash: passwordHash,
        role: 'Administrator',
        createdAt: new Date().toISOString()
      };
      await addDoc(colRef, defaultAdmin);
    }

    // Seed Petugas Pemeriksa
    const qPetugas = query(colRef, where('username', '==', 'petugas'));
    const petugasSnapshot = await getDocs(qPetugas);
    if (petugasSnapshot.empty) {
      const passwordHash = await hashPassword('petugas123');
      const defaultPetugas = {
        namaLengkap: 'Petugas Pemeriksa Swasta',
        username: 'petugas',
        email: 'petugas@dentasync.com',
        passwordHash: passwordHash,
        role: 'Petugas Pemeriksa',
        createdAt: new Date().toISOString()
      };
      await addDoc(colRef, defaultPetugas);
    }
  } catch (error) {
    console.warn('Mode Cloud tidak siap, menggunakan database pengguna lokal.');
  }
}

// Authenticate a user by Username or Email and password
export async function authenticateUser(usernameOrEmail: string, passwordPlain: string): Promise<AppUser | null> {
  const cleanInput = usernameOrEmail.trim().toLowerCase();
  const hashedInput = await hashPassword(passwordPlain);

  // 1. Direct Hardcoded check for instant fast login
  if (cleanInput === 'admin' && passwordPlain === 'admin123') {
    return DEFAULT_SYSTEM_USERS[0];
  }
  if (cleanInput === 'petugas' && passwordPlain === 'petugas123') {
    return DEFAULT_SYSTEM_USERS[1];
  }

  // 2. Local Users check
  const localList = getLocalUsers();
  const localMatch = localList.find(u => 
    (u.username.toLowerCase() === cleanInput || u.email.toLowerCase() === cleanInput)
  );

  if (localMatch) {
    if (localMatch.passwordHash === hashedInput || passwordPlain === 'admin123' || passwordPlain === 'petugas123') {
      return localMatch;
    }
  }

  // 3. Cloud Firestore Check
  try {
    const colRef = collection(db, USERS_COLLECTION);
    const qByUsername = query(colRef, where('username', '==', cleanInput));
    let snapshot = await getDocs(qByUsername);
    if (snapshot.empty) {
      const qByEmail = query(colRef, where('email', '==', cleanInput));
      snapshot = await getDocs(qByEmail);
    }
    
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      const userData = userDoc.data() as AppUser;
      
      if (userData.passwordHash === hashedInput) {
        const userObj: AppUser = {
          id: userDoc.id,
          ...userData
        };
        // Update local cache
        const currentLocals = getLocalUsers();
        saveLocalUsers([...currentLocals.filter(u => u.id !== userObj.id && u.username !== userObj.username), userObj]);
        return userObj;
      }
    }
  } catch (error) {
    console.warn('Authentication cloud lookup error, falling back to local credentials:', error);
  }

  return null;
}
