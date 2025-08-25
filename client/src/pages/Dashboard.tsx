import React from 'react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { 
  BookOpen, 
  Calendar, 
  Heart, 
  Trophy, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const upcomingTasks = [
    { id: '1', title: 'Math Quiz - Algebra', due: 'Tomorrow', priority: 'high' },
    { id: '2', title: 'English Essay Draft', due: 'Friday', priority: 'medium' },
    { id: '3', title: 'Science Lab Report', due: 'Next Week', priority: 'low' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, Jane!</h1>
        <p className="text-gray-600">Here's what's happening with your studies today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Assignments Due"
          value={3}
          change="+1 from yesterday"
          changeType="neutral"
          icon={BookOpen}
          color="primary"
        />
        <StatsCard
          title="Upcoming Exams"
          value={2}
          change="Next: Math Quiz"
          changeType="neutral"
          icon={Calendar}
          color="warning"
        />
        <StatsCard
          title="Wellness Score"
          value="85%"
          change="+5% this week"
          changeType="positive"
          icon={Heart}
          color="accent"
        />
        <StatsCard
          title="Study Streak"
          value="12 days"
          change="New record!"
          changeType="positive"
          icon={Trophy}
          color="accent"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Subject Progress</h2>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View Details
              </button>
            </div>
            <div className="space-y-4">
              {[
                { subject: 'Mathematics', progress: 85, color: 'primary' },
                { subject: 'Science', progress: 92, color: 'accent' },
                { subject: 'English', progress: 78, color: 'warning' },
                { subject: 'History', progress: 88, color: 'success' },
              ].map((subject) => (
                <div key={subject.subject} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{subject.subject}</span>
                    <span className="text-sm text-gray-600">{subject.progress}%</span>
                  </div>
                  <ProgressBar 
                    progress={subject.progress} 
                    color={subject.color as any}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Upcoming Tasks */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h2>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View All
              </button>
            </div>
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    {task.priority === 'high' ? (
                      <AlertCircle className="w-5 h-5 text-error-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-600">Due {task.due}</p>
                    </div>
                  </div>
                  <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                    <CheckCircle className="w-5 h-5 text-gray-400 hover:text-success-500" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Activity Feed */}
        <div>
          <ActivityFeed />
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Submit Assignment', icon: BookOpen, color: 'primary' },
            { label: 'Schedule Study', icon: Calendar, color: 'accent' },
            { label: 'Mood Check-in', icon: Heart, color: 'warning' },
            { label: 'View Progress', icon: TrendingUp, color: 'success' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                className={`p-4 rounded-xl bg-${action.color}-50 text-${action.color}-600 hover:bg-${action.color}-100 transition-colors text-center`}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};