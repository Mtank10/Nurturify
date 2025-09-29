import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { StripeProvider } from './contexts/StripeContext';
import { LoginForm } from './components/auth/LoginForm';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNavigation } from './components/layout/MobileNavigation';
import { Dashboard } from './pages/Dashboard';
import { Learning } from './pages/Learning';
import { Wellness } from './pages/Wellness';
import { Career } from './pages/Career';
import { Settings } from './pages/Settings';
import { Communication } from './pages/Communication';
import { Resources } from './pages/Resources';
import { Analytics } from './pages/Analytics';
import { Gamification } from './pages/Gamification';
import { Payments } from './pages/Payments';
import { AIAssistant } from './components/chat/AIAssistant';
import { Button } from './components/ui/Button';
import { Bot } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isAIOpen, setIsAIOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard />;
      case 'learning':
        return <Learning />;
      case 'wellness':
        return <Wellness />;
      case 'career':
        return <Career />;
      case 'settings':
        return <Settings />;
      case 'communication':
        return <Communication />;
      case 'resources':
        return <Resources />;
      case 'analytics':
        return <Analytics />;
      case 'gamification':
        return <Gamification />;
      case 'payments':
        return <Payments />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {activeModule.charAt(0).toUpperCase() + activeModule.slice(1)} Module
              </h2>
              <p className="text-gray-600">This module is under development</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation 
        activeModule={activeModule} 
        onModuleChange={setActiveModule} 
      />

      {/* Floating AI Assistant Button */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6">
        <Button
          onClick={() => setIsAIOpen(true)}
          icon={Bot}
          size="lg"
          className="rounded-full shadow-large hover:shadow-xl w-12 h-12 md:w-auto md:h-auto"
        >
          <span className="hidden md:inline">Ask AI</span>
        </Button>
      </div>

      {/* AI Assistant Modal */}
      <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </div>
  );
};

function App() {
  return (
    <StripeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </StripeProvider>
  );
}

export default App;