import React from 'react';
import { Hop as Home, BookOpen, Heart, MessageSquare, User, CreditCard, Trophy, ChartBar as BarChart3 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface MobileNavigationProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeModule,
  onModuleChange
}) => {
  const { user } = useAuth();

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Home', icon: Home },
      { id: 'learning', label: 'Learning', icon: BookOpen },
    ];

    const roleSpecificItems = [];

    if (user?.role === 'student') {
      roleSpecificItems.push(
        { id: 'wellness', label: 'Wellness', icon: Heart },
        { id: 'gamification', label: 'Rewards', icon: Trophy },
        { id: 'payments', label: 'Payments', icon: CreditCard }
      );
    }

    if (user?.role === 'teacher') {
      roleSpecificItems.push(
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'communication', label: 'Messages', icon: MessageSquare }
      );
    }

    if (user?.role === 'parent') {
      roleSpecificItems.push(
        { id: 'wellness', label: 'Wellness', icon: Heart },
        { id: 'payments', label: 'Payments', icon: CreditCard }
      );
    }

    if (['admin', 'counselor'].includes(user?.role || '')) {
      roleSpecificItems.push(
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'communication', label: 'Messages', icon: MessageSquare },
        { id: 'payments', label: 'Payments', icon: CreditCard }
      );
    }

    // Always add settings at the end
    roleSpecificItems.push({ id: 'settings', label: 'Profile', icon: User });

    return [...baseItems, ...roleSpecificItems].slice(0, 5); // Limit to 5 items for mobile
  };

  const menuItems = getMenuItems();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50 md:hidden">
      <div className="flex justify-around">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};