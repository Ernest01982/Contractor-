import { useEffect } from 'react';
import { CheckCircle, Phone, MessageCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

export function PaymentSuccessView({ quoteId }: { quoteId: string }) {
  const { updateQuoteStatus, profile } = useStore();

  useEffect(() => {
    // Automatically mark the quote as Paid when returning from successful payment
    if (quoteId) {
      updateQuoteStatus(quoteId, 'Paid');
    }
  }, [quoteId, updateQuoteStatus]);

  const contractorPhone = profile?.phone ? profile.phone.replace(/[^0-9]/g, '') : '27821234567';
  const whatsappMessage = encodeURIComponent(`Hi, I have successfully paid the deposit for Quote #${quoteId.substring(0, 8).toUpperCase()}.`);
  const whatsappUrl = `https://wa.me/${contractorPhone}?text=${whatsappMessage}`;

  useEffect(() => {
    // Automatically redirect to WhatsApp after 3 seconds
    const timer = setTimeout(() => {
      window.location.href = whatsappUrl;
    }, 3000);
    return () => clearTimeout(timer);
  }, [whatsappUrl]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center max-w-md w-full space-y-6 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="text-emerald-500 w-10 h-10" />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
          <p className="text-slate-500">Thank you for your deposit. The contractor has been notified and your job is now active.</p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-3">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Next Steps</p>
          
          <a 
            href={whatsappUrl}
            className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-600/20"
          >
            <MessageCircle size={20} />
            Return to WhatsApp
          </a>

          <a 
            href="tel:+27821234567" 
            className="flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-medium transition-colors"
          >
            <Phone size={18} />
            Call Contractor
          </a>
        </div>

        <p className="text-xs text-slate-400 pt-4">
          Quote Reference: #{quoteId.substring(0, 8).toUpperCase()}
        </p>
      </div>
    </div>
  );
}
