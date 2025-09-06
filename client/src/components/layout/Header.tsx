import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useApi';
import { Search, Bell, MessageSquare, User } from 'lucide-react';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { data: notificationsData } = useNotifications();
  
  const unreadCount = notificationsData?.unreadCount || 0;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
          <div className="relative">
            <Button variant="ghost" size="sm" icon={MessageSquare}>
              <span className="sr-only">Messages</span>
            </Button>
          </div>
          
          <div className="relative">
            <Button variant="ghost" size="sm" icon={Bell}>
              <span className="sr-only">Notifications</span>
            </Button>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>

          <div className="h-6 w-px bg-gray-300" />

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.student?.firstName || user?.teacher?.firstName || 'User'} {user?.student?.lastName || user?.teacher?.lastName || ''}
              </p>
              <p className="text-xs text-gray-600 capitalize">{user?.role}</p>
            </div>
            <div className="relative group">
              <button className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                {(user?.student?.firstName || user?.teacher?.firstName || 'U').charAt(0)}
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-large border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-3 border-b border-gray-100">
                  <p className="font-medium text-gray-900">
                    {user?.student?.firstName || user?.teacher?.firstName} {user?.student?.lastName || user?.teacher?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
                <div className="p-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                    Profile Settings
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                    Preferences
                  </button>
                  <hr className="my-2" />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-error-600 hover:bg-error-50 rounded-lg"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

{/* Old code for reference
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