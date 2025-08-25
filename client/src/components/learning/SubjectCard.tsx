import React from 'react';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { Clock, FileText } from 'lucide-react';
import { Subject } from '../../types';

interface SubjectCardProps {
  subject: Subject;
  onClick?: () => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onClick }) => {
  return (
    <Card hover onClick={onClick} className="cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: subject.color }}
          />
          <h3 className="font-semibold text-gray-900">{subject.name}</h3>
        </div>
        {subject.grade && (
          <Badge variant="success" size="sm">
            {subject.grade}
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium text-gray-900">{subject.progress}%</span>
          </div>
          <ProgressBar 
            progress={subject.progress} 
            color={subject.progress >= 75 ? 'success' : subject.progress >= 50 ? 'warning' : 'error'}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>{subject.assignments.length} assignments</span>
          </div>
          {subject.nextClass && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{subject.nextClass}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};