import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
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
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  type: {
    type: String,
    enum: ['homework', 'project', 'quiz', 'exam', 'presentation'],
    default: 'homework'
  },
  maxPoints: {
    type: Number,
    default: 100
  },
  instructions: {
    type: String,
    maxlength: [5000, 'Instructions cannot exceed 5000 characters']
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  rubric: [{
    criteria: String,
    points: Number,
    description: String
  }],
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    content: String,
    attachments: [{
      filename: String,
      originalName: String,
      mimetype: String,
      size: Number,
      path: String
    }],
    grade: {
      points: Number,
      percentage: Number,
      letterGrade: String,
      feedback: String,
      gradedAt: Date,
      gradedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    status: {
      type: String,
      enum: ['submitted', 'graded', 'returned'],
      default: 'submitted'
    },
    isLate: {
      type: Boolean,
      default: false
    }
  }],
  settings: {
    allowLateSubmissions: { type: Boolean, default: true },
    latePenalty: { type: Number, default: 0 },
    multipleAttempts: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1 },
    showGradeImmediately: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if assignment is overdue
assignmentSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate;
});

// Virtual for days until due
assignmentSchema.virtual('daysUntilDue').get(function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to get submission by student
assignmentSchema.methods.getSubmissionByStudent = function(studentId) {
  return this.submissions.find(sub => sub.student.toString() === studentId.toString());
};

// Method to calculate class average
assignmentSchema.methods.getClassAverage = function() {
  const gradedSubmissions = this.submissions.filter(sub => sub.grade && sub.grade.points !== undefined);
  if (gradedSubmissions.length === 0) return null;
  
  const total = gradedSubmissions.reduce((sum, sub) => sum + sub.grade.points, 0);
  return total / gradedSubmissions.length;
};

// Index for efficient queries
assignmentSchema.index({ subject: 1, dueDate: 1 });
assignmentSchema.index({ teacher: 1, createdAt: -1 });
assignmentSchema.index({ students: 1, dueDate: 1 });

export default mongoose.model('Assignment', assignmentSchema);