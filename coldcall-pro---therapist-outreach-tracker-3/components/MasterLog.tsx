
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CallLogEntry, InterestLevel, CallOutcome, LeadStage, WebsiteStatus, MapsVisibility } from '../types';
import LogForm from './LogForm';
import CSVImporter from './CSVImporter';
import { openWhatsApp } from '../services/whatsapp';

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
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [hideFinished, setHideFinished] = useState(true);
  const [filterNeedsHelp, setFilterNeedsHelp] = useState(false);
  
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDataMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredEntries = useMemo(() => {
    let result = [...entries];
    if (searchTerm) {
      result = result.filter(e => 
        e.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.phone.includes(searchTerm)
      );
    }
    if (hideFinished) {
      result = result.filter(e => e.leadStage !== LeadStage.CLOSED && e.leadStage !== LeadStage.BOOKED);
    }
    if (filterNeedsHelp) {
      result = result.filter(e => 
        e.websiteStatus === WebsiteStatus.BROKEN || 
        e.websiteStatus === WebsiteStatus.WEAK || 
        e.mapsVisibility === MapsVisibility.PAGE_3 || 
        e.mapsVisibility === MapsVisibility.NOT_VISIBLE
      );
    }
    return result.sort((a, b) => {
      if (a.attemptNumber === 0 && b.attemptNumber > 0) return -1;
      if (a.attemptNumber > 0 && b.attemptNumber === 0) return 1;
      if (a.lastCallDate && b.lastCallDate) {
        return a.lastCallDate.localeCompare(b.lastCallDate);
      }
      return 0;
    });
  }, [entries, searchTerm, hideFinished, filterNeedsHelp]);

  const getStageBadge = (stage: LeadStage) => {
    switch (stage) {
      case LeadStage.NEW: return 'bg-slate-100 text-slate-600 border-slate-200';
      case LeadStage.IN_PROGRESS: return 'bg-blue-50 text-blue-700 border-blue-200';
      case LeadStage.BOOKED: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case LeadStage.CLOSED: return 'bg-slate-800 text-white border-slate-800';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `coldcall_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setShowDataMenu(false);
  };

  const handleExportCSV = () => {
    if (entries.length === 0) return alert('No data');
    const headers = ['Business Name', 'Contact Name', 'Phone', 'Website', 'Maps', 'Attempts', 'Outcome', 'Stage'];
    const rows = entries.map(e => [`"${e.businessName}"`, `"${e.contactName}"`, `'${e.phone}`, e.websiteStatus, e.mapsVisibility, e.attemptNumber, e.outcome, e.leadStage]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setShowDataMenu(false);
  };

  const handleClearAll = () => {
    if (confirm('DANGEROUS: Clear ALL data forever?')) {
      if (confirm('Are you absolutely sure? This cannot be undone.')) {
        onBulkAdd([]); // Effectively clears if implementation matches
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2 bg-white p-2 md:p-3 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search leads..."
              className="block w-full pl-3 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-400 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowDataMenu(!showDataMenu)} className={`p-2 transition-all rounded-md flex items-center gap-1 border ${showDataMenu ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              <span className="text-[10px] font-black uppercase hidden sm:inline">Settings</span>
            </button>
            {showDataMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-2xl z-[70] overflow-hidden">
                <div className="p-3 space-y-3">
                  <div className="space-y-2">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">View Options</div>
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">Hide Finished</span>
                      <input type="checkbox" checked={hideFinished} onChange={() => setHideFinished(!hideFinished)} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer group">
                      <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">Needs Help Only</span>
                      <input type="checkbox" checked={filterNeedsHelp} onChange={() => setFilterNeedsHelp(!filterNeedsHelp)} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    </label>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1">Data Management</div>
                    <CSVImporter onImport={(data) => { onBulkAdd(data); setShowDataMenu(false); }} />
                    <button onClick={() => jsonInputRef.current?.click()} className="w-full text-left px-2 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded flex items-center gap-2"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Restore JSON</button>
                    <button onClick={handleExportCSV} className="w-full text-left px-2 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded flex items-center gap-2"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Export CSV</button>
                    <button onClick={handleExportJSON} className="w-full text-left px-2 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded flex items-center gap-2"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>Backup JSON</button>
                    <button onClick={handleClearAll} className="w-full text-left px-2 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded flex items-center gap-2"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Wipe All Data</button>
                    <input type="file" accept=".json" ref={jsonInputRef} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const imported = JSON.parse(event.target?.result as string);
                          if (Array.isArray(imported)) onBulkAdd(imported);
                        } catch (err) { alert('Invalid JSON'); }
                        setShowDataMenu(false);
                      };
                      reader.readAsText(file);
                    }} className="hidden" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <button onClick={() => setIsAdding(true)} className="px-6 py-2 bg-slate-900 text-white rounded-md text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95">+ Add Lead</button>
      </div>

      {(isAdding || activeCallId) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-0 md:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl h-full md:h-auto md:my-auto">
            <LogForm
              initialData={activeCallId ? entries.find(e => e.id === activeCallId) : undefined}
              onSubmit={(entry) => { if (activeCallId) onUpdate(entry); else onAdd(entry); setIsAdding(false); setActiveCallId(null); }}
              onCancel={() => { setIsAdding(false); setActiveCallId(null); }}
            />
          </div>
        </div>
      )}

      {/* Leads List Mobile */}
      <div className="grid grid-cols-1 md:hidden gap-3 pb-20">
        {filteredEntries.map((entry) => (
          <div key={entry.id} className={`bg-white p-4 rounded-lg border border-slate-200 shadow-sm ${entry.leadStage === LeadStage.CLOSED ? 'opacity-50 grayscale' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-black text-slate-900 leading-tight uppercase tracking-tight">{entry.businessName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-1 py-0.5 rounded-[2px] text-[8px] font-black uppercase border ${getStageBadge(entry.leadStage)}`}>{entry.leadStage}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase">{entry.attemptNumber} ATTEMPTS</span>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={`tel:${entry.phone}`} className="p-2 text-blue-600 bg-blue-50 rounded-full border border-blue-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </a>
                <button onClick={() => openWhatsApp(entry)} className="p-2 text-emerald-600 bg-emerald-50 rounded-full border border-emerald-100">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </button>
              </div>
            </div>
            <button onClick={() => setActiveCallId(entry.id)} className="w-full py-3 bg-indigo-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-sm">
              {entry.attemptNumber === 0 ? 'START CALLING' : 'NEXT ATTEMPT'}
            </button>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Prospect</th>
              <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
              <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-center">Tries</th>
              <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest">Last Activity</th>
              <th className="px-4 py-3 font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className={`hover:bg-slate-50 group transition-colors ${entry.leadStage === LeadStage.CLOSED ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3"><div className="font-black text-slate-900 leading-tight uppercase">{entry.businessName}</div><a href={`tel:${entry.phone}`} className="text-[10px] text-blue-500 hover:underline font-bold mono mt-1">{entry.phone}</a></td>
                <td className="px-4 py-3 text-center"><div className="flex justify-center gap-1"><span className={`px-1 rounded text-[8px] font-black border ${entry.websiteStatus === WebsiteStatus.GOOD ? 'text-emerald-600 border-emerald-100 bg-emerald-50' : 'text-rose-600 border-rose-100 bg-rose-50'}`}>WEB</span><span className={`px-1 rounded text-[8px] font-black border ${entry.mapsVisibility === MapsVisibility.TOP_3 ? 'text-emerald-600 border-emerald-100 bg-emerald-50' : 'text-amber-600 border-amber-100 bg-amber-50'}`}>SEO</span></div></td>
                <td className="px-4 py-3 text-center"><span className={`font-black ${entry.attemptNumber > 0 ? 'text-slate-900' : 'text-slate-300'}`}>{entry.attemptNumber}</span></td>
                <td className="px-4 py-3"><div className="font-black text-slate-700 uppercase text-[10px]">{entry.outcome}</div><div className="text-[9px] text-slate-400">{entry.lastCallDate ? new Date(entry.lastCallDate).toLocaleDateString() : 'N/A'}</div></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openWhatsApp(entry)} className="p-1.5 text-slate-400 hover:text-emerald-600" title="WhatsApp"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></button>
                    <button onClick={() => setActiveCallId(entry.id)} className="px-3 py-1 bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-black">{entry.attemptNumber === 0 ? 'LOG' : 'RETRY'}</button>
                    <button onClick={() => { if (confirm('Delete?')) onDelete(entry.id); }} className="p-1.5 text-slate-200 hover:text-rose-600 opacity-0 group-hover:opacity-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterLog;
