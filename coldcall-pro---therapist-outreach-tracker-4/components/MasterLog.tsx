
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CallLogEntry, LeadStage, WebsiteStatus, MapsVisibility } from '../types';
import { PROFESSION_OPTIONS } from '../constants';
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
  const [citySearch, setCitySearch] = useState('');
  const [showDataMenu, setShowDataMenu] = useState(false);
  const [hideFinished, setHideFinished] = useState(true);
  const [filterNeedsHelp, setFilterNeedsHelp] = useState(false);
  
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
    
    if (searchTerm) {
      result = result.filter(e => 
        e.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.phone.includes(searchTerm)
      );
    }

    if (professionFilter !== 'All') {
      result = result.filter(e => e.profession === professionFilter);
    }

    if (citySearch) {
      result = result.filter(e => 
        (e.city || '').toLowerCase().includes(citySearch.toLowerCase())
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
      const aToday = a.lastCallDate?.startsWith(todayStr);
      const bToday = b.lastCallDate?.startsWith(todayStr);
      if (aToday && !bToday) return -1;
      if (!aToday && bToday) return 1;
      if (a.attemptNumber === 0 && b.attemptNumber > 0) return -1;
      if (a.attemptNumber > 0 && b.attemptNumber === 0) return 1;
      return (b.lastCallDate || '').localeCompare(a.lastCallDate || '');
    });
  }, [entries, searchTerm, professionFilter, citySearch, hideFinished, filterNeedsHelp, todayStr]);

  const hasActiveFilters = professionFilter !== 'All' || citySearch !== '' || filterNeedsHelp;

  // --- SYNC & EXPORT HANDLERS ---

  const handleCopySyncCode = () => {
    try {
      const code = btoa(encodeURIComponent(JSON.stringify(entries)));
      navigator.clipboard.writeText(code).then(() => {
        alert('Sync code copied! You can paste this on another device to sync all data.');
        setShowDataMenu(false);
      });
    } catch (e) {
      alert('Error generating sync code. Make sure your browser supports this feature.');
    }
  };

  const handlePasteSyncCode = () => {
    let code = window.prompt('Paste your sync code here:');
    if (!code) return;
    
    code = code.trim(); // Critical: Remove any accidental whitespace

    try {
      const decoded = JSON.parse(decodeURIComponent(atob(code)));
      if (Array.isArray(decoded)) {
        if (confirm(`Importing ${decoded.length} leads. Continue?`)) {
          onBulkAdd(decoded, false);
          alert('Data synced successfully!');
        }
      } else {
        throw new Error('Invalid format');
      }
    } catch (e) {
      console.error('Sync error:', e);
      alert('Invalid sync code. Make sure you copied the full string correctly.');
    }
    setShowDataMenu(false);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coldcall_pro_backup_${new Date().toISOString().split('T')[0]}.json`;
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
          if (confirm(`Found ${data.length} leads in file. Add them to current list?`)) {
            onBulkAdd(data, false);
            alert('Import complete!');
          }
        } else {
          alert('Invalid file format. File must contain an array of leads.');
        }
      } catch (err) {
        alert('Invalid JSON file. Please make sure it is a valid .json exported from this app.');
      }
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
    };
    reader.readAsText(file);
    setShowDataMenu(false);
  };

  const handleExportCSV = () => {
    if (entries.length === 0) {
      alert('No data to export.');
      return;
    }
    const headers = [
      'Business Name', 'Phone', 'Profession', 'City', 'Contact Name', 
      'Lead Stage', 'Attempt Number', 'Last Outcome', 'Interest Level',
      'Follow Up Date', 'Follow Up Time', 'Reminder Note', 'Last Call Date', 'Who Answered', 'Notes', 'Created At'
    ];
    const rows = entries.map(e => [
      `"${e.businessName}"`,
      `"${e.phone}"`,
      `"${e.profession}"`,
      `"${e.city || ''}"`,
      `"${e.contactName || ''}"`,
      `"${e.leadStage}"`,
      e.attemptNumber,
      `"${e.outcome}"`,
      `"${e.interestLevel}"`,
      `"${e.followUpDate || ''}"`,
      `"${e.followUpTime || ''}"`,
      `"${(e.reminderNote || '').replace(/"/g, '""')}"`,
      `"${e.lastCallDate || ''}"`,
      `"${e.whoAnswered}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
      `"${e.createdAt}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setShowDataMenu(false);
  };

  return (
    <div className="space-y-4">
      {/* Search & Menu Header */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm sticky top-[108px] md:static z-40">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search business or phone..."
              className="block w-full pl-3 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-slate-400 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowDataMenu(!showDataMenu)} 
              className={`p-2 rounded-md border transition-all flex items-center gap-1 ${showDataMenu || hasActiveFilters ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {hasActiveFilters && <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>}
            </button>

            {showDataMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] p-4 space-y-4 animate-in fade-in zoom-in duration-150 origin-top-right overflow-y-auto max-h-[80vh]">
                {/* Section: Filters */}
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">FILTERS</span>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Profession</label>
                      <select 
                        value={professionFilter} 
                        onChange={(e) => setProfessionFilter(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-700"
                      >
                        <option value="All">All Professions</option>
                        {PROFESSION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">City</label>
                      <input 
                        type="text" 
                        placeholder="Search city..." 
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-slate-700"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                      <label className="flex items-center gap-2 px-1 py-1 cursor-pointer hover:bg-slate-50 rounded text-xs font-bold text-slate-600">
                        <input type="checkbox" checked={hideFinished} onChange={() => setHideFinished(!hideFinished)} className="rounded text-indigo-600" />
                        Hide Closed/Booked
                      </label>
                      <label className="flex items-center gap-2 px-1 py-1 cursor-pointer hover:bg-slate-50 rounded text-xs font-bold text-slate-600">
                        <input type="checkbox" checked={filterNeedsHelp} onChange={() => setFilterNeedsHelp(!filterNeedsHelp)} className="rounded text-indigo-600" />
                        Broken Websites Only
                      </label>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Section: File Operations */}
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">FILE OPERATIONS</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleExportJSON} className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <svg className="w-5 h-5 text-indigo-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <span className="text-[9px] font-black uppercase text-slate-600">Export JSON</span>
                    </button>
                    <button onClick={() => jsonFileInputRef.current?.click()} className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <svg className="w-5 h-5 text-indigo-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      <span className="text-[9px] font-black uppercase text-slate-600">Import JSON</span>
                    </button>
                    <input type="file" accept=".json" ref={jsonFileInputRef} className="hidden" onChange={handleImportJSON} />
                    
                    <button onClick={handleExportCSV} className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors col-span-1">
                      <svg className="w-5 h-5 text-emerald-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="text-[9px] font-black uppercase text-slate-600">Export CSV</span>
                    </button>
                    <div className="col-span-1 border border-slate-200 rounded-lg overflow-hidden">
                      <CSVImporter onImport={(d) => { onBulkAdd(d); setShowDataMenu(false); }} />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Section: Quick Sync */}
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">QUICK SYNC (CODE)</span>
                  <div className="flex gap-2">
                    <button onClick={handleCopySyncCode} className="flex-1 py-2 bg-slate-900 text-white rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-800">Copy Code</button>
                    <button onClick={handlePasteSyncCode} className="flex-1 py-2 bg-white border border-slate-200 text-slate-900 rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-50">Paste Code</button>
                  </div>
                </div>

                {hasActiveFilters && (
                  <button 
                    onClick={() => { setProfessionFilter('All'); setCitySearch(''); setFilterNeedsHelp(false); }}
                    className="w-full py-2 bg-indigo-50 text-[9px] font-black uppercase text-indigo-600 rounded hover:bg-indigo-100 border border-indigo-100"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            )}
          </div>

          <button onClick={onAddRequest} className="px-4 py-2 bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform">+ NEW</button>
        </div>
      </div>

      {/* Mobile Leads View */}
      <div className="grid grid-cols-1 md:hidden gap-3">
        {filteredEntries.map((entry) => (
          <div key={entry.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group active:bg-slate-50 transition-colors">
            <div className="absolute top-0 right-0 p-1">
              <span className="bg-slate-100 text-slate-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">{entry.profession}</span>
            </div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-slate-900 leading-tight uppercase text-sm">{entry.businessName}</h3>
                  {entry.lastCallDate?.startsWith(todayStr) && (
                    <span className="bg-indigo-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded">TODAY</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{entry.city || 'No City'}</span>
                  <span className="text-slate-300 text-[8px]">•</span>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Tries: {entry.attemptNumber}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <a href={`tel:${entry.phone}`} className="p-3 text-blue-600 bg-blue-50 rounded-full border border-blue-100 active:bg-blue-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </a>
                <button onClick={() => openWhatsApp(entry)} className="p-3 text-emerald-600 bg-emerald-50 rounded-full border border-emerald-100 active:bg-emerald-100">
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </button>
              </div>
            </div>
            <button onClick={() => onEditRequest(entry.id)} className="w-full py-3.5 bg-indigo-600 text-white rounded text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-md">
              LOG ACTIVITY
            </button>
          </div>
        ))}
        {filteredEntries.length === 0 && (
          <div className="py-20 text-center bg-white border border-dashed border-slate-200 rounded-lg">
             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No results for these filters</span>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-black text-slate-500 uppercase">Prospect</th>
              <th className="px-4 py-3 font-black text-slate-500 uppercase">Location</th>
              <th className="px-4 py-3 font-black text-slate-500 uppercase text-center">Status</th>
              <th className="px-4 py-3 font-black text-slate-500 uppercase text-center">Tries</th>
              <th className="px-4 py-3 font-black text-slate-500 uppercase">Last Activity</th>
              <th className="px-4 py-3 font-black text-slate-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50 group transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="font-black uppercase">{entry.businessName}</div>
                    {entry.lastCallDate?.startsWith(todayStr) && (
                      <span className="bg-indigo-600 text-white text-[7px] font-black px-1 py-0.5 rounded">TODAY</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-slate-100 text-slate-500 text-[8px] font-black px-1 rounded">{entry.profession}</span>
                    <a href={`tel:${entry.phone}`} className="text-[10px] text-blue-500 font-bold hover:underline">{entry.phone}</a>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-700 uppercase tracking-tight">{entry.city || 'N/A'}</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-1">
                    <span className={`px-1 rounded text-[8px] font-black border ${entry.websiteStatus === WebsiteStatus.GOOD ? 'text-emerald-600 border-emerald-100 bg-emerald-50' : 'text-rose-600 border-rose-100 bg-rose-50'}`}>WEB</span>
                    <span className={`px-1 rounded text-[8px] font-black border ${entry.mapsVisibility === MapsVisibility.TOP_3 ? 'text-emerald-600 border-emerald-100 bg-emerald-50' : 'text-amber-600 border-amber-100 bg-amber-50'}`}>SEO</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-black">{entry.attemptNumber}</td>
                <td className="px-4 py-3">
                  <div className="font-black uppercase text-[10px]">{entry.outcome}</div>
                  <div className="text-[9px] text-slate-400">{entry.lastCallDate ? new Date(entry.lastCallDate).toLocaleDateString() : 'N/A'}</div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openWhatsApp(entry)} className="text-slate-400 hover:text-emerald-600 transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></button>
                    <button onClick={() => onEditRequest(entry.id)} className="px-3 py-1 bg-slate-900 text-white rounded font-black uppercase tracking-widest text-[9px] hover:bg-slate-800 transition-colors">LOG</button>
                    <button onClick={() => confirm('Are you sure you want to delete this lead?') && onDelete(entry.id)} className="p-1 text-slate-200 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
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
