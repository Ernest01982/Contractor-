import { useState } from 'react';
import { useStore, QuoteStatus } from '../store/useStore';
import { Plus, Search, FileText, Edit2, MessageCircle, Mail, Trash2 } from 'lucide-react';
import { QuoteBuilder } from '../components/QuoteBuilder';

export function Quotes() {
  const { quotes, updateQuoteStatus, updateQuote, deleteQuote } = useStore();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | undefined>();
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Active' | 'Past'>('All');
  const [schedulingQuoteId, setSchedulingQuoteId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');

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

  const generateGoogleCalendarLink = (quote: any, dateString: string) => {
    const startDate = new Date(dateString);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hours default
    const formatForGCal = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const text = encodeURIComponent(`Contractor Work: ${quote.client_name}`);
    const details = encodeURIComponent(`Work starting for Quote #${quote.id.substring(0,8)}.\nView Quote: ${window.location.origin}/?quoteId=${quote.id}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${formatForGCal(startDate)}/${formatForGCal(endDate)}&details=${details}&sprop=&sprop=name:`;
  };

  const handleScheduleConfirm = () => {
    if (!schedulingQuoteId || !scheduleDate) return;
    const quote = quotes.find(q => q.id === schedulingQuoteId);
    if (!quote) return;

    const calendarLink = generateGoogleCalendarLink(quote, scheduleDate);
    const displayDate = new Date(scheduleDate).toLocaleString();
    let message = `Hi ${quote.client_name}, your job has been scheduled to start on ${displayDate}. Please click here to add it to your Google Calendar and set a reminder: ${calendarLink}`;
    
    let phone = quote.client_phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '27' + phone.substring(1);
    
    updateQuote(schedulingQuoteId, { status: 'Scheduled', scheduled_date: scheduleDate });
    setSchedulingQuoteId(null);
    setScheduleDate('');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const notifyClientStatusChange = (quoteId: string, newStatus: 'In Progress' | 'Finished') => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;
    
    const updates: any = { status: newStatus };
    if (newStatus === 'In Progress') updates.actual_start_date = new Date().toISOString();
    if (newStatus === 'Finished') updates.actual_finish_date = new Date().toISOString();
    
    updateQuote(quoteId, updates);
    
    let phone = quote.client_phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '27' + phone.substring(1);
    
    let message = '';
    if (newStatus === 'In Progress') {
      message = `Hi ${quote.client_name}, we are on-site and have officially started work on your project (Ref: #${quote.id.substring(0,8).toUpperCase()}).`;
    } else if (newStatus === 'Finished') {
      message = `Hi ${quote.client_name}, we have successfully finished the work for your project (Ref: #${quote.id.substring(0,8).toUpperCase()})!`;
    }
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
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
          if (filter === 'Active') return q.status === 'Deposit Paid' || q.status === 'Scheduled' || q.status === 'In Progress' || q.status === 'Finished';
          if (filter === 'Past') return q.status === 'Final Invoice Sent' || q.status === 'Fully Paid' || q.status === 'Declined' || q.status === 'Payment Failed';
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
            
            <div className="flex flex-col gap-3 pt-3 border-t border-slate-700/50">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    quote.status === 'Fully Paid' ? 'bg-emerald-500/10 text-emerald-500' :
                    quote.status === 'Deposit Paid' || quote.status === 'Scheduled' ? 'bg-emerald-500/10 text-emerald-400' :
                    quote.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400' :
                    quote.status === 'Finished' ? 'bg-indigo-500/10 text-indigo-400' :
                    quote.status === 'Accepted' ? 'bg-yellow-500/10 text-yellow-500' :
                    quote.status === 'Sent' || quote.status === 'Final Invoice Sent' ? 'bg-purple-500/10 text-purple-400' :
                    quote.status === 'Declined' || quote.status === 'Payment Failed' ? 'bg-red-500/10 text-red-400' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {quote.status}
                  </span>
                  
                  <div className="flex gap-2">
                    {quote.status === 'Deposit Paid' && (
                      <button onClick={() => setSchedulingQuoteId(quote.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                        Schedule Work
                      </button>
                    )}
                    {quote.status === 'Scheduled' && (
                      <>
                        <button onClick={() => notifyClientStatusChange(quote.id, 'In Progress')} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                          Start Work
                        </button>
                        <button onClick={() => setSchedulingQuoteId(quote.id)} className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                          Reschedule
                        </button>
                      </>
                    )}
                    {quote.status === 'In Progress' && (
                      <button onClick={() => notifyClientStatusChange(quote.id, 'Finished')} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                        Finish Work
                      </button>
                    )}
                    {quote.status === 'Finished' && (
                      <button onClick={() => {
                        updateQuoteStatus(quote.id, 'Final Invoice Sent');
                        handleWhatsApp({ ...quote, status: 'Final Invoice Sent' });
                      }} className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                        Send Final Invoice
                      </button>
                    )}
                  </div>
                </div>

                {schedulingQuoteId === quote.id && (
                  <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex flex-col gap-2">
                    <label className="text-xs text-slate-400 font-medium">Select Start Date & Time</label>
                    <input 
                      type="datetime-local" 
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex gap-2 mt-1">
                      <button onClick={handleScheduleConfirm} disabled={!scheduleDate} className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                        Confirm & Send
                      </button>
                      <button onClick={() => setSchedulingQuoteId(null)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold py-2 rounded-lg transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              
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
