export enum ActivityType {
  SIGHTSEEING = 'SIGHTSEEING',
  FOOD = 'FOOD',
  TRANSPORT = 'TRANSPORT', // Voo, Trem, Transfer
  HOTEL = 'HOTEL',
  WORK_STUDY = 'WORK_STUDY', // Estudo, Treinamento, Trabalho
  OTHER = 'OTHER'
}

export interface Attachment {
  id: string;
  name: string;
  type: 'IMAGE' | 'PDF';
  data: string; // Base64
}

export interface TripDocument {
  id: string;
  title: string;
  isChecked: boolean;
  image?: string; // Base64 compressed image
}

export interface Activity {
  id: string;
  time: string; // HH:mm
  title: string;
  description?: string;
  type: ActivityType;
  location?: string;
  cost?: number; // Optional estimated cost
  attachments?: Attachment[];
  // Transport specific details
  transportDetails?: {
    type: 'FLIGHT' | 'TRAIN' | 'BUS' | 'TRANSFER';
    code?: string;
    terminal?: string;
  };
}

export interface DayItinerary {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  dayNumber: number;
  activities: Activity[];
}

export interface CurrencyConfig {
  code: string; // e.g., 'USD', 'EUR'
  rateToBRL: number; // User defined rate
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  date: string;
  amountInBRL: number;
}

export interface Trip {
  id: string;
  destination: string; // Main title
  cities: string[]; // List of cities
  startDate: string;
  endDate: string;
  budgetBRL: number;
  coverImage?: string;
  days: DayItinerary[];
  currencies: CurrencyConfig[];
  expenses: Expense[];
  documents: TripDocument[]; // New field for documents
  notes: string; // Important notes on home screen
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'CREATE_TRIP' | 'TRIP_DETAILS';