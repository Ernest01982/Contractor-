import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { syncQuoteToSupabase, syncExpenseToSupabase, fetchQuotesFromSupabase, fetchExpensesFromSupabase } from '../services/syncService';

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

interface PendingSync {
  type: 'quote' | 'expense';
  id: string;
}

interface AppState {
  quotes: Quote[];
  expenses: Expense[];
  serviceLibrary: ServiceLibraryItem[];
  pendingSyncs: PendingSync[];
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
  syncFromSupabase: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      quotes: [],
      expenses: [],
      serviceLibrary: [],
      pendingSyncs: [],
      isOffline: !navigator.onLine,
      isAuthenticated: false,
      bookkeeperToken: null,
      bookkeeperTokenExpiry: null,
      bookkeeperLastAccessed: null,
      addQuote: (quote) => {
        const newQuote = { ...quote, id: quote.id || uuidv4(), date: quote.date || new Date().toISOString() } as Quote;
        set((state) => ({
          quotes: [newQuote, ...state.quotes],
          pendingSyncs: [...state.pendingSyncs, { type: 'quote', id: newQuote.id }]
        }));
        
        if (navigator.onLine) {
          get().syncFromSupabase(); // Trigger sync which will process the queue
        }
      },
      updateQuoteStatus: (id, status) => {
        set((state) => ({
          quotes: state.quotes.map(q => q.id === id ? { ...q, status } : q),
          pendingSyncs: [...state.pendingSyncs, { type: 'quote', id }]
        }));
        
        if (navigator.onLine) {
          get().syncFromSupabase();
        }
      },
      addExpense: (expense) => {
        const newExpense = { ...expense, id: uuidv4() } as Expense;
        set((state) => ({
          expenses: [newExpense, ...state.expenses],
          pendingSyncs: [...state.pendingSyncs, { type: 'expense', id: newExpense.id }]
        }));
        
        if (navigator.onLine) {
          get().syncFromSupabase();
        }
      },
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
      }),
      syncFromSupabase: async () => {
        if (!navigator.onLine) return;
        
        const state = get();
        
        // 1. Process pending syncs first (push local changes to remote)
        const pending = [...state.pendingSyncs];
        if (pending.length > 0) {
          // Deduplicate pending syncs
          const uniquePending = pending.filter((v, i, a) => a.findIndex(t => (t.id === v.id && t.type === v.type)) === i);
          
          for (const item of uniquePending) {
            if (item.type === 'quote') {
              const quote = state.quotes.find(q => q.id === item.id);
              if (quote) await syncQuoteToSupabase(quote);
            } else if (item.type === 'expense') {
              const expense = state.expenses.find(e => e.id === item.id);
              if (expense) await syncExpenseToSupabase(expense);
            }
          }
          
          // Clear pending syncs after successful push
          set({ pendingSyncs: [] });
        }
        
        // 2. Fetch latest from remote
        const [remoteQuotes, remoteExpenses] = await Promise.all([
          fetchQuotesFromSupabase(),
          fetchExpensesFromSupabase()
        ]);

        if (remoteQuotes.length > 0 || remoteExpenses.length > 0) {
          set((currentState) => {
            // Merge logic: remote is source of truth, but we just pushed our local changes
            // so remote should be fully up to date.
            const mergedQuotes = [...remoteQuotes];
            currentState.quotes.forEach(localQuote => {
              if (!mergedQuotes.find(q => q.id === localQuote.id)) {
                mergedQuotes.push(localQuote);
              }
            });

            const mergedExpenses = [...remoteExpenses];
            currentState.expenses.forEach(localExpense => {
              if (!mergedExpenses.find(e => e.id === localExpense.id)) {
                mergedExpenses.push(localExpense);
              }
            });

            // Sort by date descending
            mergedQuotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            mergedExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return {
              quotes: mergedQuotes,
              expenses: mergedExpenses
            };
          });
        }
      }
    }),
    {
      name: 'contractor-storage',
    }
  )
);
