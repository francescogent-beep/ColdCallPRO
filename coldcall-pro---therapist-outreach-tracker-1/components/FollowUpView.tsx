
import React, { useState } from 'react';
import { CallLogEntry, LeadStage } from '../types';
import LogForm from './LogForm';

interface FollowUpViewProps {
  entries: CallLogEntry[];
  onUpdate: (entry: CallLogEntry) => void;
}

const FollowUpView: React.FC<FollowUpViewProps> = ({ entries, onUpdate }) => {
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  
  // Requirement: Leads must not appear in Follow-Up view until at least one call is logged
  // and they must have a follow-up date.
  const followUpLeads = entries.filter(e => 
    e.attemptNumber > 0 && 
    e.followUpDate && 
    e.leadStage !== LeadStage.CLOSED &&
    e.leadStage !== LeadStage.BOOKED
  ).sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-wider">Follow-Up Queue</h2>
          <p className="text-slate-500 text-sm italic font-medium">Scheduled touches for existing leads.</p>
        </div>
        <div className="bg-slate-900 px-3 py-1 rounded text-white flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Due Now</span>
          <span className="font-black text-lg">
            {followUpLeads.filter(l => l.followUpDate <= today).length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {followUpLeads.map((lead) => (
          <div 
            key={lead.id} 
            className={`bg-white rounded border-2 p-4 flex flex-col transition-all cursor-pointer group ${
              lead.followUpDate <= today ? 'border-indigo-600 shadow-md' : 'border-slate-200 hover:border-slate-400'
            }`} 
            onClick={() => setActiveCallId(lead.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-black text-slate-900 group-hover:text-indigo-600 leading-tight uppercase tracking-tight">{lead.businessName}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.contactName || 'No Contact'}</p>
              </div>
              <div className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                lead.followUpDate < today ? 'bg-rose-600 text-white' : 
                lead.followUpDate === today ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {lead.followUpDate < today ? 'Overdue' : lead.followUpDate === today ? 'Today' : lead.followUpDate}
              </div>
            </div>

            <div className="space-y-2 flex-1 mt-2">
              <div className="flex items-center gap-2 text-sm font-black mono text-indigo-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 005.47 5.47l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                {lead.phone}
              </div>

              <div className="bg-slate-50 p-2 rounded text-[10px] border border-slate-100">
                <span className="font-black text-slate-400 uppercase block mb-0.5">Last Outcome</span>
                <span className="font-bold text-slate-700">{lead.outcome}</span>
              </div>

              <div className="bg-amber-50 p-2 rounded text-[10px] border border-amber-100">
                <span className="font-black text-amber-500 uppercase block mb-0.5">Next Step</span>
                <span className="font-bold text-amber-800">{lead.nextAction || 'Regular Follow-up'}</span>
              </div>
            </div>

            <button className="mt-4 w-full py-1.5 bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors">
              Log Follow-up Call
            </button>
          </div>
        ))}

        {followUpLeads.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No follow-ups scheduled</h3>
            <p className="text-slate-300 text-xs mt-1">Start making calls in the Master Log to populate this view.</p>
          </div>
        )}
      </div>

      {activeCallId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4 overflow-y-auto">
          <div className="w-full max-w-2xl my-auto">
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
