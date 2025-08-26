import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { 
  BookOpen, 
  Video, 
  FileText, 
  Download, 
  Search, 
  Filter,
  Star,
  Clock,
  Eye,
  Bookmark,
  Play,
  Users
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  type: 'book' | 'video' | 'document' | 'quiz' | 'tool';
  subject: string;
  description: string;
  rating: number;
  views: number;
  duration?: string;
  size?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  bookmarked: boolean;
}

export const Resources: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const resources: Resource[] = [
    {
      id: '1',
      title: 'Advanced Algebra Textbook',
      type: 'book',
      subject: 'Mathematics',
      description: 'Comprehensive guide to algebraic concepts and problem-solving techniques',
      rating: 4.8,
      views: 1250,
      difficulty: 'intermediate',
      bookmarked: true,
    },
    {
      id: '2',
      title: 'Photosynthesis Explained',
      type: 'video',
      subject: 'Science',
      description: 'Interactive video explaining the process of photosynthesis in plants',
      rating: 4.9,
      views: 890,
      duration: '15 min',
      difficulty: 'beginner',
      bookmarked: false,
    },
    {
      id: '3',
      title: 'Essay Writing Guide',
      type: 'document',
      subject: 'English',
      description: 'Step-by-step guide to writing compelling essays',
      rating: 4.6,
      views: 2100,
      size: '2.5 MB',
      difficulty: 'intermediate',
      bookmarked: true,
    },
    {
      id: '4',
      title: 'Chemistry Practice Quiz',
      type: 'quiz',
      subject: 'Science',
      description: 'Interactive quiz covering basic chemistry concepts',
      rating: 4.7,
      views: 650,
      difficulty: 'beginner',
      bookmarked: false,
    },
    {
      id: '5',
      title: 'Graphing Calculator Tool',
      type: 'tool',
      subject: 'Mathematics',
      description: 'Online graphing calculator for complex mathematical functions',
      rating: 4.9,
      views: 3200,
      difficulty: 'advanced',
      bookmarked: true,
    },
  ];

  const subjects = ['all', 'Mathematics', 'Science', 'English', 'History', 'Languages'];
  const types = ['all', 'book', 'video', 'document', 'quiz', 'tool'];

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'book':
        return BookOpen;
      case 'video':
        return Video;
      case 'document':
        return FileText;
      case 'quiz':
        return Users;
      case 'tool':
        return Star;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'book':
        return 'primary';
      case 'video':
        return 'accent';
      case 'document':
        return 'warning';
      case 'quiz':
        return 'success';
      case 'tool':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'secondary';
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || resource.subject === selectedSubject;
    const matchesType = selectedType === 'all' || resource.type === selectedType;
    
    return matchesSearch && matchesSubject && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Resource Library</h1>
          <p className="text-gray-600">Access textbooks, videos, documents, and interactive tools for your studies.</p>
        </div>
        <Button icon={Bookmark}>
          My Bookmarks
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {subjects.map(subject => (
                <option key={subject} value={subject}>
                  {subject === 'all' ? 'All Subjects' : subject}
                </option>
              ))}
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {types.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            
            <Button variant="ghost" icon={Filter}>
              More Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Resource Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => {
          const Icon = getResourceIcon(resource.type);
          const typeColor = getTypeColor(resource.type);
          const difficultyColor = getDifficultyColor(resource.difficulty);

          return (
            <Card key={resource.id} hover className="cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-${typeColor}-50 text-${typeColor}-600`}>
                  <Icon className="w-6 h-6" />
                </div>
                <button className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                  resource.bookmarked ? 'text-warning-500' : 'text-gray-400'
                }`}>
                  <Bookmark className="w-5 h-5" fill={resource.bookmarked ? 'currentColor' : 'none'} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{resource.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{resource.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={typeColor as any} size="sm">
                    {resource.type}
                  </Badge>
                  <Badge variant="secondary" size="sm">
                    {resource.subject}
                  </Badge>
                  <Badge variant={difficultyColor as any} size="sm">
                    {resource.difficulty}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span>{resource.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{resource.views}</span>
                    </div>
                  </div>
                  {resource.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{resource.duration}</span>
                    </div>
                  )}
                  {resource.size && (
                    <div className="flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      <span>{resource.size}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  {resource.type === 'video' ? (
                    <Button size="sm" icon={Play} className="flex-1">
                      Watch
                    </Button>
                  ) : resource.type === 'quiz' ? (
                    <Button size="sm" icon={Users} className="flex-1">
                      Take Quiz
                    </Button>
                  ) : (
                    <Button size="sm" icon={Eye} className="flex-1">
                      View
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" icon={Download}>
                    <span className="sr-only">Download</span>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredResources.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
          <Button variant="ghost">
            Clear Filters
          </Button>
        </Card>
      )}

      {/* Quick Access */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Math Formulas', icon: BookOpen, color: 'primary' },
            { label: 'Science Videos', icon: Video, color: 'accent' },
            { label: 'Writing Tools', icon: FileText, color: 'warning' },
            { label: 'Practice Tests', icon: Users, color: 'success' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`p-4 rounded-xl bg-${item.color}-50 text-${item.color}-600 hover:bg-${item.color}-100 transition-colors text-center`}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};