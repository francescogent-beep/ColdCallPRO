
import React, { useState } from 'react';
import { 
  CallLogEntry, 
  WebsiteStatus, 
  MapsVisibility, 
  WhoAnswered, 
  CallOutcome, 
  InterestLevel, 
  WhatsAppSent,
  LeadStage
} from '../types';
import { 
  WEBSITE_STATUS_OPTIONS, 
  MAPS_VISIBILITY_OPTIONS, 
  WHO_ANSWERED_OPTIONS, 
  OUTCOME_OPTIONS, 
  INTEREST_LEVEL_OPTIONS 
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
    websiteStatus: initialData?.websiteStatus || WebsiteStatus.NO,
    mapsVisibility: initialData?.mapsVisibility || MapsVisibility.NOT_VISIBLE,
    attemptNumber: initialData?.attemptNumber || 0,
    whoAnswered: initialData?.whoAnswered || WhoAnswered.NO_ANSWER,
    outcome: initialData?.outcome || CallOutcome.NO_ANSWER,
    interestLevel: initialData?.interestLevel || InterestLevel.COLD,
    nextAction: initialData?.nextAction || '',
    followUpDate: initialData?.followUpDate || '',
    followUpTime: initialData?.followUpTime || '',
    whatsAppSent: initialData?.whatsAppSent || WhatsAppSent.NO,
    notes: initialData?.notes || '',
    createdAt: initialData?.createdAt || new Date().toISOString(),
    lastCallDate: initialData?.lastCallDate || null,
    leadStage: initialData?.leadStage || LeadStage.NEW,
  });

  const handleChange = (field: keyof CallLogEntry, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateAutoStage = (outcome: CallOutcome): LeadStage => {
    if (outcome === CallOutcome.BOOKED) return LeadStage.BOOKED;
    if (outcome === CallOutcome.NOT_INTERESTED_HARD) return LeadStage.CLOSED;
    return LeadStage.IN_PROGRESS;
  };

  const handleWhatsAppAction = () => {
    openWhatsApp(formData);
    handleChange('whatsAppSent', WhatsAppSent.YES);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName) return alert('Business Name is required');

    const updatedEntry: CallLogEntry = {
      ...(formData as CallLogEntry),
    };

    if (isCallLogging) {
      updatedEntry.attemptNumber += 1;
      updatedEntry.lastCallDate = new Date().toISOString();
      updatedEntry.leadStage = calculateAutoStage(updatedEntry.outcome);
    }

    onSubmit(updatedEntry);
  };

  return (
    <div className="bg-white rounded-none md:rounded shadow-2xl border-none md:border md:border-slate-300 overflow-hidden h-full md:max-h-[95vh] flex flex-col w-full">
      <div className="bg-slate-900 text-white px-4 py-4 md:py-3 flex justify-between items-center shrink-0">
        <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
          {isPreLoading ? 'Pre-Load Lead' : (
            <>
              <span className="bg-indigo-500 px-1.5 py-0.5 rounded text-[10px]">DIALING</span>
              <span className="truncate max-w-[150px]">{formData.businessName}</span>
            </>
          )}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors p-2">
          <svg className="w-6 h-6 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-6 md:space-y-4 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Business Name</label>
            <input type="text" required value={formData.businessName} onChange={(e) => handleChange('businessName', e.target.value)} className="w-full px-3 py-3 md:py-1.5 text-base md:text-sm border border-slate-200 rounded focus:ring-1 focus:ring-slate-400 outline-none font-bold" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Phone</label>
            <div className="flex gap-2">
              <input type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className="flex-1 px-3 py-3 md:py-1.5 text-base md:text-sm border border-slate-200 rounded focus:ring-1 focus:ring-slate-400 outline-none mono font-bold text-blue-600" />
              {formData.phone && (
                <a href={`tel:${formData.phone}`} className="p-3 md:p-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-100">
          <Dropdown label="Web Status" value={formData.websiteStatus!} options={WEBSITE_STATUS_OPTIONS} onChange={(v) => handleChange('websiteStatus', v)} />
          <Dropdown label="G-Maps" value={formData.mapsVisibility!} options={MAPS_VISIBILITY_OPTIONS} onChange={(v) => handleChange('mapsVisibility', v)} />
        </div>

        {isCallLogging && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <Dropdown label="Who Answered?" value={formData.whoAnswered!} options={WHO_ANSWERED_OPTIONS} onChange={(v) => handleChange('whoAnswered', v)} />
              <Dropdown label="Interest" value={formData.interestLevel!} options={INTEREST_LEVEL_OPTIONS} onChange={(v) => handleChange('interestLevel', v)} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Call Outcome</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {OUTCOME_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange('outcome', opt)}
                    className={`px-2 py-3 rounded text-[9px] font-black uppercase border transition-all ${
                      formData.outcome === opt ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3 pt-2 border-t border-slate-100">
          <div className="md:col-span-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Contact Name</label>
            <input type="text" value={formData.contactName} onChange={(e) => handleChange('contactName', e.target.value)} className="w-full px-3 py-3 md:py-1.5 text-base md:text-sm border border-slate-200 rounded focus:ring-1 focus:ring-slate-400 outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Follow-up Date</label>
            <input type="date" value={formData.followUpDate} onChange={(e) => handleChange('followUpDate', e.target.value)} className="w-full px-3 py-3 md:py-1.5 text-base md:text-sm border border-slate-200 rounded focus:ring-1 focus:ring-slate-400 outline-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Time</label>
            <input type="time" value={formData.followUpTime} onChange={(e) => handleChange('followUpTime', e.target.value)} className="w-full px-3 py-3 md:py-1.5 text-base md:text-sm border border-slate-200 rounded focus:ring-1 focus:ring-slate-400 outline-none" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Notes</label>
          <textarea rows={2} value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} className="w-full px-3 py-3 md:py-1.5 text-base md:text-sm border border-slate-200 rounded focus:ring-1 focus:ring-slate-400 outline-none resize-none bg-slate-50" />
        </div>
      </form>

      <div className="flex flex-col md:flex-row gap-2 p-4 bg-slate-50 border-t border-slate-200 shrink-0">
        <div className="flex gap-2 flex-1">
          <button type="button" onClick={onCancel} className="px-4 py-4 md:py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest">Cancel</button>
          <button 
            type="button" 
            onClick={handleWhatsAppAction}
            className="flex-1 py-4 md:py-2 text-[10px] font-black bg-emerald-600 text-white rounded uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-md transition-all active:scale-95"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Send Message
          </button>
        </div>
        <button
          type="submit"
          className="px-10 py-4 md:py-2 text-[10px] font-black bg-slate-900 text-white rounded hover:bg-black transition-all shadow-lg active:scale-95 uppercase tracking-[0.2em]"
        >
          {isPreLoading ? 'Create Prospect' : 'Save & Log Call'}
        </button>
      </div>
    </div>
  );
};

export default LogForm;
