
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
      if (lines.length < 2) return;
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

      const importedLeads: CallLogEntry[] = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
          const values = line.match(regex)?.map(v => v.trim().replace(/^"|"$/g, '')) || line.split(',').map(v => v.trim());
          
          const entry: any = {};
          headers.forEach((header, index) => {
            const val = values[index];
            if (header.includes('business')) entry.businessName = val;
            if (header.includes('contact')) entry.contactName = val;
            if (header.includes('phone')) entry.phone = val;
            if (header.includes('website')) entry.websiteStatus = val as WebsiteStatus;
            if (header.includes('maps')) entry.mapsVisibility = val as MapsVisibility;
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
    <div className="w-full">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full text-left px-2 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded flex items-center gap-2"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
        Import CSV
      </button>
    </div>
  );
};

export default CSVImporter;
