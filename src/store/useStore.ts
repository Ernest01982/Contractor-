import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { syncQuoteToSupabase, syncExpenseToSupabase, fetchQuotesFromSupabase, fetchExpensesFromSupabase, fetchProfileFromSupabase, syncProfileToSupabase, syncClientToSupabase, fetchClientsFromSupabase, deleteQuoteFromSupabase } from '../services/syncService';

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Deposit Paid' | 'In Progress' | 'Final Invoice Sent' | 'Fully Paid';
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
  client_id?: string;
  client_name: string;
  client_email?: string;
  client_phone: string;
  client_vat_number?: string;
  items: QuoteItem[];
  subtotal: number;
  has_vat: boolean;
  vat_amount: number;
  total_amount: number;
  deposit_percentage: number;
  deposit_amount: number;
  status: QuoteStatus;
  date: string;
  updated_at: string;
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
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  vat_number: string;
  updated_at: string;
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
  type: 'quote' | 'expense' | 'client' | 'delete-quote';
  id: string;
}

interface AppState {
  quotes: Quote[];
  expenses: Expense[];
  clients: Client[];
  serviceLibrary: ServiceLibraryItem[];
  pendingSyncs: PendingSync[];
  profile: UserProfile | null;
  isOffline: boolean;
  isAuthenticated: boolean;
  isSyncing: boolean;
  lastSyncError: string | null;
  bookkeeperToken: string | null;
  bookkeeperTokenExpiry: string | null;
  bookkeeperLastAccessed: string | null;
  addQuote: (quote: Partial<Quote> & Omit<Quote, 'id' | 'date' | 'updated_at'>) => void;
  updateQuoteStatus: (id: string, status: QuoteStatus) => void;
  updateQuote: (id: string, updates: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'updated_at'>) => void;
  addClient: (client: Omit<Client, 'id' | 'updated_at'>) => string;
  updateClient: (id: string, updates: Partial<Client>) => void;
  addServiceToLibrary: (service: Omit<ServiceLibraryItem, 'id'>) => void;
  setOfflineStatus: (status: boolean) => void;
  setAuthenticated: (status: boolean) => void;
  generateBookkeeperToken: (token: string, expiry: string) => void;
  revokeBookkeeperToken: () => void;
  updateBookkeeperAccess: (date: string) => void;
  syncFromSupabase: () => Promise<void>;
  clearDataOnLogout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      quotes: [],
      expenses: [],
      clients: [],
      serviceLibrary: [],
      pendingSyncs: [],
      profile: null,
      isOffline: !navigator.onLine,
      isAuthenticated: false,
      isSyncing: false,
      lastSyncError: null,
      bookkeeperToken: null,
      bookkeeperTokenExpiry: null,
      bookkeeperLastAccessed: null,
      addQuote: (quote) => {
        const now = new Date().toISOString();
        const newQuote = { 
          ...quote, 
          id: quote.id || uuidv4(), 
          date: quote.date || now,
          updated_at: now
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
          quotes: state.quotes.map(q => q.id === id ? { ...q, status, updated_at: now } : q),
          pendingSyncs: [...state.pendingSyncs, { type: 'quote', id }]
        }));
        
        if (navigator.onLine) {
          get().syncFromSupabase();
        }
      },
      updateQuote: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          quotes: state.quotes.map(q => q.id === id ? { ...q, ...updates, updated_at: now } : q),
          pendingSyncs: [...state.pendingSyncs, { type: 'quote', id }]
        }));
        if (navigator.onLine) {
          get().syncFromSupabase();
        }
      },
      deleteQuote: (id) => {
        set((state) => ({
          quotes: state.quotes.filter(q => q.id !== id),
          // Queue a deletion
          pendingSyncs: [...state.pendingSyncs, { type: 'delete-quote', id }]
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
        const newExpense = { ...expense, id: uuidv4(), updated_at: now } as Expense;
        set((state) => ({
          expenses: [newExpense, ...state.expenses],
          pendingSyncs: [...state.pendingSyncs, { type: 'expense', id: newExpense.id }]
        }));
        
        if (navigator.onLine) {
          get().syncFromSupabase();
        }
      },
      addClient: (client) => {
        const now = new Date().toISOString();
        const newClient = { ...client, id: uuidv4(), updated_at: now } as Client;
        set((state) => ({
          clients: [newClient, ...state.clients],
          pendingSyncs: [...state.pendingSyncs, { type: 'client', id: newClient.id }]
        }));
        if (navigator.onLine) get().syncFromSupabase();
        return newClient.id;
      },
      updateClient: (id, updates) => {
        const now = new Date().toISOString();
        set((state) => ({
          clients: state.clients.map(c => c.id === id ? { ...c, ...updates, updated_at: now } : c),
          pendingSyncs: [...state.pendingSyncs, { type: 'client', id }]
        }));
        if (navigator.onLine) get().syncFromSupabase();
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
      clearDataOnLogout: () => set({
        quotes: [],
        expenses: [],
        clients: [],
        pendingSyncs: [],
        profile: null,
        isAuthenticated: false,
        lastSyncError: null
      }),
      syncFromSupabase: async () => {
        if (!navigator.onLine || get().isSyncing || !get().isAuthenticated) return;
        
        set({ isSyncing: true });
        
        try {
          const state = get();
          set({ lastSyncError: null });
          
          // 1. Process pending syncs with individual error handling
          const pending = [...state.pendingSyncs];
          const successfulSyncs: PendingSync[] = [];
          
          if (pending.length > 0) {
            // Deduplicate pending syncs (keep only the latest for each ID)
            let uniquePending = pending.filter((v, i, a) => {
              const lastIndex = a.length - 1 - [...a].reverse().findIndex(t => (t.id === v.id && t.type === v.type));
              return lastIndex === i;
            });

            // Sort so that 'client' syncs happen first to prevent foreign key errors for quotes
            const typePriority = { 'client': 0, 'quote': 1, 'expense': 2, 'delete-quote': 3 };
            uniquePending.sort((a, b) => (typePriority[a.type as keyof typeof typePriority] ?? 5) - (typePriority[b.type as keyof typeof typePriority] ?? 5));
            
            const failedIds = new Set<string>();
            const errors: string[] = [];

            for (const item of uniquePending) {
              try {
                if (item.type === 'quote') {
                  const quote = state.quotes.find(q => q.id === item.id);
                  if (quote) {
                    // Check if this quote's client failed to sync in this batch
                    if (quote.client_id && failedIds.has(quote.client_id)) {
                      console.warn(`Skipping quote ${quote.id} because its client ${quote.client_id} failed to sync.`);
                      continue; // Keep in pendingSyncs for next try
                    }
                    await syncQuoteToSupabase(quote);
                  }
                  successfulSyncs.push(item);
                } else if (item.type === 'expense') {
                  const expense = state.expenses.find(e => e.id === item.id);
                  if (expense) {
                    await syncExpenseToSupabase(expense);
                  }
                  successfulSyncs.push(item);
                } else if (item.type === 'client') {
                  const client = state.clients.find(c => c.id === item.id);
                  if (client) {
                    await syncClientToSupabase(client);
                  }
                  successfulSyncs.push(item);
                } else if (item.type === 'delete-quote') {
                  await deleteQuoteFromSupabase(item.id);
                  successfulSyncs.push(item);
                }
              } catch (err: any) {
                const msg = err.message || String(err);
                console.error(`Failed to sync ${item.type} ${item.id}:`, msg);
                failedIds.add(item.id);
                errors.push(`${item.type} sync failed: ${msg}`);

                // Auto-recover from foreign key constraint errors
                if (item.type === 'quote' && msg.includes('quotes_client_id_fkey')) {
                  const quote = state.quotes.find(q => q.id === item.id);
                  if (quote && quote.client_id) {
                    const clientExistsLocally = state.clients.some(c => c.id === quote.client_id);
                    if (clientExistsLocally) {
                      set((currentState) => {
                        if (!currentState.pendingSyncs.some(p => p.type === 'client' && p.id === quote.client_id)) {
                          console.log('Auto-queuing missing client for sync:', quote.client_id);
                          return { pendingSyncs: [...currentState.pendingSyncs, { type: 'client', id: quote.client_id! }] };
                        }
                        return {};
                      });
                    } else {
                      console.warn('Client entirely missing locally. Stripping client_id from quote to allow sync.');
                      set((currentState) => ({
                        quotes: currentState.quotes.map(q => q.id === quote.id ? { ...q, client_id: undefined } : q)
                      }));
                    }
                  }
                }
              }
            }
            
            if (errors.length > 0) {
              set({ lastSyncError: errors.length === 1 ? errors[0] : `${errors.length} sync tasks failed. Check console for details.` });
            }

            // Remove only successful syncs from the queue
            set((currentState) => ({
              pendingSyncs: currentState.pendingSyncs.filter(p => 
                !successfulSyncs.some(s => s.id === p.id && s.type === p.type)
              )
            }));
          }
          
          // 2. Fetch latest from remote
          const [remoteQuotes, remoteExpenses, remoteProfile, remoteClients] = await Promise.all([
            fetchQuotesFromSupabase(),
            fetchExpensesFromSupabase(),
            fetchProfileFromSupabase(),
            fetchClientsFromSupabase()
          ]);

          set((currentState) => {
            // Merge logic: Use updated_at for conflict resolution
            const quoteMap = new Map<string, Quote>();
            
            // Add local quotes first
            currentState.quotes.forEach(q => quoteMap.set(q.id, q));
            
            // Merge remote quotes
            remoteQuotes.forEach(remoteQ => {
              const localQ = quoteMap.get(remoteQ.id);
              if (!localQ || new Date(remoteQ.updated_at || remoteQ.date) > new Date(localQ.updated_at || localQ.date)) {
                quoteMap.set(remoteQ.id, remoteQ);
              }
            });

            const expenseMap = new Map<string, Expense>();
            currentState.expenses.forEach(e => expenseMap.set(e.id, e));
            remoteExpenses.forEach(remoteE => {
              const localE = expenseMap.get(remoteE.id);
              if (!localE || new Date(remoteE.updated_at || remoteE.date) > new Date(localE.updated_at || localE.date)) {
                expenseMap.set(remoteE.id, remoteE);
              }
            });

            const clientMap = new Map<string, Client>();
            currentState.clients.forEach(c => clientMap.set(c.id, c));
            remoteClients.forEach(remoteC => {
              const localC = clientMap.get(remoteC.id);
              if (!localC || new Date(remoteC.updated_at) > new Date(localC.updated_at)) {
                clientMap.set(remoteC.id, remoteC);
              }
            });

            const mergedQuotes = Array.from(quoteMap.values())
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            const mergedExpenses = Array.from(expenseMap.values())
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            const mergedClients = Array.from(clientMap.values())
              .sort((a, b) => a.name.localeCompare(b.name));

            return {
              quotes: mergedQuotes,
              expenses: mergedExpenses,
              clients: mergedClients,
              profile: remoteProfile || currentState.profile,
              isSyncing: false
            };
          });

          // If more sync tasks were queued while we were processing, trigger another sync
          if (get().pendingSyncs.length > 0) {
            setTimeout(() => {
              get().syncFromSupabase();
            }, 500);
          }

        } catch (error: any) {
          const msg = error.message || String(error);
          console.error('Global sync error:', msg);
          set({ isSyncing: false, lastSyncError: `Global sync error: ${msg}` });
        }
      }
    }),
    {
      name: 'contractor-storage',
    }
  )
);
