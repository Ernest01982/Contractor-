import { useState } from 'react';
import { Plus, Camera, BarChart3, Clock, CheckCircle2, TrendingUp, CloudOff, Cloud, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { QuoteBuilder } from '../components/QuoteBuilder';

export function Dashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { quotes, expenses, pendingSyncs, isOffline } = useStore();
  const [showBuilder, setShowBuilder] = useState(false);

  const pendingDeposits = quotes
    .filter(q => q.status === 'Sent')
    .reduce((sum, q) => sum + q.total_amount, 0);

  const activeJobs = quotes.filter(q => q.status === 'Sent' || q.status === 'Paid');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Sync Status */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold text-slate-50">Dashboard</h2>
        <div className="flex items-center gap-2">
          {isOffline ? (
            <div className="flex items-center gap-1.5 text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full text-xs font-medium">
              <CloudOff size={14} /> Offline
            </div>
          ) : pendingSyncs.length > 0 ? (
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full text-xs font-medium">
              <Loader2 size={14} className="animate-spin" /> Syncing...
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500 bg-slate-800 px-2 py-1 rounded-full text-xs font-medium">
              <Cloud size={14} /> Cloud Synced
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Clock size={18} />
            <h2 className="text-sm font-medium">Pending (ZAR)</h2>
          </div>
          <p className="text-2xl font-bold text-slate-50">{formatCurrency(pendingDeposits)}</p>
        </div>
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <CheckCircle2 size={18} />
            <h2 className="text-sm font-medium">Active Jobs</h2>
          </div>
          <p className="text-2xl font-bold text-slate-50">{activeJobs.length}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider px-1">Quick Actions</h3>
        
        <button 
          onClick={() => setShowBuilder(true)}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white p-4 rounded-2xl font-semibold text-lg transition-colors min-h-[56px] shadow-lg shadow-emerald-900/20"
        >
          <Plus size={24} />
          New Quote
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => onNavigate('expenses')}
            className="flex flex-col items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 p-4 rounded-2xl font-medium transition-colors min-h-[88px] border border-slate-700"
          >
            <Camera size={28} className="text-slate-400" />
            Snap Receipt
          </button>
          <button 
            className="flex flex-col items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 p-4 rounded-2xl font-medium transition-colors min-h-[88px] border border-slate-700"
          >
            <BarChart3 size={28} className="text-slate-400" />
            Monthly Report
          </button>
        </div>
      </div>

      {/* Project Profitability */}
      {activeJobs.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex justify-between items-end px-1">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Project Profitability</h3>
            <TrendingUp size={16} className="text-slate-500" />
          </div>
          <div className="space-y-3">
            {activeJobs.map(job => {
              const linkedExpenses = expenses
                .filter(e => e.quote_id === job.id)
                .reduce((sum, e) => sum + e.total_amount, 0);
              const profit = job.total_amount - linkedExpenses;
              const spendPercentage = Math.min(100, (linkedExpenses / job.total_amount) * 100);
              
              return (
                <div key={job.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-slate-200">{job.client_name}</p>
                      <p className="text-xs text-slate-400">Quote: {formatCurrency(job.total_amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(profit)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">Est. Profit</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-400">Spent: {formatCurrency(linkedExpenses)}</span>
                      <span className="text-slate-400">{spendPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${spendPercentage > 80 ? 'bg-red-500' : spendPercentage > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${spendPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider px-1">Recent Quotes</h3>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          {quotes.slice(0, 3).map((quote, i) => (
            <div key={quote.id} className={`p-4 flex items-center justify-between ${i !== 0 ? 'border-t border-slate-700' : ''}`}>
              <div>
                <p className="font-medium text-slate-200">{quote.client_name}</p>
                <p className="text-sm text-slate-400">{new Date(quote.date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-50">{formatCurrency(quote.total_amount)}</p>
                <span className={`text-xs font-medium px-2 py-1 rounded-full inline-block mt-1 ${
                  quote.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' :
                  quote.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400' :
                  quote.status === 'Sent' ? 'bg-blue-500/10 text-blue-400' :
                  quote.status === 'Declined' ? 'bg-red-500/10 text-red-400' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  {quote.status}
                </span>
              </div>
            </div>
          ))}
          {quotes.length === 0 && (
            <div className="p-6 text-center text-slate-500">
              No quotes yet. Create one to get started.
            </div>
          )}
        </div>
      </div>

      {showBuilder && <QuoteBuilder onClose={() => setShowBuilder(false)} />}
    </div>
  );
}
