import { useState, useMemo, useRef, useEffect } from 'react';
import { useStore, JobType, QuoteItem, SurfaceType } from '../store/useStore';
import { Plus, Trash2, ChevronRight, ChevronLeft, Check, Save, Mic, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { parseVoiceToQuote } from '../services/gemini';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface QuoteBuilderProps {
  onClose: () => void;
  editingQuoteId?: string;
}

export function QuoteBuilder({ onClose, editingQuoteId }: QuoteBuilderProps) {
  const { quotes, addQuote, updateQuote, serviceLibrary, addServiceToLibrary, clients, addClient, updateClient } = useStore();
  const [step, setStep] = useState(1);
  
  // Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientVat, setClientVat] = useState('');
  const [saveClient, setSaveClient] = useState(true);

  const [items, setItems] = useState<QuoteItem[]>([]);
  const [hasVat, setHasVat] = useState(false);
  const [depositPercentage, setDepositPercentage] = useState(50);

  // Initialize if editing
  useEffect(() => {
    if (editingQuoteId) {
      const q = quotes.find(q => q.id === editingQuoteId);
      if (q) {
        setClientName(q.client_name);
        setClientPhone(q.client_phone);
        setClientEmail(q.client_email || '');
        setClientVat(q.client_vat_number || '');
        if (q.client_id) setSelectedClientId(q.client_id);
        
        setItems(q.items);
        setHasVat(q.has_vat);
        setDepositPercentage(q.deposit_percentage);
      }
    }
  }, [editingQuoteId, quotes]);

  // New Item State
  const [jobType, setJobType] = useState<JobType>('General');
  const [surfaceType, setSurfaceType] = useState<SurfaceType>('Wall');
  const [description, setDescription] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [rate, setRate] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [saveToLibrary, setSaveToLibrary] = useState(false);

  // Voice AI State
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [aiParsedItems, setAiParsedItems] = useState<any[]>([]);
  const recognitionRef = useRef<any>(null);

  // PDF State
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  // Calculations
  const currentItemSubtotal = useMemo(() => {
    if (jobType === 'Painting' || jobType === 'Tiling') {
      const l = parseFloat(length) || 0;
      const w = parseFloat(width) || 0;
      const h = parseFloat(height) || 0;
      const r = parseFloat(rate) || 0;
      const area = surfaceType === 'Wall' ? (l * h) : (l * w);
      return area * r;
    } else {
      const q = parseFloat(quantity) || 0;
      const p = parseFloat(unitPrice) || 0;
      return q * p;
    }
  }, [jobType, surfaceType, length, width, height, rate, quantity, unitPrice]);

  const quoteSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const vatAmount = hasVat ? quoteSubtotal * 0.15 : 0;
  const totalAmount = quoteSubtotal + vatAmount;
  const depositAmount = totalAmount * (depositPercentage / 100);

  const handleAddItem = () => {
    if (!description) return;

    const newItem: QuoteItem = {
      id: uuidv4(),
      job_type: jobType,
      description,
      subtotal: currentItemSubtotal
    };

    if (jobType === 'Painting' || jobType === 'Tiling') {
      newItem.surface_type = surfaceType;
      newItem.length = parseFloat(length) || 0;
      if (surfaceType === 'Wall') {
        newItem.height = parseFloat(height) || 0;
        newItem.sqm = newItem.length * newItem.height;
      } else {
        newItem.width = parseFloat(width) || 0;
        newItem.sqm = newItem.length * newItem.width;
      }
      newItem.rate = parseFloat(rate) || 0;
    } else {
      newItem.quantity = parseFloat(quantity) || 0;
      newItem.unit_price = parseFloat(unitPrice) || 0;
    }

    setItems([...items, newItem]);

    if (saveToLibrary) {
      addServiceToLibrary({
        job_type: jobType,
        description,
        rate: newItem.rate,
        unit_price: newItem.unit_price
      });
    }

    // Reset item form
    setDescription('');
    setLength('');
    setWidth('');
    setHeight('');
    setRate('');
    setQuantity('1');
    setUnitPrice('');
    setSurfaceType('Wall');
    setSaveToLibrary(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-ZA';

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsRecording(false);
      setIsProcessingVoice(true);
      
      try {
        const parsed = await parseVoiceToQuote(transcript);
        setAiParsedItems(parsed);
      } catch (error) {
        alert("Failed to parse voice input. Please try again.");
      } finally {
        setIsProcessingVoice(false);
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setIsProcessingVoice(false);
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const acceptAiItems = () => {
    const newItems = aiParsedItems.map(item => {
      const isArea = item.job_type === 'Painting' || item.job_type === 'Tiling';
      let subtotal = 0;
      let sqm = item.sqm || 0;
      
      if (isArea) {
        if (!sqm) {
          const l = item.length || 0;
          const w = item.width || 0;
          const h = item.height || 0;
          sqm = item.surface_type === 'Wall' ? (l * h) : (l * w);
        }
        subtotal = sqm * (item.rate || 0);
      } else {
        subtotal = (item.quantity || 1) * (item.unit_price || 0);
      }

      return {
        id: uuidv4(),
        job_type: item.job_type || 'General',
        surface_type: item.surface_type,
        description: item.description || 'Voice Item',
        length: item.length,
        width: item.width,
        height: item.height,
        sqm: sqm,
        rate: item.rate,
        quantity: item.quantity || 1,
        unit_price: item.unit_price,
        subtotal
      } as QuoteItem;
    });

    setItems([...items, ...newItems]);
    setAiParsedItems([]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const formatPhoneForSA = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '27' + cleaned.substring(1);
    } else if (!cleaned.startsWith('27')) {
      cleaned = '27' + cleaned;
    }
    return cleaned;
  };

  const handleFinalize = async () => {
    setIsGeneratingPDF(true);
    const quoteId = uuidv4();
    
    try {
      // 1. Generate PDF
      let pdfFile: File | null = null;
      if (invoiceRef.current) {
        const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        const pdfBlob = pdf.output('blob');
        pdfFile = new File([pdfBlob], `Quote_${clientName.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });
      }

      // 2. Format WhatsApp Message
      const companyName = "Contractor Pro";
      const jobTypes = Array.from(new Set(items.map(i => i.job_type))).join(', ');
      
      let message = `Hi ${clientName}, please find my professional quote attached for ${jobTypes}. Total: ${formatCurrency(totalAmount)}.\n\n`;
      
      // Construct public link
      const baseUrl = window.location.origin;
      const publicLink = `${baseUrl}/?quoteId=${quoteId}`;
      
      message += `View online and Pay Deposit here: ${publicLink}`;

      // 3. Share or Fallback
      if (navigator.canShare && navigator.canShare({ files: pdfFile ? [pdfFile] : [] })) {
        await navigator.share({
          files: pdfFile ? [pdfFile] : undefined,
          title: `Quote from ${companyName}`,
          text: message,
        });
      } else {
        // Fallback: Download PDF and open WhatsApp link
        if (pdfFile) {
          const url = URL.createObjectURL(pdfFile);
          const a = document.createElement('a');
          a.href = url;
          a.download = pdfFile.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }

        const encodedMessage = encodeURIComponent(message);
        const formattedPhone = formatPhoneForSA(clientPhone);
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
      }

      let activeClientId = selectedClientId;
      if (saveClient) {
        if (selectedClientId) {
          updateClient(selectedClientId, {
            name: clientName,
            phone: clientPhone,
            email: clientEmail,
            vat_number: clientVat
          });
        } else {
          const newClientId = uuidv4();
          addClient({
            name: clientName,
            phone: clientPhone,
            email: clientEmail,
            vat_number: clientVat
          });
          activeClientId = newClientId;
        }
      }

      // 4. Save Quote
      const quoteData = {
        client_id: activeClientId || undefined,
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        client_vat_number: clientVat,
        items,
        subtotal: quoteSubtotal,
        has_vat: hasVat,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        deposit_percentage: depositPercentage,
        deposit_amount: depositAmount,
      };

      if (editingQuoteId) {
        updateQuote(editingQuoteId, quoteData);
      } else {
        addQuote({
          ...quoteData,
          id: quoteId,
          status: 'Sent',
          date: new Date().toISOString()
        });
      }

      onClose();
    } catch (error) {
      console.error("Failed to generate or share PDF", error);
      alert("Failed to share quote. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleLibrarySelect = (desc: string) => {
    const service = serviceLibrary.find(s => s.description === desc);
    if (service) {
      setJobType(service.job_type);
      setDescription(service.description);
      if (service.rate) setRate(service.rate.toString());
      if (service.unit_price) setUnitPrice(service.unit_price.toString());
    } else {
      setDescription(desc);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-2 -ml-2">
          Cancel
        </button>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-1.5 w-8 rounded-full ${s <= step ? 'bg-emerald-500' : 'bg-slate-800'}`} />
          ))}
        </div>
        <div className="w-14" /> {/* Spacer for centering */}
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {/* Step 1: Client Details */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold text-slate-50 mb-2">Client Details</h2>
              <p className="text-slate-400 text-sm">Who is this quote for?</p>
            </div>
            
            <div className="space-y-4">
              {clients.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Select Existing Client</label>
                  <select 
                    value={selectedClientId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedClientId(id);
                      if (id) {
                        const c = clients.find(c => c.id === id);
                        if (c) {
                          setClientName(c.name);
                          setClientPhone(c.phone);
                          setClientEmail(c.email || '');
                          setClientVat(c.vat_number || '');
                        }
                      } else {
                        setClientName('');
                        setClientPhone('');
                        setClientEmail('');
                        setClientVat('');
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-50 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- New Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Client Name *</label>
                <input 
                  type="text" 
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-50 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. Acme Corp"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Client Phone (WhatsApp) *</label>
                <input 
                  type="tel" 
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-50 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. 082 123 4567"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-50 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">VAT Number</label>
                  <input 
                    type="text" 
                    value={clientVat}
                    onChange={e => setClientVat(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-50 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={saveClient}
                    onChange={e => setSaveClient(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-950"
                  />
                  Save/Update client in CRM
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Line Items */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-50 mb-2">Line Items</h2>
                <p className="text-slate-400 text-sm">Add services to this quote.</p>
              </div>
              <button 
                onClick={toggleRecording}
                disabled={isProcessingVoice}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm ${
                  isRecording 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' 
                    : isProcessingVoice
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {isProcessingVoice ? (
                  <><Loader2 size={16} className="animate-spin" /> Processing...</>
                ) : (
                  <><Mic size={16} /> {isRecording ? 'Listening...' : 'Voice Quote'}</>
                )}
              </button>
            </div>

            {aiParsedItems.length > 0 && (
              <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-4 mb-6">
                <h4 className="text-emerald-400 font-medium mb-3 flex items-center gap-2">
                  <Check size={18} /> Review AI Results
                </h4>
                <div className="space-y-3 mb-4">
                  {aiParsedItems.map((item, idx) => (
                    <div key={idx} className="bg-slate-900/50 rounded-xl p-3 border border-slate-800">
                      <p className="font-medium text-slate-200">{item.description}</p>
                      <p className="text-sm text-slate-400">
                        {item.job_type} • {item.sqm ? `${item.sqm} sqm` : `${item.quantity || 1} units`}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={acceptAiItems}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl font-medium transition-colors"
                  >
                    Add to Quote
                  </button>
                  <button 
                    onClick={() => setAiParsedItems([])}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-medium transition-colors"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* Added Items List */}
            {items.length > 0 && (
              <div className="space-y-3 mb-6">
                {items.map(item => (
                  <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-200">{item.description}</p>
                      <p className="text-sm text-slate-400">
                        {item.job_type === 'Painting' || item.job_type === 'Tiling' 
                          ? `${item.sqm} sqm ${item.surface_type ? `(${item.surface_type}) ` : ''}@ ${formatCurrency(item.rate || 0)}/sqm`
                          : `${item.quantity} x ${formatCurrency(item.unit_price || 0)}`
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold text-slate-50">{formatCurrency(item.subtotal)}</p>
                      <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-300 p-2 -mr-2">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center px-2 pt-2 border-t border-slate-800">
                  <span className="text-slate-400 font-medium">Subtotal</span>
                  <span className="text-lg font-bold text-slate-50">{formatCurrency(quoteSubtotal)}</span>
                </div>
              </div>
            )}

            {/* Add Item Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <Plus size={18} className="text-emerald-500" />
                Add New Item
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Job Type</label>
                <select 
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value as JobType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Painting">Painting</option>
                  <option value="Tiling">Tiling</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="General">General</option>
                </select>
              </div>

              {(jobType === 'Painting' || jobType === 'Tiling') && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Surface Type</label>
                  <select 
                    value={surfaceType}
                    onChange={(e) => setSurfaceType(e.target.value as SurfaceType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Wall">Wall</option>
                    <option value="Floor">Floor</option>
                    <option value="Ceiling/Roof">Ceiling/Roof</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Master Bedroom Walls"
                  list="service-library"
                />
                <datalist id="service-library">
                  {serviceLibrary.map(s => (
                    <option key={s.id} value={s.description} />
                  ))}
                </datalist>
              </div>

              {(jobType === 'Painting' || jobType === 'Tiling') ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Length (m)</label>
                    <input type="number" value={length} onChange={e => setLength(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:outline-none focus:border-emerald-500" placeholder="0" />
                  </div>
                  {surfaceType === 'Wall' ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Height (m)</label>
                      <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:outline-none focus:border-emerald-500" placeholder="0" />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1.5">Width (m)</label>
                      <input type="number" value={width} onChange={e => setWidth(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:outline-none focus:border-emerald-500" placeholder="0" />
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Rate per sqm (ZAR)</label>
                    <input type="number" value={rate} onChange={e => setRate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:outline-none focus:border-emerald-500" placeholder="0.00" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Quantity</label>
                    <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:outline-none focus:border-emerald-500" placeholder="1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Unit Price (ZAR)</label>
                    <input type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:outline-none focus:border-emerald-500" placeholder="0.00" />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={saveToLibrary}
                    onChange={e => setSaveToLibrary(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-950"
                  />
                  Save to Library
                </label>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Item Subtotal</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(currentItemSubtotal)}</span>
                </div>
              </div>

              <button 
                onClick={handleAddItem}
                disabled={!description || currentItemSubtotal === 0}
                className="w-full mt-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 p-3.5 rounded-xl font-medium transition-colors"
              >
                Add Item
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Financials */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold text-slate-50 mb-2">Financials</h2>
              <p className="text-slate-400 text-sm">Configure VAT and deposit requirements.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-200">Add 15% VAT</h3>
                  <p className="text-sm text-slate-400">Apply standard VAT rate</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={hasVat} onChange={e => setHasVat(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="border-t border-slate-800 pt-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Required Deposit (%)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" 
                    min="0" max="100" step="10"
                    value={depositPercentage}
                    onChange={e => setDepositPercentage(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="font-bold text-slate-200 w-12 text-right">{depositPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Live Summary */}
            <div className="bg-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{formatCurrency(quoteSubtotal)}</span>
              </div>
              {hasVat && (
                <div className="flex justify-between text-slate-400">
                  <span>VAT (15%)</span>
                  <span>{formatCurrency(vatAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-slate-50 pt-3 border-t border-slate-700">
                <span>Total</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-medium pt-1">
                <span>Required Deposit</span>
                <span>{formatCurrency(depositAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-20">
            <div>
              <h2 className="text-2xl font-bold text-slate-50 mb-2">Preview</h2>
              <p className="text-slate-400 text-sm">Review the digital invoice before saving.</p>
            </div>

            {/* Invoice Document */}
            <div 
              ref={invoiceRef} 
              className="rounded-xl p-6"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            >
              <div className="flex justify-between items-start mb-8 pb-6" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <div>
                  <h1 className="text-2xl font-bold uppercase tracking-tight" style={{ color: '#0f172a' }}>QUOTE</h1>
                  <p className="mt-1" style={{ color: '#64748b' }}>Date: {new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>Billed To</p>
                  <p className="font-bold text-lg" style={{ color: '#0f172a' }}>{clientName}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold" style={{ color: '#1e293b' }}>{item.description}</p>
                      <p className="text-sm" style={{ color: '#64748b' }}>
                        {item.job_type === 'Painting' || item.job_type === 'Tiling' 
                          ? `${item.sqm} sqm ${item.surface_type ? `(${item.surface_type}) ` : ''}@ ${formatCurrency(item.rate || 0)}/sqm`
                          : `${item.quantity} x ${formatCurrency(item.unit_price || 0)}`
                        }
                      </p>
                    </div>
                    <p className="font-medium" style={{ color: '#0f172a' }}>{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 space-y-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                <div className="flex justify-between" style={{ color: '#475569' }}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(quoteSubtotal)}</span>
                </div>
                {hasVat && (
                  <div className="flex justify-between" style={{ color: '#475569' }}>
                    <span>VAT (15%)</span>
                    <span>{formatCurrency(vatAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold pt-4 mt-2" style={{ borderTop: '1px solid #e2e8f0', color: '#0f172a' }}>
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <div className="mt-8 rounded-lg p-4" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <p className="text-sm uppercase tracking-wider font-medium mb-1" style={{ color: '#64748b' }}>Deposit Required</p>
                <p className="text-2xl font-bold" style={{ color: '#059669' }}>{formatCurrency(depositAmount)}</p>
                <p className="text-sm mt-1" style={{ color: '#64748b' }}>({depositPercentage}% of Total)</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="bg-slate-950 border-t border-slate-800 p-4 shrink-0 pb-safe">
        <div className="flex gap-3">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors min-h-[56px]"
            >
              <ChevronLeft size={20} />
              Back
            </button>
          )}
          
          {step < 4 ? (
            <button 
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !clientName || step === 2 && items.length === 0}
              className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors min-h-[56px]"
            >
              Next
              <ChevronRight size={20} />
            </button>
          ) : (
            <button 
              onClick={handleFinalize}
              disabled={isGeneratingPDF}
              className="flex-[2] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors min-h-[56px] shadow-lg shadow-emerald-900/20"
            >
              {isGeneratingPDF ? (
                <><Loader2 size={20} className="animate-spin" /> Generating PDF...</>
              ) : (
                <><Check size={20} /> Finalize & Push</>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
