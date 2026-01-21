
import React from 'react';
import { CallLogEntry, LeadStage, CallOutcome } from '../types';

interface FollowUpViewProps {
  entries: CallLogEntry[];
  onEditRequest: (id: string) => void;
}

const FollowUpView: React.FC<FollowUpViewProps> = ({ entries, onEditRequest }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const allFollowUps = entries.filter(e => 
    e.attemptNumber > 0 && 
    e.outcome !== CallOutcome.NO_ANSWER &&
    e.followUpDate && 
    e.leadStage === LeadStage.IN_PROGRESS
  ).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));

  const priorityTasks = allFollowUps.filter(e => e.followUpDate <= today);
  const futureTasks = allFollowUps.filter(e => e.followUpDate > today);

  const renderLeadCard = (lead: CallLogEntry, isPriority: boolean) => {
    const isOverdue = lead.followUpDate < today;
    const isToday = lead.followUpDate === today;

    return (
      <div 
        key={lead.id} 
        className={`bg-white rounded-xl border-2 p-5 flex flex-col transition-all cursor-pointer group hover:shadow-xl active:scale-[0.98] ${
          isPriority 
            ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-sm' 
            : 'border-slate-100 hover:border-slate-300'
        }`} 
        onClick={() => onEditRequest(lead.id)}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-black text-slate-900 group-hover:text-indigo-600 leading-tight uppercase text-base tracking-tight">{lead.businessName}</h3>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                isOverdue ? 'bg-rose-600 text-white' : 
                isToday ? 'bg-indigo-600 text-white' : 
                'bg-slate-100 text-slate-500'
              }`}>
                {isOverdue ? 'OVERDUE' : isToday ? 'DUE TODAY' : lead.followUpDate}
              </span>
              {lead.followUpTime && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{lead.followUpTime}</span>
              )}
            </div>
          </div>
          <div className="text-right pl-2">
             <div className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Attempt</div>
             <div className={`text-lg font-black ${isPriority ? 'text-indigo-600' : 'text-slate-900'}`}>#{lead.attemptNumber + 1}</div>
          </div>
        </div>

        {lead.reminderNote && (
          <div className="mb-4 p-3.5 bg-amber-50 border-l-4 border-amber-400 rounded-r shadow-sm">
             <div className="text-[9px] font-black text-amber-600 uppercase tracking-[0.1em] mb-1.5">TASK INSTRUCTIONS</div>
             <p className="text-xs font-bold text-slate-800 leading-snug">"{lead.reminderNote}"</p>
          </div>
        )}

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 mt-auto">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Last Outcome</span>
            <span className="text-[10px] font-black text-slate-700 uppercase">{lead.outcome}</span>
          </div>
          <div className="h-px bg-slate-200/50"></div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Profession</span>
            <span className="text-[10px] font-black text-slate-600 uppercase">{lead.profession}</span>
          </div>
        </div>

        <button className={`mt-5 w-full py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors shadow-md ${
          isPriority ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-900 text-white hover:bg-slate-800'
        }`}>
          LAUNCH LOG FORM
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-12">
      {/* View Header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-6 bg-white p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Follow-Up Pipeline</h2>
          <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mt-1">Smart scheduling & task management</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-indigo-600 px-4 py-2 rounded-xl text-white text-center shadow-lg shadow-indigo-100">
            <div className="text-[9px] font-black uppercase opacity-70 leading-none mb-1">Active Tasks</div>
            <div className="font-black text-xl leading-none">{allFollowUps.length}</div>
          </div>
        </div>
      </div>

      {/* Section 1: TODAY & OVERDUE */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.4em] whitespace-nowrap bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
            DUE TODAY & OVERDUE
          </h3>
          <div className="h-0.5 bg-indigo-100 flex-1 rounded-full"></div>
          <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 uppercase">{priorityTasks.length}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {priorityTasks.map(l => renderLeadCard(l, true))}
          {priorityTasks.length === 0 && (
            <div className="col-span-full py-16 text-center bg-white border-2 border-dashed border-slate-200 rounded-2xl">
              <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">All caught up for today!</span>
            </div>
          )}
        </div>
      </section>

      {/* Section 2: FUTURE */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] whitespace-nowrap bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
            SCHEDULED FOR OTHER DAYS
          </h3>
          <div className="h-0.5 bg-slate-100 flex-1 rounded-full"></div>
          <span className="text-[10px] font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 uppercase">{futureTasks.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {futureTasks.map(l => renderLeadCard(l, false))}
          {futureTasks.length === 0 && (
            <div className="col-span-full py-12 text-center bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-2xl">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">No future follow-ups scheduled</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FollowUpView;
