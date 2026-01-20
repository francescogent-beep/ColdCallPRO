
import React, { useState } from 'react';
import { CallLogEntry, InterestLevel, CallOutcome, LeadStage } from '../types';
import LogForm from './LogForm';
import CSVImporter from './CSVImporter';

interface MasterLogProps {
  entries: CallLogEntry[];
  onAdd: (entry: CallLogEntry) => void;
  onUpdate: (entry: CallLogEntry) => void;
  onDelete: (id: string) => void;
  onBulkAdd: (entries: CallLogEntry[]) => void;
}

const MasterLog: React.FC<MasterLogProps> = ({ entries, onAdd, onUpdate, onDelete, onBulkAdd }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEntries = entries.filter(e => 
    e.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.phone.includes(searchTerm)
  );

  const getStageBadge = (stage: LeadStage) => {
    switch (stage) {
      case LeadStage.NEW: return 'bg-slate-100 text-slate-600 border-slate-200';
      case LeadStage.IN_PROGRESS: return 'bg-blue-50 text-blue-700 border-blue-200';
      case LeadStage.BOOKED: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case LeadStage.CLOSED: return 'bg-slate-800 text-white border-slate-800';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3 flex-1 w-full">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Quick search prospects..."
              className="block w-full pl-3 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md shadow-sm focus:ring-1 focus:ring-slate-400 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <CSVImporter onImport={onBulkAdd} />
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto px-4 py-1.5 bg-slate-900 text-white rounded-md text-sm font-bold hover:bg-slate-800 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          + Add Prospect
        </button>
      </div>

      {(isAdding || activeCallId) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-auto">
            <LogForm
              initialData={activeCallId ? entries.find(e => e.id === activeCallId) : undefined}
              onSubmit={(entry) => {
                if (activeCallId) onUpdate(entry);
                else onAdd(entry);
                setIsAdding(false);
                setActiveCallId(null);
              }}
              onCancel={() => {
                setIsAdding(false);
                setActiveCallId(null);
              }}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 font-bold text-slate-500 uppercase tracking-wider">Prospect</th>
                <th className="px-3 py-2 font-bold text-slate-500 uppercase tracking-wider">Stage</th>
                <th className="px-3 py-2 font-bold text-slate-500 uppercase tracking-wider">Last Outcome</th>
                <th className="px-3 py-2 font-bold text-slate-500 uppercase tracking-wider text-center">Attempts</th>
                <th className="px-3 py-2 font-bold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className={`hover:bg-slate-50 group ${entry.leadStage === LeadStage.CLOSED ? 'opacity-50' : ''}`}>
                  <td className="px-3 py-2">
                    <div className="font-bold text-slate-900 leading-tight">{entry.businessName}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="mono font-bold text-blue-600">{entry.phone}</span>
                      <span className="text-slate-300">|</span>
                      <span>{entry.contactName || 'No Contact'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded-[2px] text-[9px] font-black uppercase border ${getStageBadge(entry.leadStage)}`}>
                      {entry.leadStage}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {entry.leadStage === LeadStage.NEW ? (
                      <span className="text-slate-400 italic font-medium">Pre-loaded</span>
                    ) : (
                      <div>
                        <div className="font-bold text-slate-700 uppercase tracking-tight">{entry.outcome}</div>
                        <div className="text-[9px] text-slate-400 truncate max-w-[150px]">{entry.notes}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`font-black ${entry.attemptNumber > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                      {entry.attemptNumber}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => setActiveCallId(entry.id)}
                        disabled={entry.leadStage === LeadStage.CLOSED || entry.leadStage === LeadStage.BOOKED}
                        className={`px-3 py-1 rounded text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
                          entry.leadStage === LeadStage.NEW 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm' 
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                        } disabled:opacity-0 disabled:pointer-events-none`}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 005.47 5.47l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                        {entry.attemptNumber === 0 ? 'Call Now' : 'Log Next'}
                      </button>
                      
                      <button 
                        onClick={() => { if (confirm('Delete prospect?')) onDelete(entry.id); }}
                        className="p-1 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-slate-400 font-medium italic">
                    No leads found. Import a CSV or add one manually to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MasterLog;
