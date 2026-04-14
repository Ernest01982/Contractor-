import { User, Bell, Shield, Database, ChevronRight, Link as LinkIcon, Trash2, Copy, Check, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

export function Settings() {
  const { bookkeeperToken, bookkeeperTokenExpiry, bookkeeperLastAccessed, generateBookkeeperToken, revokeBookkeeperToken, setAuthenticated } = useStore();
  const [copied, setCopied] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleGenerateLink = () => {
    const token = uuidv4();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7); // 7 days from now
    generateBookkeeperToken(token, expiry.toISOString());
  };

  const handleCopyLink = () => {
    if (bookkeeperToken) {
      const url = `${window.location.origin}/?bookkeeper=${bookkeeperToken}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthenticated(false);
  };

  const isTokenValid = bookkeeperToken && bookkeeperTokenExpiry && new Date(bookkeeperTokenExpiry) > new Date();

  const settingGroups = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile Information', id: 'profile' },
        { icon: Bell, label: 'Notifications', id: 'notifications' },
        { icon: Shield, label: 'Security', id: 'security' },
      ]
    },
    {
      title: 'Data & Offline',
      items: [
        { icon: Database, label: 'Storage Usage', value: '2.4 MB', id: 'storage' },
        { icon: Database, label: 'Force Sync Now', id: 'sync' },
      ]
    }
  ];

  return (
    <div className="p-4 space-y-6 pb-24">
      <h2 className="text-xl font-bold text-slate-50">Settings</h2>
      
      {/* Bookkeeper Hub */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Bookkeeper Hub</h3>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-4">
          <p className="text-sm text-slate-300">
            Generate a secure, 7-day magic link for your bookkeeper to download an Excel report of all paid quotes and expenses.
          </p>
          
          {isTokenValid ? (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Active Link</span>
                  <span className="text-xs text-slate-500">Expires: {new Date(bookkeeperTokenExpiry!).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}/?bookkeeper=${bookkeeperToken}`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-400 focus:outline-none"
                  />
                  <button 
                    onClick={handleCopyLink}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
                  >
                    {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                  </button>
                </div>
                {bookkeeperLastAccessed && (
                  <p className="text-xs text-slate-500 mt-3">
                    Last accessed: {new Date(bookkeeperLastAccessed).toLocaleString()}
                  </p>
                )}
              </div>
              <button 
                onClick={revokeBookkeeperToken}
                className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl font-medium transition-colors"
              >
                <Trash2 size={18} />
                Revoke Link
              </button>
            </div>
          ) : (
            <button 
              onClick={handleGenerateLink}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-900/20"
            >
              <LinkIcon size={18} />
              Generate Magic Link
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {settingGroups.map((group, i) => (
          <div key={i} className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">{group.title}</h3>
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
              {group.items.map((item, j) => {
                const Icon = item.icon;
                return (
                  <button 
                    key={j}
                    onClick={() => setActiveModal(item.id)}
                    className={`w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 transition-colors min-h-[56px] ${
                      j !== 0 ? 'border-t border-slate-700' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 text-slate-200">
                      <Icon size={20} className="text-slate-400" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      {item.value && <span className="text-sm">{item.value}</span>}
                      <ChevronRight size={18} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-4 rounded-2xl font-bold transition-colors border border-red-500/20"
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </div>

      {/* Simple Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-50 mb-4 capitalize">
              {activeModal.replace('_', ' ')}
            </h3>
            
            {activeModal === 'profile' ? (
              <div className="space-y-4 py-4">
                <ProfileForm />
              </div>
            ) : (
              <div className="py-8 text-center">
                <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SettingsIcon className="text-emerald-500 animate-spin-slow" />
                </div>
                <p className="text-slate-400">
                  The <span className="text-slate-200 font-medium">{activeModal}</span> settings are currently being optimized for your account.
                </p>
              </div>
            )}
            
            {activeModal !== 'profile' && (
              <button 
                onClick={() => setActiveModal(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-xl font-bold transition-colors"
              >
                Close
              </button>
            )}
            {activeModal === 'profile' && (
              <button 
                onClick={() => setActiveModal(null)}
                className="w-full text-slate-500 py-2 text-sm font-medium mt-2"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileForm() {
  const { profile, updateProfile } = useStore();
  const [formData, setFormData] = useState({
    company_name: profile?.company_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    vat_number: profile?.vat_number || '',
    is_vat_registered: profile?.is_vat_registered || false,
    default_deposit_pct: profile?.default_deposit_pct || 50
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateProfile(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Company Name</label>
        <input 
          type="text" 
          value={formData.company_name}
          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-emerald-500" 
          placeholder="e.g. Acme Construction"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
          <input 
            type="email" 
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm" 
            placeholder="contact@company.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Phone</label>
          <input 
            type="tel" 
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-emerald-500 text-sm" 
            placeholder="+27..."
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
        <div className="space-y-0.5">
          <span className="text-sm font-medium text-slate-200">VAT Registered</span>
          <p className="text-[10px] text-slate-500 uppercase tracking-tight">Enable VAT calculations</p>
        </div>
        <button 
          onClick={() => setFormData({ ...formData, is_vat_registered: !formData.is_vat_registered })}
          className={`w-12 h-6 rounded-full transition-colors relative ${formData.is_vat_registered ? 'bg-emerald-600' : 'bg-slate-800'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_vat_registered ? 'left-7' : 'left-1'}`} />
        </button>
      </div>

      {formData.is_vat_registered && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">VAT Number</label>
          <input 
            type="text" 
            value={formData.vat_number}
            onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-emerald-500" 
            placeholder="Enter VAT ID"
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider">Default Deposit</label>
          <span className="text-emerald-400 font-bold">{formData.default_deposit_pct}%</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          step="5"
          value={formData.default_deposit_pct}
          onChange={(e) => setFormData({ ...formData, default_deposit_pct: parseInt(e.target.value) })}
          className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-600 border border-slate-800"
        />
      </div>

      <button 
        onClick={handleSave}
        className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
          saved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
        }`}
      >
        {saved ? (
          <>
            <Check size={20} />
            Saved!
          </>
        ) : (
          'Save Changes'
        )}
      </button>
    </div>
  );
}
