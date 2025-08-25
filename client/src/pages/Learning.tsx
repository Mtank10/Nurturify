import React from 'react';
import { SubjectCard } from '../components/learning/SubjectCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Plus, Calendar, FileText, Clock } from 'lucide-react';
import { Subject, Assignment } from '../types';

const subjects: Subject[] = [
  {
    id: '1',
    name: 'Mathematics',
    color: '#3B82F6',
    progress: 85,
    grade: 'A-',
    assignments: [],
    nextClass: 'Tomorrow 9:00 AM',
  },
  {
    id: '2',
    name: 'Science',
    color: '#10B981',
    progress: 92,
    grade: 'A',
    assignments: [],
    nextClass: 'Friday 2:00 PM',
  },
  {
    id: '3',
    name: 'English',
    color: '#F59E0B',
    progress: 78,
    grade: 'B+',
    assignments: [],
    nextClass: 'Monday 11:00 AM',
  },
  {
    id: '4',
    name: 'History',
    color: '#EF4444',
    progress: 88,
    grade: 'A-',
    assignments: [],
    nextClass: 'Wednesday 1:00 PM',
  },
];

const recentAssignments: Assignment[] = [
  {
    id: '1',
    title: 'Algebra Worksheet',
    subject: 'Mathematics',
    dueDate: '2024-01-15',
    priority: 'high',
    status: 'pending',
    description: 'Complete problems 1-20 on quadratic equations',
  },
  {
    id: '2',
    title: 'Essay on Climate Change',
    subject: 'English',
    dueDate: '2024-01-18',
    priority: 'medium',
    status: 'in-progress',
    description: '500-word essay on environmental impact',
  },
  {
    id: '3',
    title: 'Lab Report - Chemical Reactions',
    subject: 'Science',
    dueDate: '2024-01-20',
    priority: 'low',
    status: 'pending',
    description: 'Document findings from last week\'s experiment',
  },
];

export const Learning: React.FC = () => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'primary';
      case 'overdue':
        return 'error';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Learning Management</h1>
          <p className="text-gray-600">Track your subjects, assignments, and academic progress.</p>
        </div>
        <Button icon={Plus}>Add Assignment</Button>
      </div>

      {/* Subject Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Subjects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjects.map((subject) => (
            <SubjectCard key={subject.id} subject={subject} />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignments */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Assignments</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" icon={Calendar}>
                  Schedule
                </Button>
                <Button variant="ghost" size="sm" icon={FileText}>
                  All Assignments
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {recentAssignments.map((assignment) => (
                <div key={assignment.id} className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {assignment.subject}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Due {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getPriorityColor(assignment.priority) as any} size="sm">
                        {assignment.priority}
                      </Badge>
                      <Badge variant={getStatusColor(assignment.status) as any} size="sm">
                        {assignment.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" variant="ghost">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Study Calendar */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Calendar</h3>
            <div className="space-y-3">
              <div className="p-3 bg-primary-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                  <span className="font-medium text-primary-900">Math Quiz</span>
                </div>
                <p className="text-sm text-primary-700">Tomorrow at 10:00 AM</p>
              </div>
              <div className="p-3 bg-accent-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-accent-600 rounded-full"></div>
                  <span className="font-medium text-accent-900">Science Lab</span>
                </div>
                <p className="text-sm text-accent-700">Friday at 2:00 PM</p>
              </div>
              <div className="p-3 bg-warning-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-warning-600 rounded-full"></div>
                  <span className="font-medium text-warning-900">History Essay Due</span>
                </div>
                <p className="text-sm text-warning-700">Next Monday</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-4">
              View Full Calendar
            </Button>
          </Card>

          {/* Study Resources */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Resources</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="font-medium text-gray-900">Math Formula Sheet</div>
                <div className="text-sm text-gray-600">Algebra & Geometry</div>
              </button>
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="font-medium text-gray-900">Science Notes</div>
                <div className="text-sm text-gray-600">Chemistry Basics</div>
              </button>
              <button className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="font-medium text-gray-900">Writing Guide</div>
                <div className="text-sm text-gray-600">Essay Structure</div>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};