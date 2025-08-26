import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { Learning } from './pages/Learning';
import { Wellness } from './pages/Wellness';
import { Career } from './pages/Career';
import { Settings } from './pages/Settings';
import { Communication } from './pages/Communication';
import { Resources } from './pages/Resources';
import { Analytics } from './pages/Analytics';
import { Gamification } from './pages/Gamification';
import { AIAssistant } from './components/chat/AIAssistant';
import { Button } from './components/ui/Button';
import { Bot } from 'lucide-react';

function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isAIOpen, setIsAIOpen] = useState(false);

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
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeModule={activeModule} onModuleChange={setActiveModule} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>

      {/* Floating AI Assistant Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={() => setIsAIOpen(true)}
          icon={Bot}
          size="lg"
          className="rounded-full shadow-large hover:shadow-xl"
        >
          Ask AI
        </Button>
      </div>

      {/* AI Assistant Modal */}
      <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </div>
  );
}

export default App;