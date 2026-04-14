import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { Quotes } from './views/Quotes';
import { Expenses } from './views/Expenses';
import { Settings } from './views/Settings';
import { PublicQuoteView } from './views/PublicQuoteView';
import { PaymentSuccessView } from './views/PaymentSuccessView';
import { BookkeeperPortal } from './views/BookkeeperPortal';
import { LandingPage } from './views/LandingPage';
import { AuthView } from './views/AuthView';
import { supabase } from './lib/supabase';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const { setOfflineStatus, isAuthenticated, setAuthenticated, syncFromSupabase } = useStore();

  // Simple routing based on URL params
  const searchParams = new URLSearchParams(window.location.search);
  const quoteId = searchParams.get('quoteId');
  const isSuccess = searchParams.get('success') === 'true';
  const bookkeeperToken = searchParams.get('bookkeeper');

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
      if (session) {
        setAuthMode(null); // close auth view on success
        if (navigator.onLine) syncFromSupabase();
      }
    });

    const handleOnline = () => {
      setOfflineStatus(false);
      if (isAuthenticated) {
        syncFromSupabase();
      }
    };
    const handleOffline = () => setOfflineStatus(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync if online and authenticated
    if (navigator.onLine && isAuthenticated) {
      syncFromSupabase();
    }

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus, isAuthenticated, syncFromSupabase, setAuthenticated]);

  // Render public views if URL params are present
  if (bookkeeperToken) {
    return <BookkeeperPortal token={bookkeeperToken} />;
  }

  if (isSuccess && quoteId) {
    return <PaymentSuccessView quoteId={quoteId} />;
  }

  if (quoteId) {
    return <PublicQuoteView quoteId={quoteId} />;
  }

  // Render Landing Page or Auth if not authenticated
  if (!isAuthenticated) {
    if (authMode) {
      return <AuthView mode={authMode} onBack={() => setAuthMode(null)} />;
    }
    return <LandingPage onLogin={() => setAuthMode('login')} onSignUp={() => setAuthMode('signup')} />;
  }

  const renderTab = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentTab} />;
      case 'quotes': return <Quotes />;
      case 'expenses': return <Expenses />;
      case 'settings': return <Settings />;
      default: return <Dashboard onNavigate={setCurrentTab} />;
    }
  };

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
      {renderTab()}
    </Layout>
  );
}
