import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import Header from './components/Header';
import AdminDashboard from './components/AdminDashboard';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('app');
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Track user session on app load
  useEffect(() => {
    const trackSession = async () => {
      try {
        const response = await fetch('/api/track-session', {
          method: 'POST',
        });
        if (response.ok) {
          const data = await response.json();
          setSessionId(data.sessionId);
        }
      } catch (error) {
        console.error('Failed to track session:', error);
      }
    };

    trackSession();
  }, []);

  // Update activity periodically
  useEffect(() => {
    if (!sessionId) return;

    const updateActivity = async () => {
      try {
        await fetch('/api/update-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId })
        });
      } catch (error) {
        console.error('Failed to update activity:', error);
      }
    };

    const interval = setInterval(updateActivity, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [sessionId]);

  // Check URL for admin route
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('app');
    }
  }, []);

  // Handle navigation
  const navigateToAdmin = () => {
    setCurrentPage('admin');
    window.history.pushState({}, '', '/admin');
  };

  const navigateToApp = () => {
    setCurrentPage('app');
    window.history.pushState({}, '', '/');
  };

  if (currentPage === 'admin') {
    return <AdminDashboard />;
  }

  return (
    <div className="flex flex-col h-screen font-sans bg-slate-50 text-slate-800">
      <Header onAdminClick={navigateToAdmin} />
      <main className="flex-1 overflow-hidden">
        <ChatInterface />
      </main>
    </div>
  );
};

export default App;