export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  grade?: string;
  subjects?: string[];
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  description?: string;
  attachments?: string[];
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  progress: number;
  grade?: string;
  assignments: Assignment[];
  nextClass?: string;
}

export interface WellnessData {
  mood: number;
  stress: number;
  sleep: number;
  date: string;
  notes?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'academic' | 'wellness' | 'social' | 'system' | 'emergency';
  read: boolean;
  timestamp: string;
  actionUrl?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'image' | 'file';
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  category: 'academic' | 'personal' | 'career' | 'wellness';
  status: 'active' | 'completed' | 'paused';
}