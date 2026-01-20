
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
    <div className="bg-white rounded-none md:rounded shadow-2xl border-none md:border md:border-slate-300 overflow-hidden h-full md:max-h-[95vh] flex flex-col w-full">
      <div className="bg-slate-900 text-white px-4 py-4 md:py-3 flex justify-between items-center shrink-0">
        <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
          {isPreLoading ? 'Pre-Load Lead' : (
            <>
              <span className="bg-indigo-500 px-1.5 py-0.5 rounded text-[10px]">IN-CALL</span>
              <span className="truncate max-w-[150px]">{formData.businessName}</span>
            </>
          )}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors p-2">
          <svg className="w-6 h-6 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-6 md:space-y-4 flex-1">
        {/* Core Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Business Name</label>
            <input
              type="text"
              required
              value={formData.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
              className="w-full px-3 py-3 md:py-1.5 text-base md:text-sm border border-slate-200 rounded focus:ring-1 focus:ring-slate-400 outline-none font-bold"
              placeholder="Clinic Name"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-3 md:py-1.5 text-base md:text-sm border border-slate-200 rounded focus:ring-1 focus:ring-slate-400 outline-none mono font-bold text-blue-600"
              placeholder="Phone number"
            />
          </div>
        </div>

        {/* Audit Data */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-100">
          <Dropdown
            label="Web Status"
            value={formData.websiteStatus!}
            options={WEBSITE_STATUS_OPTIONS}
            onChange={(v) => handleChange('websiteStatus', v)}
            className="text-base md:text-sm"
          />
          <Dropdown
            label="G-Maps"
            value={formData.mapsVisibility!}
            options={MAPS_VISIBILITY_OPTIONS}
            onChange={(v) => handleChange('mapsVisibility', v)}
            className="text-base md:text-sm"
          />
        </div>

        {/* In-Call Section */}
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
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Call Outcome</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-1.5">
                {OUTCOME_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleChange('outcome', opt)}
                    className={`px-2 py-4 md:py-2 rounded text-[10px] md:text-[9px] font-black uppercase border transition-all text-center leading-tight flex items-center justify-center h-full ${
                      formData.outcome === opt 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
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

        {/* Date and Action */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Follow-up Date</label>
            <input
              type="date"
              value={formData.followUpDate}
              onChange={(e) => handleChange('followUpDate', e.target.value)}
              className="w-full px-3 py-3 md:py-1.5 text-base md:text-sm border border-slate-200 rounded focus:ring-1 focus:ring-slate-400 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">WhatsApp Sent?</label>
            <div className="flex gap-2 md:gap-1 h-[50px] md:h-[34px]">
              {WHATSAPP_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleChange('whatsAppSent', opt)}
                  className={`flex-1 text-[10px] font-black uppercase rounded border transition-all ${
                    formData.whatsAppSent === opt
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
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
              className="w-full px-3 py-3 md:py-1.5 text-base md:text-sm border border-slate-200 rounded focus:ring-1 focus:ring-slate-400 outline-none"
              placeholder="Next step..."
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Notes</label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-3 py-3 md:py-1.5 text-base md:text-sm border border-slate-200 rounded focus:ring-1 focus:ring-slate-400 outline-none resize-none bg-slate-50 focus:bg-white"
            placeholder="Key details..."
          />
        </div>

        {/* Spacer for mobile keyboard */}
        <div className="md:hidden h-20 shrink-0" />
      </form>

      <div className="flex flex-col md:flex-row justify-end gap-2 p-4 bg-slate-50 border-t border-slate-200 md:bg-transparent md:border-none shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="order-2 md:order-1 px-4 py-4 md:py-1.5 text-sm md:text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          className="order-1 md:order-2 px-8 py-4 md:py-2 text-sm md:text-xs font-black bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-all shadow-lg active:scale-95 uppercase tracking-widest"
        >
          {isPreLoading ? 'Add Prospect' : 'Log Call & Close'}
        </button>
      </div>
    </div>
  );
};

export default LogForm;
