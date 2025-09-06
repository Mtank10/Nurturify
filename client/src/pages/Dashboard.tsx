import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useStudentDashboard } from '../hooks/useApi';
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
  const { user } = useAuth();
  const { data: dashboardData, loading, error } = useStudentDashboard(
    user?.role === 'student' ? user.student?.id : ''
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  const upcomingAssignments = dashboardData?.upcomingAssignments || [];
  const recentGrades = dashboardData?.recentGrades || [];
  const subjectProgress = dashboardData?.subjectProgress || [];
  const statistics = dashboardData?.statistics || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.student?.firstName || user?.teacher?.firstName || 'User'}!
        </h1>
        <p className="text-gray-600">Here's what's happening with your studies today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Assignments Due"
          value={upcomingAssignments.length}
          change={`${upcomingAssignments.filter(a => new Date(a.dueDate) <= new Date(Date.now() + 24*60*60*1000)).length} due today`}
          changeType="neutral"
          icon={BookOpen}
          color="primary"
        />
        <StatsCard
          title="Upcoming Exams"
          value={upcomingAssignments.filter(a => a.type === 'exam').length}
          change={upcomingAssignments.find(a => a.type === 'exam')?.title || 'None scheduled'}
          changeType="neutral"
          icon={Calendar}
          color="warning"
        />
        <StatsCard
          title="Wellness Score"
          value={dashboardData?.recentWellness?.wellnessScore ? `${Math.round(dashboardData.recentWellness.wellnessScore)}%` : 'N/A'}
          change={dashboardData?.recentWellness ? 'Updated today' : 'No recent data'}
          changeType="positive"
          icon={Heart}
          color="accent"
        />
        <StatsCard
          title="Study Streak"
          value={`${statistics.studyStreak || 0} days`}
          change={statistics.studyStreak > 7 ? 'Great streak!' : 'Keep going!'}
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
              {subjectProgress.length > 0 ? subjectProgress.map((progress: any) => (
                <div key={progress.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{progress.subject?.name}</span>
                    <span className="text-sm text-gray-600">{Math.round(progress.progressPercentage || 0)}%</span>
                  </div>
                  <ProgressBar 
                    progress={progress.progressPercentage || 0} 
                    color={progress.progressPercentage >= 75 ? 'success' : progress.progressPercentage >= 50 ? 'warning' : 'error'}
                  />
                </div>
              )) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No progress data available</p>
                </div>
              )}
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
              {upcomingAssignments.slice(0, 5).map((assignment: any) => {
                const daysUntilDue = Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysUntilDue <= 1;
                
                return (
                <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    {isUrgent ? (
                      <AlertCircle className="w-5 h-5 text-error-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{assignment.title}</p>
                      <p className="text-sm text-gray-600">
                        Due {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                    <CheckCircle className="w-5 h-5 text-gray-400 hover:text-success-500" />
                  </button>
                </div>
              )})}
              {upcomingAssignments.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-success-500 mx-auto mb-3" />
                  <p className="text-gray-600">No upcoming assignments!</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Activity Feed */}
        <div>
          <ActivityFeed recentGrades={recentGrades} />
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