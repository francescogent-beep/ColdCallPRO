
export enum WebsiteStatus {
  NO = 'No',
  WEAK = 'Weak',
  GOOD = 'Good',
  BROKEN = 'Broken'
}

export enum MapsVisibility {
  TOP_3 = 'Top 3',
  PAGE_1 = 'Page 1',
  PAGE_2 = 'Page 2',
  PAGE_3 = 'Page 3',
  NOT_VISIBLE = 'Not visible'
}

export enum WhoAnswered {
  OWNER = 'Owner',
  GATEKEEPER = 'Gatekeeper',
  NO_ANSWER = 'No answer'
}

export enum CallOutcome {
  NO_ANSWER = 'No answer',
  GATEKEEPER = 'Gatekeeper',
  INTERESTED = 'Interested',
  NOT_NOW = 'Not now',
  NOT_INTERESTED_HARD = 'Not interested hard',
  ALREADY_GOT_SOMEONE = 'Already got someone',
  FUTURE_POTENTIAL = 'Future potential',
  BOOKED = 'Booked'
}

export enum LeadStage {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
  BOOKED = 'BOOKED'
}

export enum InterestLevel {
  COLD = 'Cold',
  WARM = 'Warm',
  HOT = 'Hot'
}

export enum WhatsAppSent {
  YES = 'Yes',
  NO = 'No'
}

export interface CallLogEntry {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  websiteStatus: WebsiteStatus;
  mapsVisibility: MapsVisibility;
  attemptNumber: number;
  whoAnswered: WhoAnswered;
  outcome: CallOutcome;
  interestLevel: InterestLevel;
  nextAction: string;
  followUpDate: string; // ISO Date
  followUpTime?: string; // HH:mm
  whatsAppSent: WhatsAppSent;
  notes: string;
  createdAt: string;
  lastCallDate: string | null;
  leadStage: LeadStage;
}

export type TabType = 'master' | 'followup' | 'metrics';
