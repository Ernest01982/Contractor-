import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Download, CheckCircle, XCircle, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export function PublicQuoteView({ quoteId }: { quoteId: string }) {
  const { quotes, updateQuoteStatus } = useStore();
  const quote = quotes.find(q => q.id === quoteId);
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!quote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Quote Not Found</h2>
          <p className="text-slate-500">This quote may have been deleted or the link is invalid.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Quote_${quote.client_name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
    }
  };

  const handleAccept = () => {
    updateQuoteStatus(quote.id, 'Accepted');
  };

  const handleDecline = () => {
    updateQuoteStatus(quote.id, 'Declined');
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 font-sans text-slate-900">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Actions */}
        <div className="flex flex-col gap-4">
          <button 
            onClick={handleDownloadPDF}
            className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Download size={20} />
            Download PDF
          </button>

          {quote.status === 'Sent' && (
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleDecline}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <XCircle size={20} />
                Decline Quote
              </button>
              <button 
                onClick={handleAccept}
                className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
              >
                <Check size={20} />
                Accept Quote
              </button>
            </div>
          )}

          {quote.status === 'Accepted' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-emerald-700 font-medium flex items-center justify-center gap-2">
                  <CheckCircle size={20} /> You have accepted this quote.
                </p>
              </div>
              <form action="https://sandbox.payfast.co.za/eng/process" method="POST">
                <input type="hidden" name="merchant_id" value="10004002" />
                <input type="hidden" name="merchant_key" value="q1cd2rdny4a53" />
                <input type="hidden" name="return_url" value={`${window.location.origin}/?success=true&quoteId=${quote.id}`} />
                <input type="hidden" name="cancel_url" value={`${window.location.origin}/?quoteId=${quote.id}`} />
                <input type="hidden" name="amount" value={quote.deposit_amount.toFixed(2)} />
                <input type="hidden" name="item_name" value={`Deposit for Quote #${quote.id.substring(0, 8)}`} />
                
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/20"
                >
                  Pay Deposit via PayFast
                </button>
              </form>
            </div>
          )}

          {quote.status === 'Declined' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-700 font-medium flex items-center justify-center gap-2">
                <XCircle size={20} /> You have declined this quote.
              </p>
            </div>
          )}

          {quote.status === 'Paid' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-emerald-700 font-medium flex items-center justify-center gap-2">
                <CheckCircle size={20} /> Deposit Paid. Thank you!
              </p>
            </div>
          )}
        </div>

        {/* Invoice Document */}
        <div ref={invoiceRef} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          {/* Header */}
          <div className="flex justify-between items-start mb-10 border-b border-slate-200 pb-8">
            <div>
              <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">CP</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Contractor Pro</h1>
              <p className="text-slate-500 text-sm mt-1">123 Builder Street<br/>Cape Town, 8001<br/>contact@contractorpro.co.za</p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-slate-200 uppercase tracking-tight mb-2">Quote</h2>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">Billed To</p>
              <p className="font-bold text-lg text-slate-900">{quote.client_name}</p>
              {quote.client_phone && <p className="text-slate-600">{quote.client_phone}</p>}
              <p className="text-slate-500 mt-4">Date: {new Date(quote.date).toLocaleDateString()}</p>
              <p className="text-slate-500">Quote #: {quote.id.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-6 mb-10">
            <div className="grid grid-cols-12 text-sm font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">
              <div className="col-span-8">Description</div>
              <div className="col-span-4 text-right">Amount</div>
            </div>
            
            {quote.items.map(item => (
              <div key={item.id} className="grid grid-cols-12 items-start py-2 border-b border-slate-100 last:border-0">
                <div className="col-span-8">
                  <p className="font-semibold text-slate-800">{item.description}</p>
                  <p className="text-sm text-slate-500">
                    {item.job_type === 'Painting' || item.job_type === 'Tiling' 
                      ? `${item.sqm} sqm ${item.surface_type ? `(${item.surface_type}) ` : ''}@ ${formatCurrency(item.rate || 0)}/sqm`
                      : `${item.quantity} x ${formatCurrency(item.unit_price || 0)}`
                    }
                  </p>
                </div>
                <div className="col-span-4 text-right font-medium text-slate-900">
                  {formatCurrency(item.subtotal)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatCurrency(quote.subtotal)}</span>
              </div>
              {quote.has_vat && (
                <div className="flex justify-between text-slate-600">
                  <span>VAT (15%)</span>
                  <span>{formatCurrency(quote.vat_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-slate-900 pt-4 border-t border-slate-200">
                <span>Total</span>
                <span>{formatCurrency(quote.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Deposit Callout */}
          <div className="mt-10 bg-emerald-50 rounded-xl p-6 border border-emerald-100 text-center">
            <p className="text-sm text-emerald-800 uppercase tracking-wider font-semibold mb-2">Deposit Required to Schedule</p>
            <p className="text-3xl font-bold text-emerald-600">{formatCurrency(quote.deposit_amount)}</p>
            <p className="text-sm text-emerald-700 mt-2">({quote.deposit_percentage}% of Total)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
