
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CallLogEntry, LeadStage, WebsiteStatus, MapsVisibility, CallOutcome, WhoAnswered } from '../types';
import { PROFESSION_OPTIONS, OUTCOME_OPTIONS } from '../constants';
import CSVImporter from './CSVImporter';
import { openWhatsApp } from '../services/whatsapp';

interface MasterLogProps {
  entries: CallLogEntry[];
  onAddRequest: () => void;
  onEditRequest: (id: string) => void;
  onDelete: (id: string) => void;
  onBulkAdd: (entries: CallLogEntry[], overwrite?: boolean) => void;
  onUpdate: (entry: CallLogEntry) => void;
}

const MasterLog: React.FC<MasterLogProps> = ({ entries, onAddRequest, onEditRequest, onDelete, onBulkAdd, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [professionFilter, setProfessionFilter] = useState('All');
  const [outcomeFilter, setOutcomeFilter] = useState('All');
  const [citySearch, setCitySearch] = useState('');
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [hideFinished, setHideFinished] = useState(true);
  const [filterNeedsHelp, setFilterNeedsHelp] = useState(false);
  const [showOnlyNewOrNoAnswer, setShowOnlyNewOrNoAnswer] = useState(true);
  const [hardNoPromptId, setHardNoPromptId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };
  
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
    const headers = ['Business', 'Phone', 'Profession', 'City', 'Status', 'Outcome', 'Attempts', 'Map Link', 'Website Link'];
    const rows = entries.map(e => [
      `"${e.businessName}"`, 
      e.phone, 
      e.profession, 
      e.city, 
      e.websiteStatus, 
      e.outcome, 
      e.attemptNumber,
      `"${e.mapLink || ''}"`,
      `"${e.websiteLink || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_export_${todayStr}.csv`;
    link.click();
    setShowDataMenu(false);
  };

  const handleQuickNoAnswer = (entry: CallLogEntry) => {
    const now = new Date().toISOString();
    const updatedEntry: CallLogEntry = {
      ...entry,
      attemptNumber: entry.attemptNumber + 1,
      whoAnswered: WhoAnswered.NO_ANSWER,
      outcome: CallOutcome.NO_ANSWER,
      lastCallDate: now,
      leadStage: entry.leadStage === LeadStage.NEW ? LeadStage.IN_PROGRESS : entry.leadStage,
      actionHistory: [
        {
          date: now,
          outcome: CallOutcome.NO_ANSWER,
          notes: 'Quick Log: No Answer',
          attempt: entry.attemptNumber + 1
        },
        ...entry.actionHistory
      ]
    };
    onUpdate(updatedEntry);
  };

  const handleQuickHardNo = (entry: CallLogEntry, who: WhoAnswered) => {
    const now = new Date().toISOString();
    const updatedEntry: CallLogEntry = {
      ...entry,
      attemptNumber: entry.attemptNumber + 1,
      whoAnswered: who,
      outcome: CallOutcome.NOT_INTERESTED_HARD,
      lastCallDate: now,
      leadStage: LeadStage.CLOSED,
      actionHistory: [
        {
          date: now,
          outcome: CallOutcome.NOT_INTERESTED_HARD,
          notes: `Quick Log: Hard No (${who})`,
          attempt: entry.attemptNumber + 1
        },
        ...entry.actionHistory
      ]
    };
    onUpdate(updatedEntry);
    setHardNoPromptId(null);
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
      <div className="md:hidden space-y-4 px-1">
        {filteredEntries.map((entry) => {
          const isCalledToday = !!(entry.lastCallDate?.startsWith(todayStr));
          return (
            <div 
              key={entry.id} 
              className={`rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden transition-all ${
                isCalledToday ? 'bg-slate-50/80' : 'bg-white'
              }`}
            >
              {/* Card Header: Identity & Status */}
              <div className="p-4 pb-3">
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 uppercase text-base leading-tight truncate">
                      {entry.businessName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">
                        {entry.profession}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight truncate">
                        {entry.city || 'No City'}
                      </span>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(entry.phone, entry.id + '-phone')}
                      className="flex items-center gap-1.5 mt-2 px-2 py-1 bg-slate-100 rounded-lg group active:bg-slate-200 transition-colors"
                    >
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">{entry.phone}</span>
                      {copiedId === entry.id + '-phone' ? (
                        <span className="text-[8px] font-black text-emerald-600 uppercase animate-in fade-in zoom-in-95">Copied!</span>
                      ) : (
                        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                      )}
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0 items-end">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${
                      entry.websiteStatus === WebsiteStatus.GOOD 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      WEB: {entry.websiteStatus}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${
                      entry.mapsVisibility === MapsVisibility.TOP_3 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      SEO: {entry.mapsVisibility}
                    </span>
                  </div>
                </div>

                {/* Communication/Research Actions */}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  <a 
                    href={`tel:${entry.phone}`} 
                    className="flex flex-col items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 active:scale-95 transition-transform"
                  >
                    <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <span className="text-[8px] font-black uppercase">Call</span>
                  </a>
                  <button 
                    onClick={() => openWhatsApp(entry)} 
                    className="flex flex-col items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 active:scale-95 transition-transform"
                  >
                    <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    <span className="text-[8px] font-black uppercase">WA</span>
                  </button>
                  <button 
                    onClick={() => {
                      const url = entry.mapLink || `https://www.google.com/search?q=${encodeURIComponent(entry.businessName + ' ' + (entry.city || ''))}`;
                      window.open(url, '_blank');
                    }}
                    className="flex flex-col items-center justify-center p-3 bg-slate-50 text-slate-600 rounded-xl border border-slate-100 active:scale-95 transition-transform"
                  >
                    <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="text-[8px] font-black uppercase">Maps</span>
                  </button>
                  <button 
                    onClick={() => entry.websiteLink ? window.open(entry.websiteLink, '_blank') : alert('No website link')}
                    disabled={!entry.websiteLink}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border active:scale-95 transition-transform ${
                      entry.websiteLink ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-300 border-slate-100 opacity-50'
                    }`}
                  >
                    <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                    <span className="text-[8px] font-black uppercase">Web</span>
                  </button>
                </div>
              </div>

              {/* Quick Log Bar */}
              <div className="flex border-t border-slate-100 bg-slate-50/50">
                <button 
                  onClick={() => handleQuickNoAnswer(entry)}
                  className="flex-1 py-3 flex items-center justify-center gap-2 border-r border-slate-100 active:bg-slate-100 transition-colors"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">No Ans</span>
                </button>
                <button 
                  onClick={() => setHardNoPromptId(hardNoPromptId === entry.id ? null : entry.id)}
                  className={`flex-1 py-3 flex items-center justify-center gap-2 active:bg-rose-100 transition-colors ${hardNoPromptId === entry.id ? 'bg-rose-600 text-white' : 'text-rose-600'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${hardNoPromptId === entry.id ? 'text-white' : 'text-rose-600'}`}>Hard No</span>
                </button>
              </div>

              {/* Hard No Prompt Overlay */}
              {hardNoPromptId === entry.id && (
                <div className="p-3 bg-rose-600 animate-in fade-in slide-in-from-bottom-2">
                  <div className="text-[9px] font-black text-white/70 uppercase tracking-[0.2em] mb-2 text-center">Who rejected the offer?</div>
                  <div className="flex gap-2">
                    <button onClick={() => handleQuickHardNo(entry, WhoAnswered.OWNER)} className="flex-1 py-2.5 bg-white text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Owner</button>
                    <button onClick={() => handleQuickHardNo(entry, WhoAnswered.GATEKEEPER)} className="flex-1 py-2.5 bg-rose-700 text-white border border-rose-500 rounded-lg text-[10px] font-black uppercase tracking-widest">Gatekeeper</button>
                  </div>
                </div>
              )}

              {/* Primary Action */}
              <button 
                onClick={() => onEditRequest(entry.id)} 
                className="w-full py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] active:bg-black transition-colors flex items-center justify-center gap-2"
              >
                <span>Log Activity</span>
                <span className="px-1.5 py-0.5 bg-white/10 rounded text-[8px]">Tries: {entry.attemptNumber}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Prospect Info</th>
              <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Location</th>
              <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px] text-center">Tries</th>
              <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px]">Last Result</th>
              <th className="px-6 py-4 font-black text-slate-500 uppercase tracking-widest text-[10px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEntries.map((entry) => {
              const isCalledToday = !!(entry.lastCallDate?.startsWith(todayStr));
              return (
                <tr key={entry.id} className={`hover:bg-slate-50/80 group transition-all ${isCalledToday ? 'bg-slate-50/40' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-900 uppercase text-sm tracking-tight">{entry.businessName}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{entry.profession}</span>
                      <span className="text-slate-200">•</span>
                      <button 
                        onClick={() => copyToClipboard(entry.phone, entry.id + '-phone-desktop')}
                        className="flex items-center gap-1.5 hover:bg-slate-100 px-1.5 py-0.5 rounded transition-colors group"
                        title="Click to copy"
                      >
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{entry.phone}</span>
                        {copiedId === entry.id + '-phone-desktop' ? (
                          <span className="text-[8px] font-black text-emerald-600 uppercase">Copied!</span>
                        ) : (
                          <svg className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{entry.city || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-900 font-black text-[10px]">
                      {entry.attemptNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`font-black text-[10px] uppercase ${
                      entry.outcome === CallOutcome.BOOKED ? 'text-rose-600' : 
                      entry.outcome === CallOutcome.INTERESTED ? 'text-indigo-600' : 'text-slate-900'
                    }`}>
                      {entry.outcome}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">
                      {entry.lastCallDate ? new Date(entry.lastCallDate).toLocaleDateString() : 'Never Contacted'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5 items-center">
                      {hardNoPromptId === entry.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl border border-rose-100 animate-in fade-in zoom-in-95">
                          <span className="text-[9px] font-black text-rose-600 uppercase px-2">Who?</span>
                          <button onClick={() => handleQuickHardNo(entry, WhoAnswered.OWNER)} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">Owner</button>
                          <button onClick={() => handleQuickHardNo(entry, WhoAnswered.GATEKEEPER)} className="px-3 py-1.5 bg-white text-rose-600 border border-rose-200 rounded-lg text-[9px] font-black uppercase tracking-widest">GK</button>
                          <button onClick={() => setHardNoPromptId(null)} className="p-1.5 text-rose-300 hover:text-rose-600 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleQuickNoAnswer(entry)}
                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Quick No Answer"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          </button>
                          <button 
                            onClick={() => setHardNoPromptId(entry.id)}
                            className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Quick Hard No"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                          <div className="w-px h-4 bg-slate-200 mx-1"></div>
                          <button 
                            onClick={() => {
                              const url = entry.mapLink || `https://www.google.com/search?q=${encodeURIComponent(entry.businessName + ' ' + (entry.city || ''))}`;
                              window.open(url, '_blank');
                            }}
                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                            title={entry.mapLink ? "Open Maps" : "Search Business"}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          </button>
                          {entry.websiteLink && (
                            <button 
                              onClick={() => window.open(entry.websiteLink, '_blank')}
                              className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Visit Website"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                            </button>
                          )}
                          <button 
                            onClick={() => openWhatsApp(entry)} 
                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="WhatsApp"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          </button>
                          <div className="w-px h-4 bg-slate-200 mx-1"></div>
                          <button 
                            onClick={() => onEditRequest(entry.id)} 
                            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-black uppercase tracking-widest text-[10px] shadow-sm hover:bg-black transition-colors"
                          >
                            Log
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${entry.businessName}?`)) {
                                onDelete(entry.id);
                              }
                            }} 
                            className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                            title="Delete Lead"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      )}
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
