import React from 'react';
import { MoodTracker } from '../components/wellness/MoodTracker';
import { WellnessDashboard } from '../components/wellness/WellnessDashboard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Heart, Calendar, Phone, Users, BookOpen } from 'lucide-react';

export const Wellness: React.FC = () => {
  const upcomingAppointments = [
    {
      id: '1',
      type: 'Counseling Session',
      counselor: 'Dr. Sarah Johnson',
      date: 'Tomorrow',
      time: '2:00 PM',
    },
    {
      id: '2',
      type: 'Group Therapy',
      counselor: 'Team Session',
      date: 'Friday',
      time: '4:00 PM',
    },
  ];

  const mindfulnessActivities = [
    {
      id: '1',
      title: '5-Minute Morning Meditation',
      duration: '5 min',
      type: 'Breathing',
    },
    {
      id: '2',
      title: 'Study Break Relaxation',
      duration: '3 min',
      type: 'Mindfulness',
    },
    {
      id: '3',
      title: 'Evening Wind Down',
      duration: '10 min',
      type: 'Sleep',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mental Health & Wellness</h1>
          <p className="text-gray-600">Take care of your mental health and track your emotional well-being.</p>
        </div>
        <Button icon={Calendar} variant="primary">
          Book Counseling
        </Button>
      </div>

      {/* Emergency Support Banner */}
      <Card className="border-l-4 border-error-500 bg-error-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Phone className="w-6 h-6 text-error-600" />
            <div>
              <h3 className="font-semibold text-error-900">Need Immediate Help?</h3>
              <p className="text-sm text-error-700">Crisis support is available 24/7</p>
            </div>
          </div>
          <Button variant="danger" size="sm">
            Get Help Now
          </Button>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <WellnessDashboard />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Mood Tracker */}
          <MoodTracker />

          {/* Upcoming Appointments */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h3>
              <Button variant="ghost" size="sm" icon={Calendar}>
                Schedule
              </Button>
            </div>
            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="p-3 border border-gray-200 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{appointment.type}</h4>
                      <p className="text-sm text-gray-600">{appointment.counselor}</p>
                      <p className="text-sm text-gray-500">{appointment.date} at {appointment.time}</p>
                    </div>
                    <Heart className="w-5 h-5 text-accent-500" />
                  </div>
                </div>
              ))}
            </div>
            {upcomingAppointments.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No upcoming appointments</p>
                <Button variant="ghost" size="sm" className="mt-2">
                  Schedule a Session
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mindfulness Activities */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Mindfulness Center</h3>
            <Button variant="ghost" size="sm" icon={BookOpen}>
              All Activities
            </Button>
          </div>
          <div className="space-y-3">
            {mindfulnessActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                <div>
                  <h4 className="font-medium text-gray-900">{activity.title}</h4>
                  <p className="text-sm text-gray-600">{activity.type} • {activity.duration}</p>
                </div>
                <Button size="sm" variant="ghost">
                  Start
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Peer Support */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Peer Support</h3>
            <Button variant="ghost" size="sm" icon={Users}>
              Join Groups
            </Button>
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-accent-50 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-accent-600" />
                <h4 className="font-medium text-accent-900">Study Anxiety Support</h4>
              </div>
              <p className="text-sm text-accent-700 mb-3">Connect with students who understand exam stress</p>
              <Button size="sm" variant="secondary">
                Join Discussion
              </Button>
            </div>
            <div className="p-4 bg-primary-50 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Heart className="w-5 h-5 text-primary-600" />
                <h4 className="font-medium text-primary-900">Wellness Circle</h4>
              </div>
              <p className="text-sm text-primary-700 mb-3">Daily check-ins and mutual support</p>
              <Button size="sm" variant="secondary">
                Join Circle
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};