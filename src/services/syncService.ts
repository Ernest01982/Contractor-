import { supabase } from '../lib/supabase';
import { Quote, Expense, Client } from '../store/useStore';

export const syncQuoteToSupabase = async (quote: Quote) => {
  try {
    console.log('Syncing quote to Supabase:', quote.id);
    
    // 1. Upsert the quote
    const { error: quoteError } = await supabase
      .from('quotes')
      .upsert({
        id: quote.id,
        client_id: quote.client_id,
        client_name: quote.client_name,
        client_email: quote.client_email,
        client_phone: quote.client_phone,
        client_vat_number: quote.client_vat_number,
        subtotal: quote.subtotal,
        has_vat: quote.has_vat,
        vat_amount: quote.vat_amount,
        total_amount: quote.total_amount,
        deposit_percentage: quote.deposit_percentage,
        deposit_amount: quote.deposit_amount,
        status: quote.status,
        date: quote.date,
        updated_at: quote.updated_at
      }, { onConflict: 'id' });

    if (quoteError) {
      console.error('Error syncing quote:', quoteError.message, quoteError.details);
      throw quoteError;
    }

    // 2. Upsert the items
    if (quote.items && quote.items.length > 0) {
      const itemsToInsert = quote.items.map(item => ({
        id: item.id,
        quote_id: quote.id,
        job_type: item.job_type,
        surface_type: item.surface_type,
        description: item.description,
        length: item.length,
        width: item.width,
        height: item.height,
        sqm: item.sqm,
        rate: item.rate,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      }));

      const { error: itemsError } = await supabase
        .from('quote_items')
        .upsert(itemsToInsert, { onConflict: 'id' });

      if (itemsError) {
        console.error('Error syncing quote items:', itemsError.message, itemsError.details);
        throw itemsError;
      }
    }
    console.log('Quote synced successfully');
  } catch (error) {
    console.error('Failed to sync quote to Supabase:', error);
    throw error;
  }
};

export const syncExpenseToSupabase = async (expense: Expense) => {
  try {
    const { error } = await supabase
      .from('expenses')
      .upsert({
        id: expense.id,
        quote_id: expense.quote_id,
        store_name: expense.store_name,
        date: expense.date,
        total_amount: expense.total_amount,
        vat_amount: expense.vat_amount,
        image_url: expense.image_url,
        updated_at: expense.updated_at
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error syncing expense:', error.message);
      throw error;
    }
  } catch (error) {
    console.error('Failed to sync expense to Supabase:', error);
    throw error;
  }
};

export const fetchQuotesFromSupabase = async (): Promise<Quote[]> => {
  try {
    const { data: quotesData, error: quotesError } = await supabase
      .from('quotes')
      .select('*, items:quote_items(*)');

    if (quotesError) {
      console.error('Error fetching quotes:', quotesError.message);
      return [];
    }

    return (quotesData || []).map((q: any) => ({
      id: q.id,
      client_id: q.client_id,
      client_name: q.client_name,
      client_email: q.client_email,
      client_phone: q.client_phone,
      client_vat_number: q.client_vat_number,
      subtotal: q.subtotal,
      has_vat: q.has_vat,
      vat_amount: q.vat_amount,
      total_amount: q.total_amount,
      deposit_percentage: q.deposit_percentage,
      deposit_amount: q.deposit_amount,
      status: q.status,
      date: q.date,
      updated_at: q.updated_at || q.date,
      items: q.items || []
    }));
  } catch (error) {
    console.error('Failed to fetch quotes:', error);
    return [];
  }
};

export const fetchExpensesFromSupabase = async (): Promise<Expense[]> => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*');

    if (error) {
      console.error('Error fetching expenses:', error.message);
      return [];
    }

    return (data || []).map((e: any) => ({
      ...e,
      updated_at: e.updated_at || e.date
    }));
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    return [];
  }
};

export const syncClientToSupabase = async (client: Client) => {
  try {
    const { error } = await supabase
      .from('clients')
      .upsert({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        vat_number: client.vat_number,
        updated_at: client.updated_at
      }, { onConflict: 'id' });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to sync client to Supabase:', error);
    throw error;
  }
};

export const fetchClientsFromSupabase = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase.from('clients').select('*');
    if (error) return [];
    
    return (data || []).map((c: any) => ({
      ...c,
      updated_at: c.updated_at || c.created_at || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    return [];
  }
};

export const updateQuoteStatusInSupabase = async (id: string, status: string) => {
  try {
    const { error } = await supabase
      .from('quotes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    console.error('Failed to update quote status in Supabase:', error);
    throw error;
  }
};

export const fetchQuoteById = async (id: string): Promise<Quote | null> => {
  try {
    console.log('Fetching quote from Supabase:', id);
    const { data, error } = await supabase
      .from('quotes')
      .select('*, items:quote_items(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Supabase error fetching quote:', error.message, error.details, error.hint);
      return null;
    }

    if (!data) {
      console.warn('No quote found with ID:', id);
      return null;
    }

    return {
      id: data.id,
      client_id: data.client_id,
      client_name: data.client_name,
      client_email: data.client_email,
      client_phone: data.client_phone,
      client_vat_number: data.client_vat_number,
      subtotal: data.subtotal,
      has_vat: data.has_vat,
      vat_amount: data.vat_amount,
      total_amount: data.total_amount,
      deposit_percentage: data.deposit_percentage,
      deposit_amount: data.deposit_amount,
      status: data.status,
      date: data.date,
      updated_at: data.updated_at || data.date,
      items: data.items || []
    };
  } catch (error) {
    console.error('Unexpected error fetching quote:', error);
    return null;
  }
};

export const fetchProfileFromSupabase = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return null;
  }
};

export const syncProfileToSupabase = async (profile: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Remove client-side only fields if any, and ensure user_id is set
    const { user_id, ...profileData } = profile;

    const { error } = await supabase
      .from('profiles')
      .upsert({
        ...profileData,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error syncing profile:', error.message);
      throw error;
    }
  } catch (error) {
    console.error('Failed to sync profile:', error);
    throw error;
  }
};
