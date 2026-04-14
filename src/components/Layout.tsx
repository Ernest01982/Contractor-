import { ReactNode } from 'react';
import { LayoutDashboard, FileText, Receipt, Settings as SettingsIcon, Wifi, WifiOff } from 'lucide-react';
import { useStore } from '../store/useStore';

interface LayoutProps {
  children: ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function Layout({ children, currentTab, onTabChange }: LayoutProps) {
  const isOffline = useStore(state => state.isOffline);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'quotes', label: 'Quotes', icon: FileText },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-50 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">Contractor Pro</h1>
        <div className="flex items-center gap-2 text-sm font-medium">
          {isOffline ? (
            <span className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
              <WifiOff size={14} />
              Offline
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <Wifi size={14} />
              Synced
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 min-h-[44px] min-w-[44px] transition-colors ${
                  isActive ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
