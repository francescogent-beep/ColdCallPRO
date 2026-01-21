
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import MasterLog from './components/MasterLog';
import FollowUpView from './components/FollowUpView';
import DailyMetrics from './components/DailyMetrics';
import LogForm from './components/LogForm';
import { CallLogEntry, TabType } from './types';
import { getStoredLogs, saveLogs } from './services/storage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('master');
  const [entries, setEntries] = useState<CallLogEntry[]>([]);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Session tracking state
  const [sessionStartTime] = useState<number>(Date.now());
  const [sessionCalls, setSessionCalls] = useState<number>(0);

  // Load data on mount
  useEffect(() => {
    const data = getStoredLogs();
    setEntries(data);
  }, []);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isAdding || activeCallId) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [isAdding, activeCallId]);

  const handleAdd = (entry: CallLogEntry) => {
    const updated = [entry, ...entries];
    setEntries(updated);
    saveLogs(updated);
    setIsAdding(false);
  };

  const handleUpdate = (entry: CallLogEntry) => {
    const prev = entries.find(e => e.id === entry.id);
    const isNewCall = prev && entry.attemptNumber > prev.attemptNumber;
    
    const updated = entries.map(e => e.id === entry.id ? entry : e);
    setEntries(updated);
    saveLogs(updated);

    if (isNewCall) {
      setSessionCalls(prev => prev + 1);
    }
    setActiveCallId(null);
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveLogs(updated);
  };

  const handleBulkAdd = (newEntries: CallLogEntry[], overwrite: boolean = false) => {
    let updated: CallLogEntry[];
    if (overwrite) {
      updated = newEntries;
    } else {
      const existingIds = new Set(entries.map(e => e.id));
      const uniqueNew = newEntries.filter(e => !existingIds.has(e.id));
      updated = [...uniqueNew, ...entries];
    }
    setEntries(updated);
    saveLogs(updated);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'master':
        return (
          <MasterLog 
            entries={entries} 
            onAddRequest={() => setIsAdding(true)}
            onEditRequest={(id) => setActiveCallId(id)}
            onDelete={handleDelete}
            onBulkAdd={handleBulkAdd}
          />
        );
      case 'followup':
        return (
          <FollowUpView 
            entries={entries} 
            onEditRequest={(id) => setActiveCallId(id)} 
          />
        );
      case 'metrics':
        return (
          <DailyMetrics entries={entries} />
        );
      default:
        return null;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      sessionCalls={sessionCalls}
      sessionStartTime={sessionStartTime}
    >
      {renderContent()}

      {(isAdding || activeCallId) && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[2px] overflow-hidden">
          <LogForm
            initialData={activeCallId ? entries.find(e => e.id === activeCallId) : undefined}
            onSubmit={(entry) => {
              if (activeCallId) handleUpdate(entry);
              else handleAdd(entry);
            }}
            onCancel={() => {
              setIsAdding(false);
              setActiveCallId(null);
            }}
          />
        </div>
      )}
    </Layout>
  );
};

export default App;
