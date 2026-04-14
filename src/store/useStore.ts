import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { syncQuoteToSupabase, syncExpenseToSupabase, fetchQuotesFromSupabase, fetchExpensesFromSupabase, fetchProfileFromSupabase, syncProfileToSupabase } from '../services/syncService';

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
  updatedAt: string;
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
  updatedAt: string;
}

export interface UserProfile {
  user_id: string;
  company_name: string;
  vat_number: string;
  phone: string;
  email: string;
  default_deposit_pct: number;
  is_vat_registered: boolean;
  updated_at?: string;
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
  profile: UserProfile | null;
  isOffline: boolean;
  isAuthenticated: boolean;
  isSyncing: boolean;
  bookkeeperToken: string | null;
  bookkeeperTokenExpiry: string | null;
  bookkeeperLastAccessed: string | null;
  addQuote: (quote: Partial<Quote> & Omit<Quote, 'id' | 'date' | 'updatedAt'>) => void;
  updateQuoteStatus: (id: string, status: QuoteStatus) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'updatedAt'>) => void;
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
      profile: null,
      isOffline: !navigator.onLine,
      isAuthenticated: false,
      isSyncing: false,
      bookkeeperToken: null,
      bookkeeperTokenExpiry: null,
      bookkeeperLastAccessed: null,
      addQuote: (quote) => {
        const now = new Date().toISOString();
        const newQuote = { 
          ...quote, 
          id: quote.id || uuidv4(), 
          date: quote.date || now,
          updatedAt: now
        } as Quote;
        
        set((state) => ({
          quotes: [newQuote, ...state.quotes],
          pendingSyncs: [...state.pendingSyncs, { type: 'quote', id: newQuote.id }]
        }));
        
        if (navigator.onLine) {
          get().syncFromSupabase();
        }
      },
      updateQuoteStatus: (id, status) => {
        const now = new Date().toISOString();
        set((state) => ({
          quotes: state.quotes.map(q => q.id === id ? { ...q, status, updatedAt: now } : q),
          pendingSyncs: [...state.pendingSyncs, { type: 'quote', id }]
        }));
        
        if (navigator.onLine) {
          get().syncFromSupabase();
        }
      },
      updateProfile: (updates) => {
        set((state) => {
          const newProfile = state.profile ? { ...state.profile, ...updates } : updates as UserProfile;
          if (navigator.onLine) {
            syncProfileToSupabase(newProfile);
          }
          return { profile: newProfile };
        });
      },
      addExpense: (expense) => {
        const now = new Date().toISOString();
        const newExpense = { ...expense, id: uuidv4(), updatedAt: now } as Expense;
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
        if (!navigator.onLine || get().isSyncing) return;
        
        set({ isSyncing: true });
        
        try {
          const state = get();
          
          // 1. Process pending syncs with individual error handling
          const pending = [...state.pendingSyncs];
          const successfulSyncs: PendingSync[] = [];
          
          if (pending.length > 0) {
            // Deduplicate pending syncs (keep only the latest for each ID)
            const uniquePending = pending.filter((v, i, a) => {
              const lastIndex = a.length - 1 - [...a].reverse().findIndex(t => (t.id === v.id && t.type === v.type));
              return lastIndex === i;
            });
            
            for (const item of uniquePending) {
              try {
                if (item.type === 'quote') {
                  const quote = state.quotes.find(q => q.id === item.id);
                  if (quote) {
                    await syncQuoteToSupabase(quote);
                    successfulSyncs.push(item);
                  }
                } else if (item.type === 'expense') {
                  const expense = state.expenses.find(e => e.id === item.id);
                  if (expense) {
                    await syncExpenseToSupabase(expense);
                    successfulSyncs.push(item);
                  }
                }
              } catch (err) {
                console.error(`Failed to sync ${item.type} ${item.id}:`, err);
                // We don't add to successfulSyncs, so it stays in the queue for next retry
              }
            }
            
            // Remove only successful syncs from the queue
            set((currentState) => ({
              pendingSyncs: currentState.pendingSyncs.filter(p => 
                !successfulSyncs.some(s => s.id === p.id && s.type === p.type)
              )
            }));
          }
          
          // 2. Fetch latest from remote
          const [remoteQuotes, remoteExpenses, remoteProfile] = await Promise.all([
            fetchQuotesFromSupabase(),
            fetchExpensesFromSupabase(),
            fetchProfileFromSupabase()
          ]);

          set((currentState) => {
            // Merge logic: Use updatedAt for conflict resolution
            const quoteMap = new Map<string, Quote>();
            
            // Add local quotes first
            currentState.quotes.forEach(q => quoteMap.set(q.id, q));
            
            // Merge remote quotes
            remoteQuotes.forEach(remoteQ => {
              const localQ = quoteMap.get(remoteQ.id);
              if (!localQ || new Date(remoteQ.updatedAt || remoteQ.date) > new Date(localQ.updatedAt || localQ.date)) {
                quoteMap.set(remoteQ.id, remoteQ);
              }
            });

            const expenseMap = new Map<string, Expense>();
            currentState.expenses.forEach(e => expenseMap.set(e.id, e));
            remoteExpenses.forEach(remoteE => {
              const localE = expenseMap.get(remoteE.id);
              if (!localE || new Date(remoteE.updatedAt || remoteE.date) > new Date(localE.updatedAt || localE.date)) {
                expenseMap.set(remoteE.id, remoteE);
              }
            });

            const mergedQuotes = Array.from(quoteMap.values())
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            const mergedExpenses = Array.from(expenseMap.values())
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return {
              quotes: mergedQuotes,
              expenses: mergedExpenses,
              profile: remoteProfile || currentState.profile,
              isSyncing: false
            };
          });
        } catch (error) {
          console.error('Global sync error:', error);
          set({ isSyncing: false });
        }
      }
    }),
    {
      name: 'contractor-storage',
    }
  )
);
