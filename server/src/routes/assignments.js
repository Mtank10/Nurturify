import express from 'express';
import Assignment from '../models/Assignment.js';
import Subject from '../models/Subject.js';
import { protect, authorize } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/assignments/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },
  fileFilter: function (req, file, cb) {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// @desc    Get all assignments for a user
// @route   GET /api/assignments
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      query.students = req.user.id;
    } else if (req.user.role === 'teacher') {
      query.teacher = req.user.id;
    }

    // Add filters
    if (req.query.subject) {
      query.subject = req.query.subject;
    }
    
    if (req.query.status) {
      const now = new Date();
      switch (req.query.status) {
        case 'upcoming':
          query.dueDate = { $gte: now };
          break;
        case 'overdue':
          query.dueDate = { $lt: now };
          break;
        case 'due-today':
          const startOfDay = new Date(now.setHours(0, 0, 0, 0));
          const endOfDay = new Date(now.setHours(23, 59, 59, 999));
          query.dueDate = { $gte: startOfDay, $lte: endOfDay };
          break;
      }
    }

    const assignments = await Assignment.find(query)
      .populate('subject', 'name color')
      .populate('teacher', 'firstName lastName')
      .sort({ dueDate: 1 });

    // For students, add submission status
    if (req.user.role === 'student') {
      const assignmentsWithStatus = assignments.map(assignment => {
        const submission = assignment.getSubmissionByStudent(req.user.id);
        return {
          ...assignment.toObject(),
          submissionStatus: submission ? submission.status : 'not-submitted',
          isSubmitted: !!submission,
          grade: submission?.grade,
          isLate: submission?.isLate
        };
      });
      
      return res.status(200).json({
        success: true,
        count: assignmentsWithStatus.length,
        data: assignmentsWithStatus
      });
    }

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('subject', 'name color')
      .populate('teacher', 'firstName lastName')
      .populate('submissions.student', 'firstName lastName');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if user has access to this assignment
    const hasAccess = 
      req.user.role === 'teacher' && assignment.teacher._id.toString() === req.user.id ||
      req.user.role === 'student' && assignment.students.includes(req.user.id) ||
      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this assignment'
      });
    }

    // For students, only show their own submission
    if (req.user.role === 'student') {
      const userSubmission = assignment.getSubmissionByStudent(req.user.id);
      const assignmentData = assignment.toObject();
      assignmentData.submissions = userSubmission ? [userSubmission] : [];
      assignmentData.submissionStatus = userSubmission ? userSubmission.status : 'not-submitted';
      assignmentData.isSubmitted = !!userSubmission;
      
      return res.status(200).json({
        success: true,
        data: assignmentData
      });
    }

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private (Teacher/Admin)
router.post('/', protect, authorize('teacher', 'admin'), upload.array('attachments', 5), async (req, res, next) => {
  try {
    const {
      title,
      description,
      subject,
      students,
      dueDate,
      priority,
      type,
      maxPoints,
      instructions,
      rubric,
      settings
    } = req.body;

    // Verify subject exists and teacher has access
    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    if (req.user.role === 'teacher' && subjectDoc.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create assignments for this subject'
      });
    }

    // Process attachments
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    })) : [];

    const assignment = await Assignment.create({
      title,
      description,
      subject,
      teacher: req.user.id,
      students: students || subjectDoc.students,
      dueDate,
      priority,
      type,
      maxPoints,
      instructions,
      attachments,
      rubric: rubric ? JSON.parse(rubric) : [],
      settings: settings ? JSON.parse(settings) : {}
    });

    await assignment.populate('subject', 'name color');
    await assignment.populate('teacher', 'firstName lastName');

    // Update subject statistics
    subjectDoc.statistics.totalAssignments += 1;
    subjectDoc.statistics.lastUpdated = new Date();
    await subjectDoc.save();

    res.status(201).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Submit assignment
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
router.post('/:id/submit', protect, authorize('student'), upload.array('attachments', 5), async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if student is enrolled in this assignment
    if (!assignment.students.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this assignment'
      });
    }

    // Check if already submitted and multiple attempts not allowed
    const existingSubmission = assignment.getSubmissionByStudent(req.user.id);
    if (existingSubmission && !assignment.settings.multipleAttempts) {
      return res.status(400).json({
        success: false,
        message: 'Assignment already submitted'
      });
    }

    // Check if late submission is allowed
    const isLate = new Date() > assignment.dueDate;
    if (isLate && !assignment.settings.allowLateSubmissions) {
      return res.status(400).json({
        success: false,
        message: 'Late submissions are not allowed for this assignment'
      });
    }

    // Process attachments
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    })) : [];

    const submission = {
      student: req.user.id,
      content: req.body.content,
      attachments,
      isLate,
      submittedAt: new Date()
    };

    if (existingSubmission) {
      // Update existing submission
      const submissionIndex = assignment.submissions.findIndex(
        sub => sub.student.toString() === req.user.id
      );
      assignment.submissions[submissionIndex] = submission;
    } else {
      // Add new submission
      assignment.submissions.push(submission);
    }

    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully',
      submission
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Grade assignment submission
// @route   PUT /api/assignments/:id/grade/:studentId
// @access  Private (Teacher/Admin)
router.put('/:id/grade/:studentId', protect, authorize('teacher', 'admin'), async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if teacher owns this assignment
    if (req.user.role === 'teacher' && assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to grade this assignment'
      });
    }

    const submission = assignment.getSubmissionByStudent(req.params.studentId);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    const { points, feedback } = req.body;

    // Calculate percentage and letter grade
    const percentage = (points / assignment.maxPoints) * 100;
    let letterGrade = 'F';
    
    const subject = await Subject.findById(assignment.subject);
    if (subject && subject.grading.letterGrades) {
      for (const [letter, range] of Object.entries(subject.grading.letterGrades)) {
        if (percentage >= range.min && percentage <= range.max) {
          letterGrade = letter;
          break;
        }
      }
    }

    // Apply late penalty if applicable
    let finalPoints = points;
    if (submission.isLate && assignment.settings.latePenalty > 0) {
      finalPoints = points * (1 - assignment.settings.latePenalty / 100);
    }

    submission.grade = {
      points: finalPoints,
      percentage: (finalPoints / assignment.maxPoints) * 100,
      letterGrade,
      feedback,
      gradedAt: new Date(),
      gradedBy: req.user.id
    };
    submission.status = 'graded';

    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Assignment graded successfully',
      grade: submission.grade
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update assignment
// @route   PUT /api/assignments/:id
// @access  Private (Teacher/Admin)
router.put('/:id', protect, authorize('teacher', 'admin'), async (req, res, next) => {
  try {
    let assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if teacher owns this assignment
    if (req.user.role === 'teacher' && assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this assignment'
      });
    }

    assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('subject', 'name color').populate('teacher', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Teacher/Admin)
router.delete('/:id', protect, authorize('teacher', 'admin'), async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if teacher owns this assignment
    if (req.user.role === 'teacher' && assignment.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this assignment'
      });
    }

    await assignment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;