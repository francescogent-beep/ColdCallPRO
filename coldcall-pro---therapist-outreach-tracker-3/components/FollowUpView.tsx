
import React, { useState } from 'react';
import { CallLogEntry, LeadStage, CallOutcome } from '../types';
import LogForm from './LogForm';

interface FollowUpViewProps {
  entries: CallLogEntry[];
  onUpdate: (entry: CallLogEntry) => void;
}

const FollowUpView: React.FC<FollowUpViewProps> = ({ entries, onUpdate }) => {
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const today = new Date().toISOString().split('T')[0];
  
  // Base filtering for follow-ups
  const allFollowUps = entries.filter(e => 
    e.attemptNumber > 0 && 
    e.outcome !== CallOutcome.NO_ANSWER &&
    e.followUpDate && 
    e.leadStage === LeadStage.IN_PROGRESS
  ).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));

  // Split into Due (Today or earlier) and Upcoming
  const dueLeads = allFollowUps.filter(e => e.followUpDate <= today);
  const upcomingLeads = allFollowUps.filter(e => e.followUpDate > today);

  const renderLeadCard = (lead: CallLogEntry) => (
    <div 
      key={lead.id} 
      className={`bg-white rounded-lg border-2 p-4 flex flex-col transition-all cursor-pointer group hover:shadow-lg ${
        lead.followUpDate <= today ? 'border-indigo-600 ring-1 ring-indigo-100' : 'border-slate-100 hover:border-slate-300'
      }`} 
      onClick={() => setActiveCallId(lead.id)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-black text-slate-900 group-hover:text-indigo-600 leading-tight uppercase tracking-tight">{lead.businessName}</h3>
          <div className="flex items-center gap-1 mt-1">
            <span className={`px-1 rounded text-[8px] font-black uppercase ${lead.followUpDate <= today ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {lead.followUpDate <= today ? 'DUE NOW' : lead.followUpDate}
            </span>
          </div>
        </div>
        <div className="text-right">
           <div className="text-[9px] font-black text-slate-400 uppercase leading-none">Retry</div>
           <div className="text-sm font-black text-slate-900">#{lead.attemptNumber + 1}</div>
        </div>
      </div>

      <div className="bg-slate-50 p-2.5 rounded border border-slate-100 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[8px] font-black text-slate-400 uppercase">Last Result</span>
          <span className="text-[9px] font-black text-slate-700 uppercase">{lead.outcome}</span>
        </div>
        {lead.nextAction && (
          <div className="text-[10px] font-bold text-slate-600 italic">"{lead.nextAction}"</div>
        )}
      </div>

      <button className="mt-4 w-full py-2 bg-indigo-600 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700">
        OPEN CALL LOG
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Pipeline</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Conversation Queue</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-indigo-600 px-4 py-2 rounded text-white text-center">
            <div className="text-[9px] font-black uppercase tracking-widest opacity-60">Due</div>
            <div className="font-black text-xl leading-tight">{dueLeads.length}</div>
          </div>
          <div className="bg-slate-900 px-4 py-2 rounded text-white text-center">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Scheduled</div>
            <div className="font-black text-xl leading-tight">{upcomingLeads.length}</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: DUE NOW */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px bg-slate-200 flex-1"></div>
          <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] whitespace-nowrap">DUE TODAY / OVERDUE</h3>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dueLeads.map(renderLeadCard)}
          {dueLeads.length === 0 && (
            <div className="col-span-full py-10 text-center bg-white border border-dashed border-slate-200 rounded-lg">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nothing due for today</span>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: UPCOMING */}
      {upcomingLeads.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px bg-slate-200 flex-1"></div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">UPCOMING FOLLOW-UPS</h3>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingLeads.map(renderLeadCard)}
          </div>
        </section>
      )}

      {allFollowUps.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Queue is Empty</h3>
          <p className="text-slate-300 text-[10px] mt-2 font-bold uppercase tracking-widest">Only leads you've spoken with appear here.</p>
        </div>
      )}

      {activeCallId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-2xl">
            <LogForm
              initialData={entries.find(e => e.id === activeCallId)}
              onSubmit={(entry) => {
                onUpdate(entry);
                setActiveCallId(null);
              }}
              onCancel={() => setActiveCallId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpView;
