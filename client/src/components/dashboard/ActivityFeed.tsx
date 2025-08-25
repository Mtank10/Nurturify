import React from 'react';
import { Clock, CheckCircle, AlertTriangle, BookOpen, Heart } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface Activity {
  id: string;
  type: 'assignment' | 'wellness' | 'achievement' | 'reminder';
  title: string;
  description: string;
  timestamp: string;
  status?: 'completed' | 'pending' | 'overdue';
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'assignment',
    title: 'Math Assignment Submitted',
    description: 'Algebra worksheet completed and submitted',
    timestamp: '2 minutes ago',
    status: 'completed',
  },
  {
    id: '2',
    type: 'wellness',
    title: 'Daily Mood Check-in',
    description: 'Remember to log your mood for today',
    timestamp: '1 hour ago',
    status: 'pending',
  },
  {
    id: '3',
    type: 'achievement',
    title: 'Study Streak Achievement',
    description: '7-day study streak unlocked!',
    timestamp: '3 hours ago',
  },
  {
    id: '4',
    type: 'reminder',
    title: 'Science Class Tomorrow',
    description: 'Chemistry lab at 10:00 AM',
    timestamp: '1 day ago',
  },
];

export const ActivityFeed: React.FC = () => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return BookOpen;
      case 'wellness':
        return Heart;
      case 'achievement':
        return CheckCircle;
      case 'reminder':
        return Clock;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'primary';
      case 'wellness':
        return 'accent';
      case 'achievement':
        return 'success';
      case 'reminder':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type);
          const color = getActivityColor(activity.type);

          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-${color}-50 text-${color}-600 mt-1`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  {activity.status && (
                    <Badge
                      variant={activity.status === 'completed' ? 'success' : activity.status === 'overdue' ? 'error' : 'warning'}
                      size="sm"
                    >
                      {activity.status}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};