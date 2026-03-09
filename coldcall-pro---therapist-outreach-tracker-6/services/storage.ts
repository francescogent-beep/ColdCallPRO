
import { CallLogEntry } from '../types';

const STORAGE_KEY = 'coldcall_pro_data';

export const getStoredLogs = (): CallLogEntry[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveLogs = (logs: CallLogEntry[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
};

export const addLogEntry = (entry: CallLogEntry): void => {
  const logs = getStoredLogs();
  saveLogs([entry, ...logs]);
};

export const updateLogEntry = (updatedEntry: CallLogEntry): void => {
  const logs = getStoredLogs();
  const index = logs.findIndex(l => l.id === updatedEntry.id);
  if (index !== -1) {
    logs[index] = updatedEntry;
    saveLogs(logs);
  }
};

export const deleteLogEntry = (id: string): void => {
  const logs = getStoredLogs();
  saveLogs(logs.filter(l => l.id !== id));
};
