import React, { useState } from 'react';
import { useStore, JobType, QuoteItem } from '../store/useStore';
import { Hammer, Upload, Loader2, CheckCircle2 } from 'lucide-react';

export function OnboardingView({ onComplete }: { onComplete: () => void }) {
  const { updateProfile, profile } = useStore();
  const [loading, setLoading] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [contractorName, setContractorName] = useState(profile?.contractor_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url || '');
  const [isVatRegistered, setIsVatRegistered] = useState(profile?.is_vat_registered || false);
  const [vatNumber, setVatNumber] = useState(profile?.vat_number || '');
  const [selectedServices, setSelectedServices] = useState<JobType[]>(profile?.services || []);

  const availableServices: JobType[] = ['Painting', 'Tiling', 'Plumbing', 'Electrical', 'General'];

  const toggleService = (service: JobType) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      updateProfile({
        company_name: companyName,
        contractor_name: contractorName,
        phone,
        email,
        address,
        logo_url: logoUrl,
        is_vat_registered: isVatRegistered,
        vat_number: isVatRegistered ? vatNumber : '',
        services: selectedServices,
        default_deposit_pct: profile?.default_deposit_pct || 50
      });
      
      // Artificial delay for smooth UX
      setTimeout(() => {
        onComplete();
      }, 800);
    } catch (error) {
      console.error("Failed to save profile:", error);
      setLoading(false);
    }
  };

  const isFormValid = companyName && contractorName && phone && email && address && selectedServices.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col py-12 sm:px-6 lg:px-8 font-sans selection:bg-emerald-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center mb-4">
          <div className="bg-emerald-100 p-4 rounded-3xl shadow-sm border border-emerald-200/50">
            <Hammer className="text-emerald-600 h-10 w-10" />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to Contractor Pro
        </h2>
        <p className="mt-2 text-slate-500">
          Let's set up your business profile so your quotes look professional.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl animate-in fade-in zoom-in-95 duration-500 delay-150">
        <div className="bg-white py-8 px-4 shadow-2xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Required Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">1. Business Details</h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Company Name *</label>
                  <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-black focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Acme Construction" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Your Name *</label>
                  <input type="text" required value={contractorName} onChange={e => setContractorName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-black focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="John Doe" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-black focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="082 123 4567" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address *</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-black focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="john@acme.com" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Business Address *</label>
                <input type="text" required value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-black focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="123 Main St, City, 1000" />
              </div>
            </div>

            {/* Optional Information Section */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">2. Branding & Tax (Optional)</h3>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Company Logo</label>
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo preview" className="h-16 w-16 object-contain rounded-lg border border-slate-200 bg-slate-50" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                      <Upload size={24} />
                    </div>
                  )}
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors cursor-pointer" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={isVatRegistered} onChange={e => setIsVatRegistered(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">My business is VAT Registered</span>
                </label>
                
                {isVatRegistered && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <input type="text" value={vatNumber} onChange={e => setVatNumber(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-black focus:outline-none focus:ring-2 focus:ring-emerald-500 mt-2" placeholder="Enter VAT Number" />
                  </div>
                )}
              </div>
            </div>

            {/* Services Section */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex justify-between items-center">
                <span>3. Your Services *</span>
                <span className="text-xs font-normal text-slate-500">Select at least one</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {availableServices.map(service => {
                  const isSelected = selectedServices.includes(service);
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-between gap-2 ${
                        isSelected 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-slate-50'
                      }`}
                    >
                      {service}
                      {isSelected && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-emerald-600/20"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Complete Setup & Go to Dashboard'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
