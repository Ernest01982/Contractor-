import { useState, useRef, ChangeEvent } from 'react';
import { Camera, Upload, Receipt, Loader2, Check, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { parseReceiptImage } from '../services/gemini';

export function Expenses() {
  const { expenses, addExpense, quotes } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeQuotes = quotes.filter(q => q.status !== 'Fully Paid');

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const parsed = await parseReceiptImage(base64Data, file.type);
        setAiResult({ ...parsed, image_url: base64Data }); // Store image for preview
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert("Failed to process receipt. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveExpense = () => {
    if (!aiResult) return;
    
    addExpense({
      quote_id: selectedQuoteId || null,
      store_name: aiResult.store_name || 'Unknown Store',
      category: aiResult.category || 'Materials',
      date: aiResult.date || new Date().toISOString().split('T')[0],
      total_amount: aiResult.total_amount || 0,
      vat_amount: aiResult.vat_amount || 0,
      image_url: aiResult.image_url
    });
    
    setAiResult(null);
    setSelectedQuoteId('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Expenses</h1>
        <p className="text-slate-400 mt-1">Track material costs and receipts.</p>
      </header>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors shadow-lg shadow-emerald-900/20"
        >
          {isProcessing ? <Loader2 size={28} className="animate-spin" /> : <Camera size={28} />}
          <span className="font-semibold text-sm">Snap Receipt</span>
        </button>
        
        <button 
          onClick={() => {
            setAiResult({ store_name: '', category: 'Materials', total_amount: '', vat_amount: '', date: new Date().toISOString().split('T')[0] });
            setSelectedQuoteId('');
          }}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors border border-slate-700"
        >
          <Plus size={28} />
          <span className="font-semibold text-sm">Manual Entry</span>
        </button>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* AI Review Step */}
      {aiResult && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 mb-8 animate-in slide-in-from-bottom-4">
          <h3 className="text-emerald-400 font-semibold mb-4 flex items-center gap-2">
            {aiResult.image_url ? (
              <><Check size={18} /> Review Extracted Data</>
            ) : (
              <><Plus size={18} /> Enter Expense Details</>
            )}
          </h3>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Store Name</label>
              <input 
                type="text" 
                value={aiResult.store_name || ''} 
                onChange={e => setAiResult({...aiResult, store_name: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Expense Category</label>
              <select 
                value={aiResult.category || 'Materials'} 
                onChange={e => setAiResult({...aiResult, category: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200"
              >
                <option value="Materials">Materials & Supplies</option>
                <option value="Fuel">Fuel & Travel</option>
                <option value="Tools">Tools & Equipment</option>
                <option value="Subcontractors">Subcontractors</option>
                <option value="Stationery">Stationery & Office</option>
                <option value="Meals">Meals & Entertainment</option>
                <option value="Vehicle">Vehicle Maintenance</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Total Amount</label>
                <input 
                  type="number" 
                  value={aiResult.total_amount === '' ? '' : (aiResult.total_amount || '')} 
                  onChange={e => setAiResult({...aiResult, total_amount: e.target.value === '' ? '' : parseFloat(e.target.value)})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">VAT Included</label>
                <input 
                  type="number" 
                  value={aiResult.vat_amount === '' ? '' : (aiResult.vat_amount || '')} 
                  onChange={e => setAiResult({...aiResult, vat_amount: e.target.value === '' ? '' : parseFloat(e.target.value)})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
                <input 
                  type="date" 
                  value={aiResult.date || ''} 
                  onChange={e => setAiResult({...aiResult, date: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Link to Job (Optional)</label>
              <select 
                value={selectedQuoteId}
                onChange={e => setSelectedQuoteId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200"
              >
                <option value="">-- Select Active Job --</option>
                {activeQuotes.map(q => (
                  <option key={q.id} value={q.id}>{q.client_name} - {formatCurrency(q.total_amount)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleSaveExpense}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-medium transition-colors"
            >
              Save Expense
            </button>
            <button 
              onClick={() => setAiResult(null)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">Recent Expenses</h2>
        {expenses.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
            <Receipt className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <p className="text-slate-400 font-medium">No expenses yet</p>
            <p className="text-slate-500 text-sm mt-1">Snap a receipt to get started</p>
          </div>
        ) : (
          expenses.map(expense => (
            <div key={expense.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                  {expense.image_url ? (
                    <img src={expense.image_url} alt="Receipt" className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <Receipt className="text-slate-500" size={20} />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-200 line-clamp-1">{expense.store_name}</p>
                  <p className="text-sm text-slate-400 flex items-center gap-2">
                    <span>{expense.date}</span>
                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                    <span className="text-emerald-400 font-medium">{expense.category || 'Materials'}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-50">{formatCurrency(expense.total_amount)}</p>
                {expense.quote_id && (
                  <p className="text-xs text-emerald-400 mt-0.5">Linked to Job</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
