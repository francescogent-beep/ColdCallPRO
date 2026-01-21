
import React, { useState } from 'react';
import { 
  CallLogEntry, 
  WebsiteStatus, 
  MapsVisibility, 
  WhoAnswered, 
  CallOutcome, 
  InterestLevel, 
  WhatsAppSent,
  LeadStage,
  ActionHistoryEntry
} from '../types';
import { 
  WEBSITE_STATUS_OPTIONS, 
  MAPS_VISIBILITY_OPTIONS, 
  WHO_ANSWERED_OPTIONS, 
  OUTCOME_OPTIONS, 
  INTEREST_LEVEL_OPTIONS,
  PROFESSION_OPTIONS
} from '../constants';
import Dropdown from './Dropdown';
import { openWhatsApp } from '../services/whatsapp';

interface LogFormProps {
  initialData?: Partial<CallLogEntry>;
  onSubmit: (entry: CallLogEntry) => void;
  onCancel: () => void;
}

const LogForm: React.FC<LogFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const isPreLoading = !initialData?.id;
  const isCallLogging = initialData?.id !== undefined;

  const [formData, setFormData] = useState<Partial<CallLogEntry>>({
    id: initialData?.id || Math.random().toString(36).substr(2, 9),
    businessName: initialData?.businessName || '',
    contactName: initialData?.contactName || '',
    phone: initialData?.phone || '',
    profession: initialData?.profession || 'Fisioterapeuta',
    city: initialData?.city || '',
    websiteStatus: initialData?.websiteStatus || WebsiteStatus.NO,
    mapsVisibility: initialData?.mapsVisibility || MapsVisibility.NOT_VISIBLE,
    attemptNumber: initialData?.attemptNumber || 0,
    whoAnswered: initialData?.whoAnswered || WhoAnswered.NO_ANSWER,
    outcome: initialData?.outcome || CallOutcome.NO_ANSWER,
    interestLevel: initialData?.interestLevel || InterestLevel.COLD,
    nextAction: initialData?.nextAction || '',
    followUpDate: initialData?.followUpDate || '',
    followUpTime: initialData?.followUpTime || '',
    reminderNote: initialData?.reminderNote || '',
    whatsAppSent: initialData?.whatsAppSent || WhatsAppSent.NO,
    notes: initialData?.notes || '',
    createdAt: initialData?.createdAt || new Date().toISOString(),
    lastCallDate: initialData?.lastCallDate || null,
    leadStage: initialData?.leadStage || LeadStage.NEW,
    actionHistory: initialData?.actionHistory || [],
  });

  const handleChange = (field: keyof CallLogEntry, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getOutcomeColor = (opt: CallOutcome) => {
    if (opt === CallOutcome.BOOKED) return 'bg-rose-600 text-white border-rose-600';
    if (opt === CallOutcome.INTERESTED) return 'bg-indigo-600 text-white border-indigo-600';
    if (opt === CallOutcome.CALL_LATER) return 'bg-amber-500 text-white border-amber-500';
    return formData.outcome === opt ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-100';
  };

  const handleSave = (isNewCall: boolean) => {
    if (!formData.businessName) return;

    const currentAttempt = formData.attemptNumber || 0;
    const newAttempt = isNewCall ? currentAttempt + 1 : currentAttempt;
    
    let updatedHistory = [...(formData.actionHistory || [])];
    if (isNewCall) {
      const historyEntry: ActionHistoryEntry = {
        date: new Date().toISOString(),
        outcome: formData.outcome as CallOutcome,
        notes: formData.notes || '',
        attempt: newAttempt,
      };
      updatedHistory = [historyEntry, ...updatedHistory];
    }

    const updatedEntry: CallLogEntry = {
      ...(formData as CallLogEntry),
      attemptNumber: newAttempt,
      lastCallDate: isNewCall ? new Date().toISOString() : formData.lastCallDate || null,
      leadStage: isNewCall ? LeadStage.IN_PROGRESS : formData.leadStage || LeadStage.NEW,
      actionHistory: updatedHistory,
    };

    onSubmit(updatedEntry);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center">
      <div className="w-full max-w-2xl bg-white md:rounded-2xl shadow-2xl h-[90vh] md:h-auto overflow-hidden flex flex-col">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
          <div>
            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">
              {isPreLoading ? 'New Lead' : `Current Tries: ${formData.attemptNumber}`}
            </div>
            <h3 className="font-black uppercase text-sm truncate max-w-[200px]">{formData.businessName || 'Log Activity'}</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white p-2">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Identity Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">Business Name</label>
              <input type="text" value={formData.businessName} onChange={(e) => handleChange('businessName', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-black" />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">Phone</label>
              <input type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-black text-blue-600" />
            </div>
            <Dropdown label="Profession" value={formData.profession!} options={PROFESSION_OPTIONS} onChange={(v) => handleChange('profession', v)} />
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">City</label>
              <input type="text" value={formData.city} onChange={(e) => handleChange('city', e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold" />
            </div>
            <Dropdown label="Website" value={formData.websiteStatus!} options={WEBSITE_STATUS_OPTIONS} onChange={(v) => handleChange('websiteStatus', v)} />
            <Dropdown label="SEO/Maps" value={formData.mapsVisibility!} options={MAPS_VISIBILITY_OPTIONS} onChange={(v) => handleChange('mapsVisibility', v)} />
          </div>

          {/* Activity Section - Always visible but context changes if it's a new call */}
          <div className="space-y-4 pt-4 border-t border-slate-50">
            <div className="grid grid-cols-2 gap-3">
              <Dropdown label="Who Answered?" value={formData.whoAnswered!} options={WHO_ANSWERED_OPTIONS} onChange={(v) => handleChange('whoAnswered', v)} />
              <Dropdown label="Interest Vibe" value={formData.interestLevel!} options={INTEREST_LEVEL_OPTIONS} onChange={(v) => handleChange('interestLevel', v)} />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase">Select Last/Next Outcome</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                {OUTCOME_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange('outcome', opt)}
                    className={`px-1 py-2.5 rounded-lg text-[10px] font-black uppercase border-2 transition-all ${
                      formData.outcome === opt ? getOutcomeColor(opt as CallOutcome) : 'bg-white text-slate-400 border-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Follow-up / Planning */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-50">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">Contact Person</label>
              <input type="text" value={formData.contactName} onChange={(e) => handleChange('contactName', e.target.value)} className="w-full px-3 py-2 border border-slate-100 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">Next Follow Up</label>
              <input type="date" value={formData.followUpDate} onChange={(e) => handleChange('followUpDate', e.target.value)} className="w-full px-3 py-2 border border-slate-100 rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase">Time</label>
              <input type="time" value={formData.followUpTime} onChange={(e) => handleChange('followUpTime', e.target.value)} className="w-full px-3 py-2 border border-slate-100 rounded-lg text-sm" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Internal Notes</label>
            <textarea placeholder="Write notes here..." rows={2} value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white transition-all resize-none" />
          </div>
        </div>

        {/* Dynamic Footer with Multi-Save Logic */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-col md:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <button onClick={onCancel} className="px-6 py-4 md:py-2 text-[10px] font-black uppercase text-slate-400">Cancel</button>
            <button onClick={() => openWhatsApp(formData)} className="flex-1 py-4 md:py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
          </div>
          <div className="flex gap-2 flex-[2]">
            {!isPreLoading && (
              <button 
                onClick={() => handleSave(false)} 
                className="flex-1 py-4 md:py-2 bg-slate-100 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200"
              >
                Save Info Only
              </button>
            )}
            <button 
              onClick={() => handleSave(isCallLogging)} 
              className="flex-1 py-4 md:py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200"
            >
              {isPreLoading ? 'Create Lead' : 'Save & Log Call'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogForm;
