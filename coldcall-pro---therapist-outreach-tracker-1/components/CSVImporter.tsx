
import React, { useRef } from 'react';
import { CallLogEntry, WebsiteStatus, MapsVisibility, LeadStage, InterestLevel, WhatsAppSent, CallOutcome, WhoAnswered } from '../types';

interface CSVImporterProps {
  onImport: (entries: CallLogEntry[]) => void;
}

const CSVImporter: React.FC<CSVImporterProps> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const importedLeads: CallLogEntry[] = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          const entry: any = {};
          headers.forEach((header, index) => {
            if (header === 'business_name') entry.businessName = values[index];
            if (header === 'contact_name') entry.contactName = values[index];
            if (header === 'phone') entry.phone = values[index];
            if (header === 'website_status') entry.websiteStatus = values[index] as WebsiteStatus;
            if (header === 'google_maps_visibility') entry.mapsVisibility = values[index] as MapsVisibility;
          });

          return {
            id: Math.random().toString(36).substr(2, 9),
            businessName: entry.businessName || 'Unknown Business',
            contactName: entry.contactName || '',
            phone: entry.phone || '',
            websiteStatus: entry.websiteStatus || WebsiteStatus.NO,
            mapsVisibility: entry.mapsVisibility || MapsVisibility.NOT_VISIBLE,
            attemptNumber: 0,
            whoAnswered: WhoAnswered.NO_ANSWER,
            outcome: CallOutcome.NO_ANSWER,
            interestLevel: InterestLevel.COLD,
            nextAction: '',
            followUpDate: '',
            whatsAppSent: WhatsAppSent.NO,
            notes: '',
            createdAt: new Date().toISOString(),
            lastCallDate: null,
            leadStage: LeadStage.NEW
          } as CallLogEntry;
        });

      onImport(importedLeads);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        CSV Import
      </button>
    </div>
  );
};

export default CSVImporter;
