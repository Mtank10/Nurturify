import React from 'react';
import { Search, Bell, MessageSquare, User } from 'lucide-react';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search assignments, resources, or ask AI..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={MessageSquare}>
            <span className="sr-only">Messages</span>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-error-500 rounded-full"></span>
          </Button>
          
          <Button variant="ghost" size="sm" icon={Bell}>
            <span className="sr-only">Notifications</span>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
          </Button>

          <div className="h-6 w-px bg-gray-300" />

          <Button variant="ghost" size="sm" icon={User}>
            Profile
          </Button>
        </div>
      </div>
    </header>
  );
};