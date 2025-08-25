import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { 
  Compass, 
  User, 
  GraduationCap, 
  TrendingUp, 
  Users, 
  FileText,
  Star,
  MapPin,
  DollarSign,
  Clock
} from 'lucide-react';

export const Career: React.FC = () => {
  const careerRecommendations = [
    {
      id: '1',
      title: 'Software Engineer',
      match: 92,
      description: 'Design and develop software applications',
      skills: ['Problem Solving', 'Mathematics', 'Logical Thinking'],
      salary: '$70,000 - $120,000',
      demand: 'High',
    },
    {
      id: '2',
      title: 'Data Scientist',
      match: 88,
      description: 'Analyze complex data to help make business decisions',
      skills: ['Statistics', 'Programming', 'Critical Thinking'],
      salary: '$80,000 - $140,000',
      demand: 'Very High',
    },
    {
      id: '3',
      title: 'UX Designer',
      match: 84,
      description: 'Create user-friendly digital experiences',
      skills: ['Creativity', 'Empathy', 'Problem Solving'],
      salary: '$60,000 - $100,000',
      demand: 'High',
    },
  ];

  const collegeRecommendations = [
    {
      id: '1',
      name: 'MIT',
      location: 'Cambridge, MA',
      program: 'Computer Science',
      rating: 5,
      acceptance: '7%',
    },
    {
      id: '2',
      name: 'Stanford University',
      location: 'Stanford, CA',
      program: 'Engineering',
      rating: 5,
      acceptance: '4%',
    },
    {
      id: '3',
      name: 'Carnegie Mellon',
      location: 'Pittsburgh, PA',
      program: 'Computer Science',
      rating: 5,
      acceptance: '15%',
    },
  ];

  const skillsGap = [
    { skill: 'Programming', current: 75, target: 95 },
    { skill: 'Mathematics', current: 85, target: 90 },
    { skill: 'Communication', current: 60, target: 85 },
    { skill: 'Project Management', current: 40, target: 80 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Career Guidance</h1>
          <p className="text-gray-600">Discover your future career path and plan your academic journey.</p>
        </div>
        <Button icon={User}>
          Retake Assessment
        </Button>
      </div>

      {/* Assessment Status */}
      <Card className="bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Career Assessment Complete</h3>
              <p className="text-gray-600">Based on your interests, skills, and academic performance</p>
            </div>
          </div>
          <Badge variant="success" size="lg">
            98% Complete
          </Badge>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Career Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Career Recommendations</h2>
              <Button variant="ghost" size="sm">
                View All Careers
              </Button>
            </div>
            
            <div className="space-y-4">
              {careerRecommendations.map((career) => (
                <div key={career.id} className="p-5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{career.title}</h3>
                      <p className="text-gray-600 mb-3">{career.description}</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {career.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" size="sm">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600 mb-1">
                        {career.match}%
                      </div>
                      <div className="text-sm text-gray-500">Match</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span>{career.salary}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{career.demand} Demand</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button size="sm" variant="primary">
                      Learn More
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Skills Gap Analysis */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Skills Gap Analysis</h2>
              <Button variant="ghost" size="sm">
                Skill Development Plan
              </Button>
            </div>
            
            <div className="space-y-6">
              {skillsGap.map((skill) => (
                <div key={skill.skill}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{skill.skill}</span>
                    <span className="text-sm text-gray-600">
                      {skill.current}% → {skill.target}%
                    </span>
                  </div>
                  <div className="relative">
                    <ProgressBar progress={skill.current} color="primary" />
                    <div 
                      className="absolute top-0 w-1 h-3 bg-accent-500 rounded-full"
                      style={{ left: `${skill.target}%` }}
                      title={`Target: ${skill.target}%`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* College Recommendations */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">College Suggestions</h3>
              <GraduationCap className="w-5 h-5 text-primary-600" />
            </div>
            
            <div className="space-y-4">
              {collegeRecommendations.map((college) => (
                <div key={college.id} className="p-3 border border-gray-200 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{college.name}</h4>
                    <div className="flex">
                      {[...Array(college.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{college.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      <span>{college.program}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{college.acceptance} acceptance rate</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <Button variant="ghost" size="sm" className="w-full mt-4">
              Explore More Colleges
            </Button>
          </Card>

          {/* Mentorship */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Mentorship</h3>
              <Users className="w-5 h-5 text-accent-600" />
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-accent-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    JS
                  </div>
                  <div>
                    <p className="font-medium text-accent-900">John Smith</p>
                    <p className="text-sm text-accent-700">Software Engineer at Google</p>
                  </div>
                </div>
              </div>
              
              <Button variant="secondary" size="sm" className="w-full">
                Find a Mentor
              </Button>
            </div>
          </Card>

          {/* Next Steps */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                <span className="text-sm text-gray-900">Complete programming course</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Build a portfolio project</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Apply for internships</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};