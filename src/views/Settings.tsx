import React, { useState } from 'react';
import { useStore, JobType } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { Save, LogOut, Upload, CheckCircle2, Link as LinkIcon, RefreshCw, AlertCircle, Copy, Trash2, ShieldCheck, WifiOff } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function Settings() {
  const { 
    profile, updateProfile, 
    bookkeeperToken, bookkeeperTokenExpiry, generateBookkeeperToken, revokeBookkeeperToken, 
    isSyncing, lastSyncError, syncFromSupabase, isOffline 
  } = useStore();
  
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [contractorName, setContractorName] = useState(profile?.contractor_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url || '');
  const [isVatRegistered, setIsVatRegistered] = useState(profile?.is_vat_registered || false);
  const [vatNumber, setVatNumber] = useState(profile?.vat_number || '');
  const [selectedServices, setSelectedServices] = useState<JobType[]>(profile?.services || []);
  const [defaultDeposit, setDefaultDeposit] = useState(profile?.default_deposit_pct || 50);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const availableServices: JobType[] = ['Painting', 'Tiling', 'Plumbing', 'Electrical', 'General'];

  const toggleService = (service: JobType) => {
    setSelectedServices(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    try {
      updateProfile({
        company_name: companyName, contractor_name: contractorName,
        phone, email, address, logo_url: logoUrl,
        is_vat_registered: isVatRegistered, vat_number: isVatRegistered ? vatNumber : '',
        services: selectedServices, default_deposit_pct: defaultDeposit
      });
      setSaveMessage('Profile saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Error saving profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => await supabase.auth.signOut();

  const handleGenerateBookkeeperLink = () => {
    const token = uuidv4();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    generateBookkeeperToken(token, expiry.toISOString());
  };

  const copyBookkeeperLink = () => {
    const link = `${window.location.origin}/?bookkeeper=${bookkeeperToken}`;
    navigator.clipboard.writeText(link);
    alert('Bookkeeper link copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm">Manage your business profile and app settings</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-medium transition-colors border border-red-100">
          <LogOut size={18} />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>

      {/* Bookkeeper Access & System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><ShieldCheck size={20} /></div>
            <div>
              <h3 className="font-bold text-slate-900">Bookkeeper Portal</h3>
              <p className="text-xs text-slate-500">Secure read-only access</p>
            </div>
          </div>
          
          {bookkeeperToken ? (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-slate-900 truncate max-w-[150px]">Link Active</p>
                  <p className="text-xs text-slate-500">Expires: {new Date(bookkeeperTokenExpiry!).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyBookkeeperLink} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><Copy size={18} /></button>
                  <button onClick={revokeBookkeeperToken} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={handleGenerateBookkeeperLink} className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
              <LinkIcon size={16} /> Generate Access Link
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isOffline ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {isOffline ? <WifiOff size={20} /> : <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Cloud Sync</h3>
              <p className="text-xs text-slate-500">{isOffline ? 'You are currently offline' : 'Connected to Supabase'}</p>
            </div>
          </div>
          
          <div className="space-y-2 pt-2">
            <button 
              onClick={() => syncFromSupabase()} 
              disabled={isOffline || isSyncing}
              className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 py-2.5 rounded-xl text-sm font-medium transition-colors border border-emerald-200"
            >
              {isSyncing ? 'Syncing Data...' : 'Force Sync Now'}
            </button>
            {lastSyncError && (
              <p className="text-xs text-red-500 flex items-start gap-1 mt-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{lastSyncError}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-8">
          
          {/* Business Details */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Business Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label><input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Contractor Name *</label><input type="text" required value={contractorName} onChange={e => setContractorName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label><input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500" /></div>
              <div className="sm:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Business Address *</label><input type="text" required value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500" /></div>
            </div>
          </section>

          {/* Branding & Tax */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Branding & Tax</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Company Logo</label>
              <div className="flex items-center gap-4">
                {logoUrl ? <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-lg border border-slate-200 bg-slate-50" /> : <div className="h-16 w-16 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400"><Upload size={24} /></div>}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" />
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={isVatRegistered} onChange={e => setIsVatRegistered(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" /><span className="font-medium text-slate-700">VAT Registered</span></label>
              {isVatRegistered && <div className="animate-in fade-in slide-in-from-top-2"><input type="text" value={vatNumber} onChange={e => setVatNumber(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500" placeholder="VAT Number" /></div>}
            </div>
          </section>

          {/* Services & Preferences */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Services & Preferences</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Your Services *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableServices.map(service => {
                  const isSelected = selectedServices.includes(service);
                  return (
                    <button key={service} type="button" onClick={() => toggleService(service)} className={`p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-between gap-2 ${isSelected ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'}`}>
                      {service}{isSelected && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="pt-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Default Deposit Requirement (%)</label>
              <div className="flex items-center gap-4">
                <input type="range" min="0" max="100" step="10" value={defaultDeposit} onChange={e => setDefaultDeposit(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                <span className="font-bold text-slate-700 w-12 text-right">{defaultDeposit}%</span>
              </div>
            </div>
          </section>
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm font-medium">{saveMessage && <span className={saveMessage.includes('Error') ? 'text-red-500' : 'text-emerald-600'}>{saveMessage}</span>}</div>
          <button type="submit" disabled={isSaving || selectedServices.length === 0} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm shadow-emerald-600/20">
            <Save size={18} />{isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
