import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download,
  Filter,
  Target,
  Clock,
  Award,
  BookOpen,
  Heart,
  Users
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('month');

  const performanceData = [
    { subject: 'Mathematics', current: 85, previous: 78, trend: 'up' },
    { subject: 'Science', current: 92, previous: 89, trend: 'up' },
    { subject: 'English', current: 78, previous: 82, trend: 'down' },
    { subject: 'History', current: 88, previous: 85, trend: 'up' },
    { subject: 'Languages', current: 76, previous: 76, trend: 'stable' },
  ];

  const studyMetrics = [
    { label: 'Total Study Hours', value: '127h', change: '+12%', trend: 'up' },
    { label: 'Assignments Completed', value: '24', change: '+8%', trend: 'up' },
    { label: 'Average Grade', value: '84.2%', change: '+3.2%', trend: 'up' },
    { label: 'Study Streak', value: '15 days', change: '+5 days', trend: 'up' },
  ];

  const wellnessMetrics = [
    { label: 'Mood Score', value: 8.2, max: 10, color: 'accent' },
    { label: 'Stress Level', value: 3.5, max: 10, color: 'warning', inverted: true },
    { label: 'Sleep Quality', value: 7.8, max: 10, color: 'primary' },
    { label: 'Focus Score', value: 8.9, max: 10, color: 'success' },
  ];

  const goalProgress = [
    { goal: 'Improve Math Grade to A', progress: 75, target: 'End of Term' },
    { goal: 'Complete 50 Study Hours', progress: 68, target: 'This Month' },
    { goal: 'Read 5 Books', progress: 40, target: 'This Quarter' },
    { goal: 'Maintain 90% Attendance', progress: 95, target: 'This Year' },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return TrendingUp;
      case 'down':
        return TrendingDown;
      default:
        return BarChart3;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-success-600';
      case 'down':
        return 'text-error-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics & Progress</h1>
          <p className="text-gray-600">Track your academic performance and personal growth over time.</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <Button variant="ghost" icon={Filter}>
            Filters
          </Button>
          <Button icon={Download}>
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {studyMetrics.map((metric) => {
          const TrendIcon = getTrendIcon(metric.trend);
          return (
            <Card key={metric.label}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                </div>
                <div className={`p-2 rounded-lg bg-${metric.trend === 'up' ? 'success' : 'error'}-50`}>
                  <TrendIcon className={`w-5 h-5 ${getTrendColor(metric.trend)}`} />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                  {metric.change}
                </span>
                <span className="text-sm text-gray-500">vs last {timeRange}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Academic Performance */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Academic Performance</h2>
              <Button variant="ghost" size="sm" icon={BarChart3}>
                View Details
              </Button>
            </div>
            
            <div className="space-y-4">
              {performanceData.map((subject) => {
                const TrendIcon = getTrendIcon(subject.trend);
                const change = subject.current - subject.previous;
                
                return (
                  <div key={subject.subject} className="p-4 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{subject.subject}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">{subject.current}%</span>
                        <div className={`flex items-center gap-1 ${getTrendColor(subject.trend)}`}>
                          <TrendIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {change > 0 ? '+' : ''}{change}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <ProgressBar 
                      progress={subject.current} 
                      color={subject.current >= 85 ? 'success' : subject.current >= 70 ? 'warning' : 'error'}
                    />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Study Time Analysis */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Study Time Analysis</h2>
              <Button variant="ghost" size="sm" icon={Clock}>
                Time Tracker
              </Button>
            </div>
            
            <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Study time chart would be displayed here</p>
                <p className="text-sm text-gray-500">Showing daily/weekly study patterns</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary-600">4.2h</p>
                <p className="text-sm text-gray-600">Daily Average</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent-600">29h</p>
                <p className="text-sm text-gray-600">This Week</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning-600">127h</p>
                <p className="text-sm text-gray-600">This Month</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Analytics */}
        <div className="space-y-6">
          {/* Wellness Metrics */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Wellness Overview</h3>
              <Heart className="w-5 h-5 text-accent-600" />
            </div>
            
            <div className="space-y-4">
              {wellnessMetrics.map((metric) => {
                const percentage = (metric.value / metric.max) * 100;
                const displayValue = metric.inverted ? metric.max - metric.value : metric.value;
                const displayPercentage = metric.inverted ? 100 - percentage : percentage;
                
                return (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                      <span className="text-sm font-bold text-gray-900">
                        {displayValue.toFixed(1)}/{metric.max}
                      </span>
                    </div>
                    <ProgressBar 
                      progress={displayPercentage} 
                      color={metric.color as any}
                    />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Goal Progress */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Goal Progress</h3>
              <Target className="w-5 h-5 text-primary-600" />
            </div>
            
            <div className="space-y-4">
              {goalProgress.map((goal, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900 flex-1">{goal.goal}</h4>
                    <span className="text-sm font-bold text-primary-600">{goal.progress}%</span>
                  </div>
                  <ProgressBar 
                    progress={goal.progress} 
                    color={goal.progress >= 75 ? 'success' : goal.progress >= 50 ? 'warning' : 'primary'}
                    size="sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Target: {goal.target}</p>
                </div>
              ))}
            </div>
            
            <Button variant="ghost" size="sm" className="w-full mt-4">
              Set New Goal
            </Button>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Achievements</h3>
              <Award className="w-5 h-5 text-warning-500" />
            </div>
            
            <div className="space-y-3">
              {[
                { title: '7-Day Study Streak', date: '2 days ago', icon: BookOpen },
                { title: 'Math Quiz Perfect Score', date: '1 week ago', icon: Target },
                { title: 'Wellness Champion', date: '2 weeks ago', icon: Heart },
              ].map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-warning-50 rounded-xl">
                    <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center">
                      <Icon className="w-4 h-4 text-warning-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-warning-900">{achievement.title}</p>
                      <p className="text-xs text-warning-700">{achievement.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <Button variant="ghost" size="sm" className="w-full mt-4">
              View All Achievements
            </Button>
          </Card>
        </div>
      </div>

      {/* Comparative Analysis */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Comparative Analysis</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" size="sm">
              Grade 10 Average
            </Badge>
            <Button variant="ghost" size="sm" icon={Users}>
              Peer Comparison
            </Button>
          </div>
        </div>
        
        <div className="h-48 bg-gray-50 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Comparative performance chart would be displayed here</p>
            <p className="text-sm text-gray-500">Your performance vs class average</p>
          </div>
        </div>
      </Card>
    </div>
  );
};