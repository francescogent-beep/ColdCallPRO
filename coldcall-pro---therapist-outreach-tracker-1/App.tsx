
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

  // Load data on mount
  useEffect(() => {
    const data = getStoredLogs();
    setEntries(data);
  }, []);

  const handleAdd = (entry: CallLogEntry) => {
    const updated = [entry, ...entries];
    setEntries(updated);
    saveLogs(updated);
  };

  const handleUpdate = (entry: CallLogEntry) => {
    const updated = entries.map(e => e.id === entry.id ? entry : e);
    setEntries(updated);
    saveLogs(updated);
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveLogs(updated);
  };

  const handleBulkAdd = (newEntries: CallLogEntry[]) => {
    const updated = [...newEntries, ...entries];
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
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
