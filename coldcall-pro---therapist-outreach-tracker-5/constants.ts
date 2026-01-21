
import { 
  WebsiteStatus, 
  MapsVisibility, 
  WhoAnswered, 
  CallOutcome, 
  InterestLevel, 
  WhatsAppSent,
  LeadStage
} from './types';

export const WEBSITE_STATUS_OPTIONS = Object.values(WebsiteStatus);
export const MAPS_VISIBILITY_OPTIONS = Object.values(MapsVisibility);
export const WHO_ANSWERED_OPTIONS = Object.values(WhoAnswered);
export const OUTCOME_OPTIONS = Object.values(CallOutcome);
export const INTEREST_LEVEL_OPTIONS = Object.values(InterestLevel);
export const WHATSAPP_OPTIONS = Object.values(WhatsAppSent);
export const LEAD_STAGE_OPTIONS = Object.values(LeadStage);

export const PROFESSION_OPTIONS = [
  'Fisioterapeuta',
  'Dentista',
  'Psicólogo',
  'Veterinario',
  'Osteopatía',
  'Clínica Médica',
  'Centro Estética',
  'Entrenador Personal',
  'Podología',
  'Electricista',
  'Mecánico',
  'Fontanero',
  'Reformas',
  'Mudanzas',
  'Pintura',
  'Carpintería',
  'Otros'
];

export const DEFAULT_ENTRY: Partial<any> = {
  websiteStatus: WebsiteStatus.NO,
  mapsVisibility: MapsVisibility.NOT_VISIBLE,
  attemptNumber: 0,
  whoAnswered: WhoAnswered.NO_ANSWER,
  outcome: CallOutcome.NO_ANSWER,
  interestLevel: InterestLevel.COLD,
  whatsAppSent: WhatsAppSent.NO,
  leadStage: LeadStage.NEW,
  lastCallDate: null,
  profession: 'Fisioterapeuta',
  city: ''
};
