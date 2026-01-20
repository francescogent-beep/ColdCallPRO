
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
  INTEREST_LEVEL_OPTIONS, 
  WHATSAPP_OPTIONS 
} from '../constants';
import Dropdown from './Dropdown';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName) return alert('Business Name is required');

    const updatedEntry: CallLogEntry = {
      ...(formData as CallLogEntry),
    };

    // If we are logging a call (not just pre-loading info)
    if (isCallLogging) {
      updatedEntry.attemptNumber += 1;
      updatedEntry.lastCallDate = new Date().toISOString();
      updatedEntry.leadStage = calculateAutoStage(updatedEntry.outcome);
      
      // Outcome Logic Rules
      if (updatedEntry.outcome === CallOutcome.NOT_INTERESTED_HARD) {
        updatedEntry.followUpDate = ''; // Lead closed, no follow up
        updatedEntry.nextAction = 'Closed - Not Interested';
      }
    }

    onSubmit(updatedEntry);
  };

  return (
    <div className="bg-white rounded shadow-2xl border border-slate-300 overflow-hidden max-h-[95vh] flex flex-col">
      <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center shrink-0">
        <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
          {isPreLoading ? 'Pre-Load Lead' : (
            <>
              <span className="bg-indigo-500 px-1.5 py-0.5 rounded text-[10px]">IN-CALL</span>
              {formData.businessName}
            </>
          )}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors p-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4">
        {/* Core Info - Only editable if Pre-loading or specifically changing business details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Business Name</label>
            <input
              type="text"
              required
              value={formData.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-slate-400 outline-none font-bold"
              placeholder="Clinic Name"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-slate-400 outline-none mono font-bold text-blue-600"
              placeholder="Phone number"
            />
          </div>
        </div>

        {/* Audit Data - Useful to see while on call */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-100">
          <Dropdown
            label="Web Status"
            value={formData.websiteStatus!}
            options={WEBSITE_STATUS_OPTIONS}
            onChange={(v) => handleChange('websiteStatus', v)}
          />
          <Dropdown
            label="G-Maps"
            value={formData.mapsVisibility!}
            options={MAPS_VISIBILITY_OPTIONS}
            onChange={(v) => handleChange('mapsVisibility', v)}
          />
        </div>

        {/* In-Call Data: THE SPEED SECTION */}
        {isCallLogging && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <Dropdown
                label="Who Answered?"
                value={formData.whoAnswered!}
                options={WHO_ANSWERED_OPTIONS}
                onChange={(v) => handleChange('whoAnswered', v)}
              />
              <Dropdown
                label="Interest Level"
                value={formData.interestLevel!}
                options={INTEREST_LEVEL_OPTIONS}
                onChange={(v) => handleChange('interestLevel', v)}
              />
            </div>
            <div className="grid grid-cols-1 gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Call Outcome</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {OUTCOME_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange('outcome', opt)}
                    className={`px-2 py-2 rounded text-[10px] font-black uppercase border transition-all text-center leading-tight ${
                      formData.outcome === opt 
                        ? 'bg-slate-900 text-white border-slate-900' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Follow-up Date</label>
            <input
              type="date"
              value={formData.followUpDate}
              onChange={(e) => handleChange('followUpDate', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-slate-400 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">WhatsApp Sent?</label>
            <div className="flex gap-1 h-[34px]">
              {WHATSAPP_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleChange('whatsAppSent', opt)}
                  className={`flex-1 text-[10px] font-black uppercase rounded border transition-all ${
                    formData.whatsAppSent === opt
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-400 border-slate-200'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Next Action</label>
            <input
              type="text"
              value={formData.nextAction}
              onChange={(e) => handleChange('nextAction', e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-slate-400 outline-none"
              placeholder="e.g. Call back Tuesday"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Notes</label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded focus:ring-1 focus:ring-slate-400 outline-none resize-none bg-slate-50 focus:bg-white"
            placeholder="Quick summary..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-2 text-xs font-black bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-all shadow-md active:scale-95 uppercase tracking-widest"
          >
            {isPreLoading ? 'Add Prospect' : 'Log Call & Close'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LogForm;
