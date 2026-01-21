
import React, { useRef } from 'react';
import { 
  CallLogEntry, 
  WebsiteStatus, 
  MapsVisibility, 
  LeadStage, 
  InterestLevel, 
  WhatsAppSent, 
  CallOutcome, 
  WhoAnswered 
} from '../types';

interface CSVImporterProps {
  onImport: (entries: CallLogEntry[]) => void;
}

const CSVImporter: React.FC<CSVImporterProps> = ({ onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to map CSV string values to internal Enums
  const mapToEnum = (val: string, enumObj: any, defaultVal: any) => {
    if (!val) return defaultVal;
    const cleanVal = val.trim().toLowerCase().replace(/_/g, ' ');
    const entries = Object.entries(enumObj);
    const match = entries.find(([_, enumVal]) => (enumVal as string).toLowerCase() === cleanVal);
    return match ? match[1] : defaultVal;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      if (lines.length < 2) return;
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));

      const importedLeads: CallLogEntry[] = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          // Robust CSV line split handling quotes
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());

          const rowData: any = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });

          // Map CSV headers to internal keys
          const businessName = rowData.business_name || rowData.business || 'Unknown Business';
          const contactName = rowData.contact_name || rowData.contact || '';
          const phone = rowData.phone || '';
          
          // Map Enums
          const websiteStatus = mapToEnum(rowData.website_status, WebsiteStatus, WebsiteStatus.NO);
          const mapsVisibility = mapToEnum(rowData.google_maps_visibility, MapsVisibility, MapsVisibility.NOT_VISIBLE);
          const outcome = mapToEnum(rowData.outcome, CallOutcome, CallOutcome.NO_ANSWER);
          const interestLevel = mapToEnum(rowData.interest_level, InterestLevel, InterestLevel.COLD);
          const whatsAppSent = mapToEnum(rowData.whatsapp_sent, WhatsAppSent, WhatsAppSent.NO);

          // Lead Stage Mapping
          let leadStage = LeadStage.NEW;
          const csvStage = (rowData.lead_stage || '').toUpperCase();
          if (csvStage === 'CONTACTED') leadStage = LeadStage.IN_PROGRESS;
          else if (csvStage === 'CLOSED') leadStage = LeadStage.CLOSED;
          else if (csvStage === 'BOOKED') leadStage = LeadStage.BOOKED;

          const attemptNumber = parseInt(rowData.call_attempts || '0', 10);
          
          return {
            id: Math.random().toString(36).substr(2, 9),
            businessName,
            contactName,
            phone,
            websiteStatus,
            mapsVisibility,
            attemptNumber,
            whoAnswered: attemptNumber > 0 ? WhoAnswered.NO_ANSWER : WhoAnswered.NO_ANSWER, // Default since CSV doesn't specify who
            outcome,
            interestLevel,
            nextAction: rowData.next_action || '',
            followUpDate: rowData.follow_up_date || '',
            whatsAppSent,
            notes: rowData.notes || '',
            createdAt: new Date().toISOString(),
            lastCallDate: attemptNumber > 0 ? new Date().toISOString() : null,
            leadStage
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
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Import CSV
      </button>
    </div>
  );
};

export default CSVImporter;
