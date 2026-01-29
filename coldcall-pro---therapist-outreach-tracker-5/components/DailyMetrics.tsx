
import React, { useState, useMemo } from 'react';
import { CallLogEntry, WhoAnswered, WhatsAppSent, CallOutcome } from '../types';
import { OUTCOME_OPTIONS } from '../constants';

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

  const calc = useMemo(() => {
    const total = filteredEntries.length;
    const answered = filteredEntries.filter(e => e.whoAnswered !== WhoAnswered.NO_ANSWER).length;
    const dms = filteredEntries.filter(e => e.whoAnswered === WhoAnswered.OWNER).length;
    const booked = filteredEntries.filter(e => e.outcome === CallOutcome.BOOKED).length;
    const wapp = filteredEntries.filter(e => e.whatsAppSent === WhatsAppSent.YES).length;

    const outcomeCounts = filteredEntries.reduce((acc, e) => {
      acc[e.outcome] = (acc[e.outcome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Hourly connection analysis
    const hourlyStats = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      total: 0,
      connected: 0
    }));

    filteredEntries.forEach(e => {
      if (e.lastCallDate) {
        const hour = new Date(e.lastCallDate).getHours();
        hourlyStats[hour].total++;
        if (e.whoAnswered !== WhoAnswered.NO_ANSWER) {
          hourlyStats[hour].connected++;
        }
      }
    });

    const activeHours = hourlyStats.filter(h => h.total > 0).sort((a, b) => a.hour - b.hour);
    const peakHour = activeHours.length > 0 
      ? [...activeHours].sort((a, b) => (b.connected/b.total) - (a.connected/a.total))[0]
      : null;

    return {
      total,
      answered,
      dms,
      booked,
      wapp,
      outcomeCounts,
      hourlyStats: activeHours,
      peakHour,
      connectionRate: total > 0 ? Math.round((answered / total) * 100) : 0,
      dmReachRate: answered > 0 ? Math.round((dms / answered) * 100) : 0,
      bookingRate: total > 0 ? Math.round((booked / total) * 100) : 0,
      wappEfficiency: answered > 0 ? Math.round((wapp / answered) * 100) : 0
    };
  }, [filteredEntries]);

  const stats = [
    { label: 'Volume', value: calc.total, sub: 'Total Calls', color: 'bg-slate-900' },
    { label: 'Connect %', value: `${calc.connectionRate}% (${calc.answered})`, sub: 'Picked Up', color: 'bg-indigo-600' },
    { label: 'DM %', value: `${calc.dmReachRate}% (${calc.dms})`, sub: 'Reached Owner', color: 'bg-indigo-500' },
    { label: 'Booking %', value: `${calc.bookingRate}% (${calc.booked})`, sub: 'Success Rate', color: 'bg-rose-600' },
    { label: 'WhatsApp', value: calc.wapp, sub: 'Sent Messages', color: 'bg-emerald-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 pb-6 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Performance Hub</h2>
          <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mt-1">Conversion & Efficiency analytics</p>
        </div>
        
        <div className="flex bg-slate-200/50 p-1 rounded-xl text-[10px] font-black uppercase">
          {(['daily', 'weekly', 'monthly', 'custom'] as MetricView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                view === v ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1 h-full ${stat.color}`}></div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</div>
            <div className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
            <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Visual Conversion Funnel */}
      <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-8 border-b border-slate-800 pb-4">
          Detailed Conversion Funnel
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Connect Rate</div>
            <div className="text-2xl font-black">{calc.connectionRate}%</div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${calc.connectionRate}%` }}></div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DM Reach Rate</div>
            <div className="text-2xl font-black">{calc.dmReachRate}%</div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-400" style={{ width: `${calc.dmReachRate}%` }}></div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Closure Rate</div>
            <div className="text-2xl font-black">{calc.bookingRate}%</div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500" style={{ width: `${calc.bookingRate}%` }}></div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">WhatsApp Efficiency</div>
            <div className="text-2xl font-black">{calc.wappEfficiency}%</div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${calc.wappEfficiency}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Outcome Report Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Outcome Distribution Report</h3>
          <div className="space-y-4">
            {OUTCOME_OPTIONS.map((outcome) => {
              const count = calc.outcomeCounts[outcome] || 0;
              const percentage = calc.total > 0 ? Math.round((count / calc.total) * 100) : 0;
              
              return (
                <div key={outcome} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[11px] font-bold text-slate-700 uppercase">{outcome}</span>
                      <span className="text-[11px] font-black text-slate-900">{percentage}% ({count})</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          outcome === CallOutcome.BOOKED ? 'bg-rose-500' :
                          outcome === CallOutcome.INTERESTED ? 'bg-indigo-500' :
                          outcome === CallOutcome.NO_ANSWER ? 'bg-slate-300' : 'bg-slate-900'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call Window Analysis Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Optimal Call Windows</h3>
            {calc.peakHour && (
              <div className="bg-indigo-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded">
                Peak Hour: {calc.peakHour.hour}:00
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {calc.hourlyStats.length > 0 ? (
              calc.hourlyStats.map((stat) => {
                const rate = Math.round((stat.connected / stat.total) * 100);
                const isPeak = calc.peakHour?.hour === stat.hour;
                
                return (
                  <div key={stat.hour} className="flex items-center gap-4">
                    <div className="w-12 text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{stat.hour}:00</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-1">
                        <span className={`text-[10px] font-bold uppercase ${isPeak ? 'text-indigo-600' : 'text-slate-500'}`}>
                          {rate}% Connect Rate
                        </span>
                        <span className="text-[10px] font-black text-slate-400">{stat.total} calls</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isPeak ? 'bg-indigo-600' : 'bg-slate-400'}`}
                          style={{ width: `${rate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-xl">
                <p className="text-[10px] font-black text-slate-300 uppercase">No history for this period</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-4 border-t border-slate-50">
            <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">
              * Connect rate is calculated based on history within the selected timeframe. Higher percentages indicate more effective calling blocks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyMetrics;
