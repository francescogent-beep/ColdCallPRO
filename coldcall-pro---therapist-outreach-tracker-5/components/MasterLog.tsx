
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CallLogEntry, LeadStage, WebsiteStatus, MapsVisibility, CallOutcome } from '../types';
import { PROFESSION_OPTIONS, OUTCOME_OPTIONS } from '../constants';
import CSVImporter from './CSVImporter';
import { openWhatsApp } from '../services/whatsapp';

interface MasterLogProps {
  entries: CallLogEntry[];
  onAddRequest: () => void;
  onEditRequest: (id: string) => void;
  onDelete: (id: string) => void;
  onBulkAdd: (entries: CallLogEntry[], overwrite?: boolean) => void;
}

const MasterLog: React.FC<MasterLogProps> = ({ entries, onAddRequest, onEditRequest, onDelete, onBulkAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [professionFilter, setProfessionFilter] = useState('All');
  const [outcomeFilter, setOutcomeFilter] = useState('All');
  const [citySearch, setCitySearch] = useState('');
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [hideFinished, setHideFinished] = useState(true);
  const [filterNeedsHelp, setFilterNeedsHelp] = useState(false);
  const [showOnlyNewOrNoAnswer, setShowOnlyNewOrNoAnswer] = useState(true);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const todayStr = new Date().toISOString().split('T')[0];

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
    
    // Base Search
    if (searchTerm) {
      result = result.filter(e => 
        e.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.phone.includes(searchTerm)
      );
    }

    // Visibility Filter: Show only New or No Answer by default
    if (showOnlyNewOrNoAnswer) {
      result = result.filter(e => 
        e.attemptNumber === 0 || e.outcome === CallOutcome.NO_ANSWER
      );
    }

    // Secondary Filters
    if (professionFilter !== 'All') result = result.filter(e => e.profession === professionFilter);
    if (outcomeFilter !== 'All') result = result.filter(e => e.outcome === outcomeFilter);
    if (citySearch) result = result.filter(e => (e.city || '').toLowerCase().includes(citySearch.toLowerCase()));
    if (hideFinished) result = result.filter(e => e.leadStage !== LeadStage.CLOSED && e.leadStage !== LeadStage.BOOKED);
    
    if (filterNeedsHelp) {
      result = result.filter(e => 
        e.websiteStatus === WebsiteStatus.BROKEN || 
        e.websiteStatus === WebsiteStatus.WEAK || 
        e.mapsVisibility === MapsVisibility.PAGE_3 || 
        e.mapsVisibility === MapsVisibility.NOT_VISIBLE
      );
    }

    // Sorting: Leads contacted TODAY go to the BOTTOM
    return result.sort((a, b) => {
      const aToday = !!(a.lastCallDate?.startsWith(todayStr));
      const bToday = !!(b.lastCallDate?.startsWith(todayStr));
      
      if (aToday && !bToday) return 1; 
      if (!aToday && bToday) return -1;
      
      // Secondary sort: most recent calls first (within their own groups)
      return (b.lastCallDate || '').localeCompare(a.lastCallDate || '');
    });
  }, [entries, searchTerm, professionFilter, outcomeFilter, citySearch, hideFinished, filterNeedsHelp, showOnlyNewOrNoAnswer, todayStr]);

  const hasActiveFilters = professionFilter !== 'All' || outcomeFilter !== 'All' || citySearch !== '' || filterNeedsHelp || !showOnlyNewOrNoAnswer;

  // --- DATA SYNC ACTIONS ---
  const handleCopySyncCode = () => {
    try {
      const code = btoa(encodeURIComponent(JSON.stringify(entries)));
      navigator.clipboard.writeText(code).then(() => {
        alert('Sync code copied!');
        setShowDataMenu(false);
      });
    } catch (e) { alert('Sync error.'); }
  };

  const handlePasteSyncCode = () => {
    let code = window.prompt('Paste sync code:');
    if (!code) return;
    try {
      const decoded = JSON.parse(decodeURIComponent(atob(code.trim())));
      if (Array.isArray(decoded)) {
        onBulkAdd(decoded, false);
        alert('Sync successful!');
      }
    } catch (e) { alert('Invalid code.'); }
    setShowDataMenu(false);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `coldcall_backup_${todayStr}.json`;
    link.click();
    setShowDataMenu(false);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          onBulkAdd(data, false);
          alert('State Imported Successfully!');
        }
      } catch (err) { alert('Invalid JSON file.'); }
    };
    reader.readAsText(file);
    setShowDataMenu(false);
  };

  const handleExportCSV = () => {
    if (entries.length === 0) return;
    const headers = ['Business', 'Phone', 'Profession', 'City', 'Status', 'Outcome', 'Attempts'];
    const rows = entries.map(e => [e.businessName, e.phone, e.profession, e.city, e.websiteStatus, e.outcome, e.attemptNumber]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_export_${todayStr}.csv`;
    link.click();
    setShowDataMenu(false);
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Header */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm sticky top-[108px] md:static z-40">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search leads..."
              className="block w-full pl-3 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-400 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowDataMenu(!showDataMenu)} 
              className={`p-2 rounded-lg border transition-all ${showDataMenu || hasActiveFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-400'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </button>
            {showDataMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] p-4 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Visibility Filters</span>
                  
                  <label className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 p-2 rounded-lg border border-indigo-100 cursor-pointer">
                    <input type="checkbox" checked={!showOnlyNewOrNoAnswer} onChange={() => setShowOnlyNewOrNoAnswer(!showOnlyNewOrNoAnswer)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                    <span>Show All Leads (inc. Follow-ups)</span>
                  </label>

                  <div className="h-px bg-slate-100 my-1"></div>

                  <select value={professionFilter} onChange={(e) => setProfessionFilter(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg">
                    <option value="All">All Professions</option>
                    {PROFESSION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <select value={outcomeFilter} onChange={(e) => setOutcomeFilter(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg">
                    <option value="All">All Outcomes</option>
                    {OUTCOME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={hideFinished} onChange={() => setHideFinished(!hideFinished)} /> Hide Closed/Booked</label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={filterNeedsHelp} onChange={() => setFilterNeedsHelp(!filterNeedsHelp)} /> Weak/Broken Web Only</label>
                </div>
                <div className="h-px bg-slate-100"></div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Data Operations</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleExportJSON} className="p-2 border border-slate-100 rounded text-[9px] font-black uppercase">Export JSON</button>
                    <button onClick={() => jsonFileInputRef.current?.click()} className="p-2 border border-slate-100 rounded text-[9px] font-black uppercase">Import JSON</button>
                    <button onClick={handleExportCSV} className="p-2 border border-slate-100 rounded text-[9px] font-black uppercase">Export CSV</button>
                    <CSVImporter onImport={(d) => onBulkAdd(d)} />
                  </div>
                  <input type="file" ref={jsonFileInputRef} className="hidden" onChange={handleImportJSON} accept=".json" />
                </div>
                <div className="h-px bg-slate-100"></div>
                <div className="flex gap-2">
                  <button onClick={handleCopySyncCode} className="flex-1 py-2 bg-slate-900 text-white rounded text-[9px] font-black uppercase">Copy Sync Code</button>
                  <button onClick={handlePasteSyncCode} className="flex-1 py-2 bg-slate-100 text-slate-900 rounded text-[9px] font-black uppercase">Paste Code</button>
                </div>
              </div>
            )}
          </div>
          <button onClick={onAddRequest} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">+ NEW</button>
        </div>
      </div>

      {/* Mobile Feed */}
      <div className="md:hidden space-y-3">
        {filteredEntries.map((entry) => {
          const isCalledToday = !!(entry.lastCallDate?.startsWith(todayStr));
          return (
            <div 
              key={entry.id} 
              className={`p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden transition-colors ${
                isCalledToday ? 'bg-slate-100/80' : 'bg-white'
              }`}
            >
               <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-slate-900 uppercase text-sm truncate">{entry.businessName}</h3>
                    <div className="flex gap-1 shrink-0">
                      <div className={`w-2 h-2 rounded-full ${entry.websiteStatus === WebsiteStatus.GOOD ? 'bg-emerald-500' : 'bg-rose-500'}`} title={`Web: ${entry.websiteStatus}`}></div>
                      <div className={`w-2 h-2 rounded-full ${entry.mapsVisibility === MapsVisibility.TOP_3 ? 'bg-emerald-500' : 'bg-amber-500'}`} title={`SEO: ${entry.mapsVisibility}`}></div>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{entry.profession} • {entry.city || 'No City'}</div>
                </div>
                <div className="flex gap-1.5 ml-2">
                  <button 
                    onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(entry.businessName + ' ' + (entry.city || ''))}`, '_blank')}
                    className="p-2.5 bg-slate-50 text-slate-600 rounded-full border border-slate-100"
                    title="Search Business"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                  <a href={`tel:${entry.phone}`} className="p-2.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></a>
                  <button onClick={() => openWhatsApp(entry)} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></button>
                </div>
              </div>
              <button onClick={() => onEditRequest(entry.id)} className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">LOG ACTIVITY • TRIES: {entry.attemptNumber}</button>
            </div>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-black text-slate-500 uppercase">Prospect</th>
              <th className="px-4 py-3 font-black text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 font-black text-slate-500 uppercase">Location</th>
              <th className="px-4 py-3 font-black text-slate-500 uppercase text-center">Tries</th>
              <th className="px-4 py-3 font-black text-slate-500 uppercase">Last Result</th>
              <th className="px-4 py-3 font-black text-slate-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEntries.map((entry) => {
              const isCalledToday = !!(entry.lastCallDate?.startsWith(todayStr));
              return (
                <tr key={entry.id} className={`hover:bg-slate-50 group transition-colors ${isCalledToday ? 'bg-slate-100/60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-black uppercase">{entry.businessName}</div>
                    <div className="text-[9px] font-bold text-slate-400 mt-0.5">{entry.profession} • {entry.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase ${entry.websiteStatus === WebsiteStatus.GOOD ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>WEB</span>
                      <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase ${entry.mapsVisibility === MapsVisibility.TOP_3 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>SEO</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-bold uppercase">{entry.city || 'N/A'}</td>
                  <td className="px-4 py-3 text-center font-black">{entry.attemptNumber}</td>
                  <td className="px-4 py-3">
                    <div className="font-black text-[10px] uppercase">{entry.outcome}</div>
                    <div className="text-[8px] text-slate-400">{entry.lastCallDate ? new Date(entry.lastCallDate).toLocaleDateString() : 'Never'}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2 items-center">
                      <button 
                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(entry.businessName + ' ' + (entry.city || ''))}`, '_blank')}
                        className="text-slate-400 p-1 hover:bg-slate-50 rounded-lg"
                        title="Search Business"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </button>
                      <button onClick={() => openWhatsApp(entry)} className="text-emerald-500 p-1 hover:bg-emerald-50 rounded-lg"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></button>
                      <button onClick={() => onEditRequest(entry.id)} className="px-3 py-1 bg-slate-900 text-white rounded font-black uppercase tracking-widest text-[9px]">LOG</button>
                      <button onClick={() => confirm('Delete?') && onDelete(entry.id)} className="p-1 text-slate-200 hover:text-rose-600 opacity-0 group-hover:opacity-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MasterLog;
