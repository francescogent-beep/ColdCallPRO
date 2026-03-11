
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import MasterLog from './components/MasterLog';
import FollowUpView from './components/FollowUpView';
import DailyMetrics from './components/DailyMetrics';
import LogForm from './components/LogForm';
import { CallLogEntry, TabType, CallOutcome } from './types';
import { getStoredLogs, saveLogs } from './services/storage';
import { checkReminders } from './services/notifications';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('master');
  const [entries, setEntries] = useState<CallLogEntry[]>([]);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Session tracking state
  const [sessionStartTime] = useState<number>(Date.now());
  const [sessionCalls, setSessionCalls] = useState<number>(0);
  const [sessionRejections, setSessionRejections] = useState<number>(0);

  // Load data on mount
  useEffect(() => {
    const data = getStoredLogs();
    setEntries(data);
  }, []);

  // Check for reminders every minute
  useEffect(() => {
    if (entries.length > 0) {
      checkReminders(entries); // Initial check
      const interval = setInterval(() => {
        checkReminders(entries);
      }, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [entries]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isAdding || activeCallId) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [isAdding, activeCallId]);

  const isRejection = (outcome: CallOutcome) => {
    return [
      CallOutcome.NOT_INTERESTED_HARD,
      CallOutcome.NOT_NOW,
      CallOutcome.ALREADY_GOT_SOMEONE
    ].includes(outcome);
  };

  const handleAdd = (entry: CallLogEntry) => {
    const updated = [entry, ...entries];
    setEntries(updated);
    saveLogs(updated);
    setIsAdding(false);
    
    // Track session stats for new entry if it has a result
    if (entry.lastCallDate) {
      setSessionCalls(prev => prev + 1);
      if (isRejection(entry.outcome)) {
        setSessionRejections(prev => prev + 1);
      }
    }
  };

  const handleUpdate = (entry: CallLogEntry) => {
    const prev = entries.find(e => e.id === entry.id);
    const isNewCall = prev && entry.attemptNumber > prev.attemptNumber;
    
    const updated = entries.map(e => e.id === entry.id ? entry : e);
    setEntries(updated);
    saveLogs(updated);

    if (isNewCall) {
      setSessionCalls(prev => prev + 1);
      if (isRejection(entry.outcome)) {
        setSessionRejections(prev => prev + 1);
      }
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
      // De-duplication logic: Prevent adding prospects that already exist by checking ID and Phone Number
      const existingIds = new Set(entries.map(e => e.id));
      const existingPhones = new Set(entries.map(e => e.phone.replace(/\D/g, '')).filter(p => p !== ''));
      const seenInBatch = new Set<string>();

      const uniqueNew = newEntries.filter(e => {
        const cleanPhone = e.phone.replace(/\D/g, '');
        const isDuplicate = existingIds.has(e.id) || (cleanPhone !== '' && (existingPhones.has(cleanPhone) || seenInBatch.has(cleanPhone)));
        
        if (!isDuplicate && cleanPhone !== '') {
          seenInBatch.add(cleanPhone);
        }
        
        return !isDuplicate;
      });
      
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
            onUpdate={handleUpdate}
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
      sessionRejections={sessionRejections}
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
