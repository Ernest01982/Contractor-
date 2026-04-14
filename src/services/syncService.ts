import { supabase } from '../lib/supabase';
import { Quote, Expense } from '../store/useStore';

export const syncQuoteToSupabase = async (quote: Quote) => {
  try {
    // 1. Upsert the quote
    const { error: quoteError } = await supabase
      .from('quotes')
      .upsert({
        id: quote.id,
        client_name: quote.client_name,
        client_phone: quote.client_phone,
        subtotal: quote.subtotal,
        has_vat: quote.has_vat,
        vat_amount: quote.vat_amount,
        total_amount: quote.total_amount,
        deposit_percentage: quote.deposit_percentage,
        deposit_amount: quote.deposit_amount,
        status: quote.status,
        date: quote.date
      });

    if (quoteError) {
      console.error('Error syncing quote:', quoteError);
      return;
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
        .upsert(itemsToInsert);

      if (itemsError) {
        console.error('Error syncing quote items:', itemsError);
      }
    }
  } catch (error) {
    console.error('Failed to sync quote to Supabase:', error);
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
        image_url: expense.image_url
      });

    if (error) {
      console.error('Error syncing expense:', error);
    }
  } catch (error) {
    console.error('Failed to sync expense to Supabase:', error);
  }
};

export const fetchQuotesFromSupabase = async (): Promise<Quote[]> => {
  try {
    const { data: quotesData, error: quotesError } = await supabase
      .from('quotes')
      .select('*, items:quote_items(*)');

    if (quotesError) {
      console.error('Error fetching quotes:', quotesError);
      return [];
    }

    return (quotesData || []).map((q: any) => ({
      id: q.id,
      client_name: q.client_name,
      client_phone: q.client_phone,
      subtotal: q.subtotal,
      has_vat: q.has_vat,
      vat_amount: q.vat_amount,
      total_amount: q.total_amount,
      deposit_percentage: q.deposit_percentage,
      deposit_amount: q.deposit_amount,
      status: q.status,
      date: q.date,
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
      console.error('Error fetching expenses:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    return [];
  }
};
