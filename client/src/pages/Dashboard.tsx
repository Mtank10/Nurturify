import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { StatsCard } from '../components/dashboard/StatsCard';
import { Card } from '../components/ui/Card';
import {
  BookOpen,
  Users,
  GraduationCap,
  TrendingUp,
  Heart,
  Trophy,
  Calendar,
  CheckCircle,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalSubjects: 0,
    totalAssignments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const [studentsCount, subjectsCount, classesCount, assignmentsCount] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase.from('classes').select('id', { count: 'exact', head: true }),
        supabase.from('assignments').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalStudents: studentsCount.count || 0,
        totalSubjects: subjectsCount.count || 0,
        totalClasses: classesCount.count || 0,
        totalAssignments: assignmentsCount.count || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getUserName = () => {
    if (user?.student) return `${user.student.first_name} ${user.student.last_name}`;
    if (user?.teacher) return `${user.teacher.first_name} ${user.teacher.last_name}`;
    if (user?.parent) return `${user.parent.first_name} ${user.parent.last_name}`;
    return user?.email || 'User';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {getUserName()}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of your educational platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Students"
          value={stats.totalStudents}
          change={`${user?.role === 'student' ? 'You are enrolled' : 'Registered students'}`}
          changeType="neutral"
          icon={Users}
          color="primary"
        />
        <StatsCard
          title="Total Subjects"
          value={stats.totalSubjects}
          change="Available courses"
          changeType="neutral"
          icon={BookOpen}
          color="accent"
        />
        <StatsCard
          title="Active Classes"
          value={stats.totalClasses}
          change="Running sessions"
          changeType="neutral"
          icon={GraduationCap}
          color="success"
        />
        <StatsCard
          title="Assignments"
          value={stats.totalAssignments}
          change="Total assignments"
          changeType="neutral"
          icon={CheckCircle}
          color="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-primary-50 rounded-xl">
              <GraduationCap className="w-5 h-5 text-primary-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Explore Subjects</h3>
                <p className="text-sm text-gray-600">
                  Browse available subjects and start your learning journey
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-accent-50 rounded-xl">
              <Heart className="w-5 h-5 text-accent-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Track Wellness</h3>
                <p className="text-sm text-gray-600">
                  Monitor your mental health and well-being daily
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-success-50 rounded-xl">
              <Trophy className="w-5 h-5 text-success-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Earn Achievements</h3>
                <p className="text-sm text-gray-600">
                  Complete tasks and challenges to level up
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Role</span>
              <span className="font-medium text-gray-900 capitalize">{user?.role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800">
                {user?.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Profile Completed</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user?.profile_completed
                  ? 'bg-success-100 text-success-800'
                  : 'bg-warning-100 text-warning-800'
              }`}>
                {user?.profile_completed ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Learning', icon: BookOpen, color: 'primary' },
            { label: 'Wellness', icon: Heart, color: 'accent' },
            { label: 'Schedule', icon: Calendar, color: 'warning' },
            { label: 'Progress', icon: TrendingUp, color: 'success' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-center"
              >
                <Icon className="w-6 h-6 mx-auto mb-2 text-gray-700" />
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
