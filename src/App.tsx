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

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const { setOfflineStatus, isAuthenticated } = useStore();

  // Simple routing based on URL params
  const searchParams = new URLSearchParams(window.location.search);
  const quoteId = searchParams.get('quoteId');
  const isSuccess = searchParams.get('success') === 'true';
  const bookkeeperToken = searchParams.get('bookkeeper');

  useEffect(() => {
    const handleOnline = () => setOfflineStatus(false);
    const handleOffline = () => setOfflineStatus(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus]);

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

  // Render Landing Page if not authenticated
  if (!isAuthenticated) {
    return <LandingPage />;
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
