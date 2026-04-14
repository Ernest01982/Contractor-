import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Paid';
export type JobType = 'Painting' | 'Tiling' | 'Plumbing' | 'Electrical' | 'General';
export type SurfaceType = 'Ceiling/Roof' | 'Floor' | 'Wall';

export interface QuoteItem {
  id: string;
  job_type: JobType;
  surface_type?: SurfaceType;
  description: string;
  length?: number;
  width?: number;
  height?: number;
  sqm?: number;
  rate?: number;
  quantity?: number;
  unit_price?: number;
  subtotal: number;
}

export interface Quote {
  id: string;
  client_name: string;
  client_phone: string;
  items: QuoteItem[];
  subtotal: number;
  has_vat: boolean;
  vat_amount: number;
  total_amount: number;
  deposit_percentage: number;
  deposit_amount: number;
  status: QuoteStatus;
  date: string;
}

export interface ServiceLibraryItem {
  id: string;
  job_type: JobType;
  description: string;
  rate?: number;
  unit_price?: number;
}

export interface Expense {
  id: string;
  quote_id: string | null;
  store_name: string;
  date: string;
  total_amount: number;
  vat_amount: number;
  image_url?: string;
}

interface AppState {
  quotes: Quote[];
  expenses: Expense[];
  serviceLibrary: ServiceLibraryItem[];
  isOffline: boolean;
  isAuthenticated: boolean;
  bookkeeperToken: string | null;
  bookkeeperTokenExpiry: string | null;
  bookkeeperLastAccessed: string | null;
  addQuote: (quote: Partial<Quote> & Omit<Quote, 'id' | 'date'>) => void;
  updateQuoteStatus: (id: string, status: QuoteStatus) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  addServiceToLibrary: (service: Omit<ServiceLibraryItem, 'id'>) => void;
  setOfflineStatus: (status: boolean) => void;
  setAuthenticated: (status: boolean) => void;
  generateBookkeeperToken: (token: string, expiry: string) => void;
  revokeBookkeeperToken: () => void;
  updateBookkeeperAccess: (date: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      quotes: [],
      expenses: [],
      serviceLibrary: [],
      isOffline: !navigator.onLine,
      isAuthenticated: false,
      bookkeeperToken: null,
      bookkeeperTokenExpiry: null,
      bookkeeperLastAccessed: null,
      addQuote: (quote) => set((state) => ({
        quotes: [{ ...quote, id: quote.id || uuidv4(), date: quote.date || new Date().toISOString() }, ...state.quotes]
      })),
      updateQuoteStatus: (id, status) => set((state) => ({
        quotes: state.quotes.map(q => q.id === id ? { ...q, status } : q)
      })),
      addExpense: (expense) => set((state) => ({
        expenses: [{ ...expense, id: uuidv4() }, ...state.expenses]
      })),
      addServiceToLibrary: (service) => set((state) => ({
        serviceLibrary: [...state.serviceLibrary, { ...service, id: uuidv4() }]
      })),
      setOfflineStatus: (status) => set({ isOffline: status }),
      setAuthenticated: (status) => set({ isAuthenticated: status }),
      generateBookkeeperToken: (token, expiry) => set({
        bookkeeperToken: token,
        bookkeeperTokenExpiry: expiry
      }),
      revokeBookkeeperToken: () => set({
        bookkeeperToken: null,
        bookkeeperTokenExpiry: null,
        bookkeeperLastAccessed: null
      }),
      updateBookkeeperAccess: (date) => set({
        bookkeeperLastAccessed: date
      })
    }),
    {
      name: 'contractor-storage',
    }
  )
);
