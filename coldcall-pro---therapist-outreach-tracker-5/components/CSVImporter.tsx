
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

          const businessName = rowData.business_name || rowData.business || rowData['business name'] || 'Unknown Business';
          const contactName = rowData.contact_name || rowData.contact || '';
          const phone = rowData.phone || '';
          const profession = rowData.profession || 'Fisioterapeuta';
          const city = rowData.city || '';
          
          const websiteStatus = mapToEnum(rowData.website_status, WebsiteStatus, WebsiteStatus.NO);
          const mapsVisibility = mapToEnum(rowData.google_maps_visibility || rowData.maps_visibility, MapsVisibility, MapsVisibility.NOT_VISIBLE);
          const outcome = mapToEnum(rowData.outcome || rowData.last_outcome, CallOutcome, CallOutcome.NO_ANSWER);
          const interestLevel = mapToEnum(rowData.interest_level, InterestLevel, InterestLevel.COLD);
          const whatsAppSent = mapToEnum(rowData.whatsapp_sent, WhatsAppSent, WhatsAppSent.NO);
          const whoAnswered = mapToEnum(rowData.who_answered, WhoAnswered, WhoAnswered.NO_ANSWER);

          let leadStage = LeadStage.NEW;
          const csvStage = (rowData.lead_stage || '').toUpperCase();
          if (csvStage === 'CONTACTED' || csvStage === 'IN_PROGRESS') leadStage = LeadStage.IN_PROGRESS;
          else if (csvStage === 'CLOSED') leadStage = LeadStage.CLOSED;
          else if (csvStage === 'BOOKED') leadStage = LeadStage.BOOKED;

          const attemptNumber = parseInt(rowData.call_attempts || rowData.attempts || rowData.attempt_number || '0', 10);
          const lastCallDate = rowData.last_call_date || (attemptNumber > 0 ? new Date().toISOString() : null);
          const followUpDate = rowData.follow_up_date || '';
          const followUpTime = rowData.follow_up_time || '';
          const reminderNote = rowData.reminder_note || '';
          
          return {
            id: Math.random().toString(36).substr(2, 9),
            businessName,
            contactName,
            phone,
            profession,
            city,
            websiteStatus,
            mapsVisibility,
            attemptNumber,
            whoAnswered,
            outcome,
            interestLevel,
            nextAction: rowData.next_action || '',
            followUpDate,
            followUpTime,
            reminderNote,
            whatsAppSent,
            notes: rowData.notes || '',
            createdAt: rowData.created_at || new Date().toISOString(),
            lastCallDate,
            leadStage,
            actionHistory: []
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
        className="w-full p-2 border border-slate-200 rounded-lg hover:bg-slate-50 flex flex-col items-center justify-center h-full"
      >
        <span className="text-[9px] font-black uppercase text-slate-600">Import CSV</span>
      </button>
    </div>
  );
};

export default CSVImporter;
