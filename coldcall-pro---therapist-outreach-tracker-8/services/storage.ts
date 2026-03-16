
import { CallLogEntry, SessionMetric } from '../types';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../src/firebase';

const STORAGE_KEY = 'coldcall_pro_data';
const SESSION_STORAGE_KEY = 'coldcall_pro_sessions';

// Connection test
export const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
};

// Local Storage Fallbacks (for migration or offline)
export const getLocalLogs = (): CallLogEntry[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const getLocalSessions = (): SessionMetric[] => {
  const data = localStorage.getItem(SESSION_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// Firestore Operations
export const getLeads = async (): Promise<CallLogEntry[]> => {
  try {
    const user = auth.currentUser;
    if (!user) return getLocalLogs();
    
    const q = query(collection(db, 'leads'), where('uid', '==', user.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as CallLogEntry);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return getLocalLogs(); // Fallback to local logs on error
  }
};

export const saveLead = async (lead: CallLogEntry): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      const logs = getLocalLogs();
      const index = logs.findIndex(l => l.id === lead.id);
      if (index !== -1) logs[index] = lead;
      else logs.unshift(lead);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
      return;
    }
    
    const leadWithUid = { ...lead, uid: user.uid };
    await setDoc(doc(db, 'leads', lead.id), leadWithUid);
  } catch (error) {
    console.error("Error saving lead:", error);
    throw error;
  }
};

export const deleteLead = async (id: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    const logs = getLocalLogs();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.filter(l => l.id !== id)));
    return;
  }
  await deleteDoc(doc(db, 'leads', id));
};

export const getSessions = async (): Promise<SessionMetric[]> => {
  try {
    const user = auth.currentUser;
    if (!user) return getLocalSessions();
    
    const q = query(collection(db, 'sessions'), where('uid', '==', user.uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as SessionMetric);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return getLocalSessions();
  }
};

export const saveSession = async (session: SessionMetric): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      const sessions = getLocalSessions();
      const index = sessions.findIndex(s => s.id === session.id);
      if (index !== -1) sessions[index] = session;
      else sessions.unshift(session);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions));
      return;
    }
    
    const sessionWithUid = { ...session, uid: user.uid };
    await setDoc(doc(db, 'sessions', session.id), sessionWithUid);
  } catch (error) {
    console.error("Error saving session:", error);
    throw error;
  }
};

// Legacy support for App.tsx (will be refactored)
export const getStoredLogs = getLocalLogs;
export const saveLogs = (logs: CallLogEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
};
