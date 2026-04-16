import { useEffect, useState } from 'react';
import { CheckCircle, Phone, MessageCircle, Loader2 } from 'lucide-react';
import { fetchQuoteById, updateQuoteStatusInSupabase } from '../services/syncService';
import { Quote } from '../store/useStore';

export function PaymentSuccessView({ quoteId }: { quoteId: string }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  const searchParams = new URLSearchParams(window.location.search);
  const phoneParam = searchParams.get('c');

  useEffect(() => {
    const processPayment = async () => {
      try {
        const fetchedQuote = await fetchQuoteById(quoteId);
        if (fetchedQuote) {
          setQuote(fetchedQuote);
          // Mark the quote as Paid directly in Supabase (client lacks local store)
          if (fetchedQuote.status === 'Sent' || fetchedQuote.status === 'Accepted') {
            await updateQuoteStatusInSupabase(quoteId, 'Deposit Paid');
          } else if (fetchedQuote.status === 'Final Invoice Sent') {
            await updateQuoteStatusInSupabase(quoteId, 'Fully Paid');
          }
        }
      } catch (error) {
        console.error("Error updating quote:", error);
      } finally {
        setLoading(false);
      }
    };

    if (quoteId) {
      processPayment();
    }
  }, [quoteId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const isFinalInvoice = quote?.status === 'Final Invoice Sent' || quote?.status === 'Fully Paid';
  const contractorPhone = phoneParam ? phoneParam.replace(/[^0-9]/g, '') : '';

  const whatsappMessage = encodeURIComponent(
    isFinalInvoice 
      ? `Hi, I have successfully paid the final balance for Tax Invoice #${quoteId.substring(0, 8).toUpperCase()}.`
      : `Hi, I have successfully paid the deposit for Quote #${quoteId.substring(0, 8).toUpperCase()}.`
  );

  // If phone is missing, it will open the generic WhatsApp picker
  const whatsappUrl = contractorPhone 
    ? `https://wa.me/${contractorPhone}?text=${whatsappMessage}`
    : `https://wa.me/?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center max-w-md w-full space-y-6 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="text-emerald-500 w-10 h-10" />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
          <p className="text-slate-500">
            {isFinalInvoice 
              ? "Thank you for your final payment. Your job is now complete."
              : "Thank you for your deposit. The contractor has been notified and your job is now active."}
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-3">
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-2 animate-pulse">Required Final Step</p>
          <p className="text-sm text-slate-600 pb-2">Please tap the button below to notify your contractor that the payment was successful.</p>
          
          <a 
            href={whatsappUrl}
            className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-emerald-600/20"
          >
            <MessageCircle size={24} />
            Send WhatsApp Receipt
          </a>

          {contractorPhone && (
            <a 
              href={`tel:+${contractorPhone}`} 
              className="flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-medium transition-colors"
            >
              <Phone size={18} />
              Call Contractor
            </a>
          )}
        </div>

        <p className="text-xs text-slate-400 pt-4">
          Quote Reference: #{quoteId.substring(0, 8).toUpperCase()}
        </p>
      </div>
    </div>
  );
}
