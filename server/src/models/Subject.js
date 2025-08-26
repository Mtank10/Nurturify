import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    maxlength: [100, 'Subject name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Subject code cannot exceed 10 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  color: {
    type: String,
    default: '#3B82F6',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  },
  grade: {
    type: String,
    required: [true, 'Grade level is required']
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
    },
    room: String
  }],
  curriculum: {
    objectives: [String],
    topics: [{
      name: String,
      description: String,
      order: Number,
      estimatedHours: Number,
      resources: [String]
    }],
    prerequisites: [String],
    assessmentMethods: [String]
  },
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['textbook', 'video', 'document', 'link', 'software']
    },
    url: String,
    description: String,
    isRequired: { type: Boolean, default: false }
  }],
  grading: {
    scale: {
      type: String,
      enum: ['percentage', 'points', 'letter'],
      default: 'percentage'
    },
    weights: {
      homework: { type: Number, default: 20 },
      quizzes: { type: Number, default: 20 },
      exams: { type: Number, default: 40 },
      projects: { type: Number, default: 20 }
    },
    letterGrades: {
      A: { min: 90, max: 100 },
      B: { min: 80, max: 89 },
      C: { min: 70, max: 79 },
      D: { min: 60, max: 69 },
      F: { min: 0, max: 59 }
    }
  },
  settings: {
    allowSelfEnrollment: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    maxStudents: { type: Number, default: 30 },
    announcements: { type: Boolean, default: true }
  },
  statistics: {
    totalAssignments: { type: Number, default: 0 },
    averageGrade: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for next class
subjectSchema.virtual('nextClass').get(function() {
  const now = new Date();
  const currentDay = now.toLocaleLowerCase().substring(0, 3);
  const currentTime = now.toTimeString().substring(0, 5);
  
  // Find next class in schedule
  const todayClasses = this.schedule.filter(s => s.day.startsWith(currentDay));
  const upcomingToday = todayClasses.find(s => s.startTime > currentTime);
  
  if (upcomingToday) {
    return {
      day: upcomingToday.day,
      time: upcomingToday.startTime,
      room: upcomingToday.room
    };
  }
  
  // Find next day's first class
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const currentDayIndex = days.indexOf(currentDay);
  
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDay = days[nextDayIndex];
    const nextDayClasses = this.schedule.filter(s => s.day === nextDay);
    
    if (nextDayClasses.length > 0) {
      const earliestClass = nextDayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
      return {
        day: earliestClass.day,
        time: earliestClass.startTime,
        room: earliestClass.room
      };
    }
  }
  
  return null;
});

// Method to calculate student progress
subjectSchema.methods.getStudentProgress = async function(studentId) {
  const Assignment = mongoose.model('Assignment');
  const assignments = await Assignment.find({ 
    subject: this._id, 
    students: studentId 
  });
  
  if (assignments.length === 0) return 0;
  
  const completedAssignments = assignments.filter(assignment => {
    const submission = assignment.getSubmissionByStudent(studentId);
    return submission && submission.status !== 'draft';
  });
  
  return Math.round((completedAssignments.length / assignments.length) * 100);
};

// Method to get student grade
subjectSchema.methods.getStudentGrade = async function(studentId) {
  const Assignment = mongoose.model('Assignment');
  const assignments = await Assignment.find({ 
    subject: this._id, 
    students: studentId 
  });
  
  const gradedSubmissions = [];
  assignments.forEach(assignment => {
    const submission = assignment.getSubmissionByStudent(studentId);
    if (submission && submission.grade && submission.grade.points !== undefined) {
      gradedSubmissions.push({
        points: submission.grade.points,
        maxPoints: assignment.maxPoints,
        type: assignment.type
      });
    }
  });
  
  if (gradedSubmissions.length === 0) return null;
  
  // Calculate weighted average based on assignment types
  let totalWeightedPoints = 0;
  let totalWeightedMax = 0;
  
  gradedSubmissions.forEach(submission => {
    const weight = this.grading.weights[submission.type] || 1;
    totalWeightedPoints += (submission.points / submission.maxPoints) * weight;
    totalWeightedMax += weight;
  });
  
  const percentage = (totalWeightedPoints / totalWeightedMax) * 100;
  
  // Convert to letter grade if needed
  if (this.grading.scale === 'letter') {
    for (const [letter, range] of Object.entries(this.grading.letterGrades)) {
      if (percentage >= range.min && percentage <= range.max) {
        return { percentage, letterGrade: letter };
      }
    }
  }
  
  return { percentage };
};

// Index for efficient queries
subjectSchema.index({ teacher: 1, grade: 1 });
subjectSchema.index({ students: 1 });
subjectSchema.index({ code: 1 }, { unique: true });

export default mongoose.model('Subject', subjectSchema);