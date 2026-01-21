
import React, { useState, useMemo } from 'react';
import { CallLogEntry, WhoAnswered, WhatsAppSent, CallOutcome } from '../types';

interface DailyMetricsProps {
  entries: CallLogEntry[];
}

type MetricView = 'daily' | 'weekly' | 'monthly' | 'custom';

const DailyMetrics: React.FC<DailyMetricsProps> = ({ entries }) => {
  const [view, setView] = useState<MetricView>('daily');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const filteredEntries = useMemo(() => {
    const getEntriesInRange = (start: Date, end: Date) => {
      // Set end to end of day
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);

      return entries.filter(e => {
        if (!e.lastCallDate) return false;
        const callDate = new Date(e.lastCallDate);
        return callDate >= start && callDate <= endOfDay;
      });
    };

    switch (view) {
      case 'daily': {
        const start = new Date(todayStr);
        return getEntriesInRange(start, start);
      }
      case 'weekly': {
        const start = new Date();
        start.setDate(today.getDate() - 7);
        return getEntriesInRange(start, today);
      }
      case 'monthly': {
        const start = new Date();
        start.setDate(today.getDate() - 30);
        return getEntriesInRange(start, today);
      }
      case 'custom': {
        if (!customStart || !customEnd) return [];
        return getEntriesInRange(new Date(customStart), new Date(customEnd));
      }
      default:
        return [];
    }
  }, [entries, view, customStart, customEnd, todayStr]);

  const stats = [
    {
      label: 'Calls Made',
      value: filteredEntries.length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      color: 'bg-slate-900',
    },
    {
      label: 'Conversations',
      value: filteredEntries.filter(e => e.whoAnswered !== WhoAnswered.NO_ANSWER).length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'bg-indigo-600',
    },
    {
      label: 'DMs Reached',
      value: filteredEntries.filter(e => e.whoAnswered === WhoAnswered.OWNER).length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'bg-indigo-600',
    },
    {
      label: 'WhatsApps Sent',
      value: filteredEntries.filter(e => e.whatsAppSent === WhatsAppSent.YES).length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      color: 'bg-emerald-600',
    },
    {
      label: 'Calls Booked',
      value: filteredEntries.filter(e => e.outcome === CallOutcome.BOOKED).length,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-rose-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-wider">Metrics Performance</h2>
          <p className="text-slate-500 text-sm italic font-medium">Tracking outreach effectiveness and conversions.</p>
        </div>
        
        <div className="flex bg-slate-200 p-1 rounded-md text-[10px] font-black uppercase tracking-widest">
          {(['daily', 'weekly', 'monthly', 'custom'] as MetricView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded transition-all ${
                view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'custom' && (
        <div className="flex items-center gap-3 bg-white p-3 border border-slate-200 rounded shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-slate-400 uppercase">Start Date</span>
            <input 
              type="date" 
              className="text-xs border rounded px-2 py-1 outline-none" 
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-slate-400 uppercase">End Date</span>
            <input 
              type="date" 
              className="text-xs border rounded px-2 py-1 outline-none" 
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-3 rounded border border-slate-200 shadow-sm text-center">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
            <div className="text-3xl font-black text-slate-900">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-lg p-6 text-white">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 text-center">
          {view.toUpperCase()} CONVERSION BREAKDOWN
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Object.values(CallOutcome).map(outcome => {
            const count = filteredEntries.filter(e => e.outcome === outcome).length;
            if (count === 0) return null;
            return (
              <div key={outcome} className="bg-slate-800 p-3 rounded flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-center leading-tight h-5 flex items-center">{outcome}</span>
                <span className="text-2xl font-black">{count}</span>
              </div>
            );
          })}
        </div>
        {filteredEntries.length === 0 && (
          <div className="text-center py-6 text-slate-500 text-xs font-bold uppercase tracking-widest">
            {view === 'custom' && (!customStart || !customEnd) 
              ? 'Select a date range to view metrics.' 
              : 'No call activity found in this period.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyMetrics;
