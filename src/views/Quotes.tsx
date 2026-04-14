import { useState } from 'react';
import { useStore, QuoteStatus } from '../store/useStore';
import { Plus, Search, FileText } from 'lucide-react';
import { QuoteBuilder } from '../components/QuoteBuilder';

export function Quotes() {
  const { quotes, updateQuoteStatus } = useStore();
  const [showBuilder, setShowBuilder] = useState(false);

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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
        <input 
          type="text" 
          placeholder="Search quotes..." 
          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 min-h-[44px]"
        />
      </div>

      <div className="space-y-3">
        {quotes.map(quote => (
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
            
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                quote.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' :
                quote.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400' :
                quote.status === 'Sent' ? 'bg-blue-500/10 text-blue-400' :
                quote.status === 'Declined' ? 'bg-red-500/10 text-red-400' :
                'bg-slate-700 text-slate-300'
              }`}>
                {quote.status}
              </span>
              
              <select 
                value={quote.status}
                onChange={(e) => updateQuoteStatus(quote.id, e.target.value as QuoteStatus)}
                className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500 min-h-[44px]"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Declined">Declined</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
        ))}
        {quotes.length === 0 && (
          <div className="p-6 text-center text-slate-500">
            No quotes yet. Create one to get started.
          </div>
        )}
      </div>

      {showBuilder && <QuoteBuilder onClose={() => setShowBuilder(false)} />}
    </div>
  );
}
