
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import MasterLog from './components/MasterLog';
import FollowUpView from './components/FollowUpView';
import DailyMetrics from './components/DailyMetrics';
import { CallLogEntry, TabType } from './types';
import { getStoredLogs, saveLogs } from './services/storage';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('master');
  const [entries, setEntries] = useState<CallLogEntry[]>([]);
  
  // Session tracking state
  const [sessionStartTime] = useState<number>(Date.now());
  const [sessionCalls, setSessionCalls] = useState<number>(0);

  // Load data on mount
  useEffect(() => {
    const data = getStoredLogs();
    setEntries(data);
  }, []);

  const handleAdd = (entry: CallLogEntry) => {
    const updated = [entry, ...entries];
    setEntries(updated);
    saveLogs(updated);
    // If it's a new entry (not just an update), it doesn't count as a "session call" 
    // in the dialer sense unless it's logged during the session.
    // In our logic, handleAdd is for pre-loading or manual entry.
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
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveLogs(updated);
  };

  const handleBulkAdd = (newEntries: CallLogEntry[]) => {
    const existingIds = new Set(entries.map(e => e.id));
    const uniqueNew = newEntries.filter(e => !existingIds.has(e.id));
    
    const updated = [...uniqueNew, ...entries];
    setEntries(updated);
    saveLogs(updated);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'master':
        return (
          <MasterLog 
            entries={entries} 
            onAdd={handleAdd} 
            onUpdate={handleUpdate} 
            onDelete={handleDelete}
            onBulkAdd={handleBulkAdd}
          />
        );
      case 'followup':
        return (
          <FollowUpView 
            entries={entries} 
            onUpdate={handleUpdate} 
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
    </Layout>
  );
};

export default App;
