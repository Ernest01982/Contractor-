import { useState } from 'react';
import { useStore, QuoteStatus } from '../store/useStore';
import { Plus, Search, FileText, Edit2, MessageCircle, Mail, Trash2 } from 'lucide-react';
import { QuoteBuilder } from '../components/QuoteBuilder';

export function Quotes() {
  const { quotes, updateQuoteStatus, deleteQuote } = useStore();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | undefined>();
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Active' | 'Past'>('All');

  const handleEdit = (id: string) => {
    setEditingQuoteId(id);
    setShowBuilder(true);
  };

  const closeBuilder = () => {
    setShowBuilder(false);
    setEditingQuoteId(undefined);
  };

  const handleWhatsApp = (quote: any) => {
    let message = quote.status === 'Final Invoice Sent' 
      ? `Hi ${quote.client_name}, please find the final Tax Invoice. Total Outstanding: ${formatCurrency(quote.total_amount - quote.deposit_amount)}. Pay here: ${window.location.origin}/?quoteId=${quote.id}`
      : `Hi ${quote.client_name}, please find my quote attached. Total: ${formatCurrency(quote.total_amount)}. View online & Pay Deposit here: ${window.location.origin}/?quoteId=${quote.id}`;
    
    let phone = quote.client_phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '27' + phone.substring(1);
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleEmail = (quote: any) => {
    if (!quote.client_email) {
      alert("No email address saved for this client.");
      return;
    }
    const subject = quote.status === 'Final Invoice Sent' ? 'Tax Invoice' : 'Quote';
    let body = quote.status === 'Final Invoice Sent' 
      ? `Hi ${quote.client_name},\n\nPlease find the final Tax Invoice. Total Outstanding: ${formatCurrency(quote.total_amount - quote.deposit_amount)}.\nPay here: ${window.location.origin}/?quoteId=${quote.id}`
      : `Hi ${quote.client_name},\n\nPlease find my quote. Total: ${formatCurrency(quote.total_amount)}.\nView online & Pay Deposit here: ${window.location.origin}/?quoteId=${quote.id}`;
    
    window.location.href = `mailto:${quote.client_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-50">Quotes</h2>
        <button 
          onClick={() => setShowBuilder(true)}
          className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors min-h-[44px]"
        >
          <Plus size={18} />
          New
        </button>
      </div>

      {/* Search Bar & Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Search quotes..." 
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-h-[44px]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['All', 'Pending', 'Active', 'Past'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap font-medium transition-colors ${filter === f ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {quotes.filter(q => {
          if (filter === 'Pending') return q.status === 'Draft' || q.status === 'Sent' || q.status === 'Accepted';
          if (filter === 'Active') return q.status === 'Deposit Paid' || q.status === 'In Progress';
          if (filter === 'Past') return q.status === 'Final Invoice Sent' || q.status === 'Fully Paid' || q.status === 'Declined';
          return true;
        }).map(quote => (
          <div key={quote.id} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-slate-700 p-2 rounded-lg text-slate-300">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-medium text-slate-200">{quote.client_name}</p>
                  <p className="text-sm text-slate-400">{new Date(quote.date).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="font-bold text-slate-50">{formatCurrency(quote.total_amount)}</p>
            </div>
            
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-700/50">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  quote.status === 'Fully Paid' ? 'bg-emerald-500/10 text-emerald-500' :
                  quote.status === 'Deposit Paid' ? 'bg-emerald-500/10 text-emerald-400' :
                  quote.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400' :
                  quote.status === 'Accepted' ? 'bg-yellow-500/10 text-yellow-500' :
                  quote.status === 'Sent' || quote.status === 'Final Invoice Sent' ? 'bg-purple-500/10 text-purple-400' :
                  quote.status === 'Declined' ? 'bg-red-500/10 text-red-400' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  {quote.status}
                </span>
                
                <select 
                  value={quote.status}
                  onChange={(e) => updateQuoteStatus(quote.id, e.target.value as QuoteStatus)}
                  className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500 min-h-[44px] max-w-[150px]"
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Declined">Declined</option>
                  <option value="Deposit Paid">Deposit Paid</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Final Invoice Sent">Final Inv Sent</option>
                  <option value="Fully Paid">Fully Paid</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => handleEdit(quote.id)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors" title="Edit Quote">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleEmail(quote)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors" title="Send via Email">
                  <Mail size={16} />
                </button>
                <button onClick={() => handleWhatsApp(quote)} className="p-2 bg-emerald-600/20 hover:bg-emerald-600/30 rounded-lg text-emerald-400 transition-colors" title="Send via WhatsApp">
                  <MessageCircle size={16} />
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm("Are you sure you want to permanently delete this quote?")) {
                      deleteQuote(quote.id);
                    }
                  }} 
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors" 
                  title="Delete Quote"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {quotes.length === 0 && (
          <div className="p-6 text-center text-slate-500">
            No quotes yet. Create one to get started.
          </div>
        )}
      </div>

      {showBuilder && <QuoteBuilder onClose={closeBuilder} editingQuoteId={editingQuoteId} />}
    </div>
  );
}
