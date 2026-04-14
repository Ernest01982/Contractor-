import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Download, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export function BookkeeperPortal({ token }: { token: string }) {
  const { bookkeeperToken, bookkeeperTokenExpiry, updateBookkeeperAccess, quotes, expenses } = useStore();
  const [isValid, setIsValid] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (
      bookkeeperToken === token &&
      bookkeeperTokenExpiry &&
      new Date(bookkeeperTokenExpiry) > new Date()
    ) {
      setIsValid(true);
      updateBookkeeperAccess(new Date().toISOString());
    } else {
      setIsValid(false);
    }
  }, [token, bookkeeperToken, bookkeeperTokenExpiry, updateBookkeeperAccess]);

  const handleDownload = () => {
    setIsGenerating(true);
    
    try {
      // 1. Filter Data
      const relevantQuotes = quotes.filter(q => q.status === 'Paid' || q.status === 'Sent');
      
      // 2. Prepare Revenue Sheet
      const revenueData = relevantQuotes.map(q => ({
        Date: new Date(q.date).toLocaleDateString(),
        'Client Name': q.client_name,
        'Job Description': q.items.map(i => i.description).join('; '),
        'Subtotal (ZAR)': q.subtotal,
        'VAT (15%)': q.has_vat ? q.vat_amount : 0,
        'Total (ZAR)': q.total_amount,
        'Deposit Paid': q.deposit_amount,
        Status: q.status,
        'Payfast Ref': q.status === 'Paid' ? `PF-${q.id.substring(0, 8).toUpperCase()}` : 'N/A'
      }));

      // 3. Prepare Expenses Sheet
      // In a real app, we might filter expenses by date range. Here we take all.
      const expensesData = expenses.map(e => ({
        Date: new Date(e.date).toLocaleDateString(),
        'Store Name': e.store_name,
        Category: 'Materials/Fuel', // Simplified category
        'Total (ZAR)': e.total_amount,
        'VAT Amount': e.vat_amount,
        'Receipt Link': e.image_url ? 'Attached' : 'N/A'
      }));

      // 4. Prepare Summary Sheet
      const totalIncome = relevantQuotes.reduce((sum, q) => sum + q.total_amount, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.total_amount, 0);
      const netProfit = totalIncome - totalExpenses;

      const summaryData = [
        { Metric: 'Total Income', 'Amount (ZAR)': totalIncome },
        { Metric: 'Total Expenses', 'Amount (ZAR)': totalExpenses },
        { Metric: 'Net Profit', 'Amount (ZAR)': netProfit }
      ];

      // 5. Create Workbook
      const wb = XLSX.utils.book_new();
      
      const wsRevenue = XLSX.utils.json_to_sheet(revenueData);
      const wsExpenses = XLSX.utils.json_to_sheet(expensesData);
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);

      XLSX.utils.book_append_sheet(wb, wsRevenue, "Revenue");
      XLSX.utils.book_append_sheet(wb, wsExpenses, "Expenses");
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

      // 6. Download
      const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      XLSX.writeFile(wb, `ContractorFlow_Report_${month.replace(' ', '_')}.xlsx`);
      
    } catch (error) {
      console.error("Failed to generate Excel", error);
      alert("Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isValid) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
            <AlertTriangle size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-50">Link Expired or Invalid</h1>
          <p className="text-slate-400">
            This magic link is no longer valid. Please request a new link from the contractor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto text-emerald-500 mb-2">
          <FileSpreadsheet size={40} />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-slate-50 mb-2">Contractor Pro</h1>
          <p className="text-slate-400">Bookkeeper Financial Report</p>
        </div>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-left space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <CheckCircle2 size={16} className="text-emerald-500" />
            Includes all Paid & Sent Quotes
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <CheckCircle2 size={16} className="text-emerald-500" />
            Includes all Logged Expenses
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <CheckCircle2 size={16} className="text-emerald-500" />
            Pre-formatted for Excel
          </div>
        </div>

        <button 
          onClick={handleDownload}
          disabled={isGenerating}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/20"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2 animate-pulse">
              Generating...
            </span>
          ) : (
            <>
              <Download size={20} />
              Download .xlsx Report
            </>
          )}
        </button>
        
        <p className="text-xs text-slate-500">
          This link is secure and will expire automatically.
        </p>
      </div>
    </div>
  );
}
