import { User, Bell, Shield, Database, ChevronRight, Link as LinkIcon, Trash2, Copy, Check, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';

export function Settings() {
  const { bookkeeperToken, bookkeeperTokenExpiry, bookkeeperLastAccessed, generateBookkeeperToken, revokeBookkeeperToken, setAuthenticated } = useStore();
  const [copied, setCopied] = useState(false);

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
        { icon: User, label: 'Profile Information' },
        { icon: Bell, label: 'Notifications' },
        { icon: Shield, label: 'Security' },
      ]
    },
    {
      title: 'Data & Offline',
      items: [
        { icon: Database, label: 'Storage Usage', value: '2.4 MB' },
        { icon: Database, label: 'Force Sync Now' },
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
    </div>
  );
}
