import React from 'react';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Heart, Moon, Activity, Brain } from 'lucide-react';

const wellnessMetrics = [
  {
    id: 'mood',
    label: 'Mood Score',
    value: 85,
    icon: Heart,
    color: 'accent' as const,
    description: 'Based on your daily check-ins',
  },
  {
    id: 'sleep',
    label: 'Sleep Quality',
    value: 78,
    icon: Moon,
    color: 'primary' as const,
    description: 'Average 7.5 hours per night',
  },
  {
    id: 'stress',
    label: 'Stress Level',
    value: 35,
    icon: Activity,
    color: 'warning' as const,
    description: 'Lower is better',
    inverted: true,
  },
  {
    id: 'focus',
    label: 'Focus Score',
    value: 92,
    icon: Brain,
    color: 'success' as const,
    description: 'Concentration during study',
  },
];

export const WellnessDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Wellness Overview</h2>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          View Detailed Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wellnessMetrics.map((metric) => {
          const Icon = metric.icon;
          const displayValue = metric.inverted ? 100 - metric.value : metric.value;
          
          return (
            <Card key={metric.id} className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl bg-${metric.color}-50 text-${metric.color}-600`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{metric.label}</h3>
                  <p className="text-sm text-gray-600">{metric.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">{displayValue}%</span>
                  <span className={`text-sm font-medium ${
                    displayValue >= 75 ? 'text-success-600' : 
                    displayValue >= 50 ? 'text-warning-600' : 
                    'text-error-600'
                  }`}>
                    {displayValue >= 75 ? 'Excellent' : displayValue >= 50 ? 'Good' : 'Needs Attention'}
                  </span>
                </div>
                <ProgressBar
                  progress={displayValue}
                  color={displayValue >= 75 ? 'success' : displayValue >= 50 ? 'warning' : 'error'}
                />
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Weekly Wellness Trend</h3>
        <div className="h-48 bg-gray-50 rounded-xl flex items-center justify-center">
          <p className="text-gray-600">Wellness trend chart would be displayed here</p>
        </div>
      </Card>
    </div>
  );
};