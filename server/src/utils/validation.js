import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['student', 'teacher', 'parent', 'admin', 'counselor']),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// Student validation schemas
export const createStudentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required').max(50),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  grade: z.number().int().min(1).max(12),
  section: z.string().max(10).optional(),
  schoolId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  admissionDate: z.string().datetime().optional(),
  bloodGroup: z.string().max(5).optional(),
  address: z.string().optional(),
  emergencyContact: z.string().max(20).optional(),
  interests: z.array(z.string()).optional(),
  learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading_writing']).optional(),
});

// Assignment validation schemas
export const createAssignmentSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  type: z.enum(['homework', 'project', 'quiz', 'exam', 'presentation']),
  dueDate: z.string().datetime('Invalid due date'),
  totalMarks: z.number().int().min(1, 'Total marks must be at least 1'),
  instructions: z.string().optional(),
  weight: z.number().min(0).max(1).optional(),
  allowLateSubmission: z.boolean().optional(),
  latePenalty: z.number().min(0).max(1).optional(),
});

export const submitAssignmentSchema = z.object({
  submissionText: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

export const gradeAssignmentSchema = z.object({
  marksObtained: z.number().min(0, 'Marks cannot be negative'),
  feedback: z.string().optional(),
});

// Mental health validation schemas
export const mentalHealthRecordSchema = z.object({
  date: z.string().datetime(),
  moodRating: z.number().int().min(1).max(10).optional(),
  stressLevel: z.number().int().min(1).max(10).optional(),
  sleepHours: z.number().min(0).max(24).optional(),
  energyLevel: z.number().int().min(1).max(10).optional(),
  anxietyLevel: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(1000).optional(),
  triggers: z.array(z.string()).optional(),
  copingStrategiesUsed: z.array(z.string()).optional(),
});

// Message validation schemas
export const sendMessageSchema = z.object({
  conversationId: z.string().uuid('Invalid conversation ID'),
  content: z.string().min(1, 'Message content is required'),
  messageType: z.enum(['text', 'image', 'file', 'voice', 'video']).default('text'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  replyToMessageId: z.string().uuid().optional(),
});

export const createConversationSchema = z.object({
  type: z.enum(['direct', 'group', 'class', 'support']),
  title: z.string().max(255).optional(),
  description: z.string().optional(),
  participantIds: z.array(z.string().uuid()),
});

// Validation middleware
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
};