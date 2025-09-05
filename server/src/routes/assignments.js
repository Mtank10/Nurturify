import express from 'express';
import prisma from '../config/database.js';
import { protect, authorize, checkResourceOwnership } from '../middleware/auth.js';
import { validate, createAssignmentSchema, submitAssignmentSchema, gradeAssignmentSchema } from '../utils/validation.js';
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

// @desc    Get all assignments
// @route   GET /api/assignments
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      classId,
      type,
      status,
      dueDate
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let where = {};

    // Apply filters based on user role
    if (req.user.role === 'student') {
      // Students see assignments from their enrolled classes
      where.class = {
        studentClasses: {
          some: {
            studentId: req.user.student.id,
            status: 'active'
          }
        }
      };
    } else if (req.user.role === 'teacher') {
      // Teachers see assignments they created
      where.createdBy = req.user.id;
    }

    // Apply additional filters
    if (classId) where.classId = classId;
    if (type) where.type = type;
    
    if (status) {
      const now = new Date();
      switch (status) {
        case 'upcoming':
          where.dueDate = { gte: now };
          break;
        case 'overdue':
          where.dueDate = { lt: now };
          break;
        case 'due-today':
          const startOfDay = new Date(now.setHours(0, 0, 0, 0));
          const endOfDay = new Date(now.setHours(23, 59, 59, 999));
          where.dueDate = { gte: startOfDay, lte: endOfDay };
          break;
      }
    }

    if (dueDate) {
      where.dueDate = {
        gte: new Date(dueDate),
        lt: new Date(new Date(dueDate).getTime() + 24 * 60 * 60 * 1000)
      };
    }

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          class: {
            include: {
              subject: {
                select: {
                  name: true,
                  code: true,
                  colorCode: true
                }
              },
              teacher: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          creator: {
            select: {
              id: true
            }
          },
          submissions: req.user.role === 'student' ? {
            where: { studentId: req.user.student?.id },
            select: {
              id: true,
              status: true,
              submittedAt: true,
              marksObtained: true,
              isLate: true
            }
          } : {
            select: {
              id: true,
              status: true,
              student: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          _count: {
            submissions: true
          }
        },
        orderBy: { dueDate: 'asc' }
      }),
      prisma.assignment.count({ where })
    ]);

    // Add submission status for students
    const assignmentsWithStatus = assignments.map(assignment => {
      if (req.user.role === 'student') {
        const submission = assignment.submissions[0];
        return {
          ...assignment,
          submissionStatus: submission?.status || 'not-submitted',
          isSubmitted: !!submission,
          grade: submission?.marksObtained,
          isLate: submission?.isLate
        };
      }
      return assignment;
    });

    res.status(200).json({
      success: true,
      count: assignmentsWithStatus.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: assignmentsWithStatus
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single assignment
// @route   GET /api/assignments/:id
// @access  Private
router.get('/:id', protect, checkResourceOwnership('assignment'), async (req, res, next) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
      include: {
        class: {
          include: {
            subject: true,
            teacher: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        submissions: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                studentId: true
              }
            }
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // For students, only show their own submission
    if (req.user.role === 'student') {
      const userSubmission = assignment.submissions.find(
        sub => sub.studentId === req.user.student.id
      );
      assignment.submissions = userSubmission ? [userSubmission] : [];
      assignment.submissionStatus = userSubmission?.status || 'not-submitted';
      assignment.isSubmitted = !!userSubmission;
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
router.post('/', protect, authorize('teacher', 'admin'), upload.array('attachments', 5), validate(createAssignmentSchema), async (req, res, next) => {
  try {
    const {
      classId,
      title,
      description,
      type,
      dueDate,
      totalMarks,
      instructions,
      weight,
      allowLateSubmission,
      latePenalty
    } = req.body;

    // Verify class exists and teacher has access
    const classDoc = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        subject: true
      }
    });

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    if (req.user.role === 'teacher' && classDoc.teacherId !== req.user.teacher.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create assignments for this class'
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

    const assignment = await prisma.assignment.create({
      data: {
        classId,
        title,
        description,
        type,
        dueDate: new Date(dueDate),
        totalMarks: parseInt(totalMarks),
        instructions,
        attachments,
        createdBy: req.user.id,
        weight: weight ? parseFloat(weight) : 1.0,
        allowLateSubmission: allowLateSubmission !== undefined ? allowLateSubmission : true,
        latePenalty: latePenalty ? parseFloat(latePenalty) : 0.1
      },
      include: {
        class: {
          include: {
            subject: true,
            teacher: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

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
router.post('/:id/submit', protect, authorize('student'), upload.array('attachments', 5), validate(submitAssignmentSchema), async (req, res, next) => {
  try {
    const assignmentId = req.params.id;
    const studentId = req.user.student.id;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        class: {
          include: {
            studentClasses: {
              where: { studentId }
            }
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if student is enrolled in this class
    if (assignment.class.studentClasses.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this assignment'
      });
    }

    // Check if already submitted
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId
        }
      }
    });

    if (existingSubmission && existingSubmission.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Assignment already submitted'
      });
    }

    // Check if late submission is allowed
    const isLate = new Date() > assignment.dueDate;
    if (isLate && !assignment.allowLateSubmission) {
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

    const submissionData = {
      assignmentId,
      studentId,
      submissionText: req.body.submissionText,
      attachments,
      status: 'submitted',
      isLate,
      submittedAt: new Date()
    };

    let submission;
    if (existingSubmission) {
      // Update existing draft
      submission = await prisma.assignmentSubmission.update({
        where: { id: existingSubmission.id },
        data: submissionData
      });
    } else {
      // Create new submission
      submission = await prisma.assignmentSubmission.create({
        data: submissionData
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: submission
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Grade assignment submission
// @route   PUT /api/assignments/:id/grade/:studentId
// @access  Private (Teacher/Admin)
router.put('/:id/grade/:studentId', protect, authorize('teacher', 'admin'), validate(gradeAssignmentSchema), async (req, res, next) => {
  try {
    const assignmentId = req.params.id;
    const studentId = req.params.studentId;
    const { marksObtained, feedback } = req.body;

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if teacher owns this assignment
    if (req.user.role === 'teacher' && assignment.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to grade this assignment'
      });
    }

    const submission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId
        }
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Apply late penalty if applicable
    let finalMarks = marksObtained;
    if (submission.isLate && assignment.latePenalty > 0) {
      finalMarks = marksObtained * (1 - assignment.latePenalty);
    }

    // Update submission with grade
    const gradedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submission.id },
      data: {
        marksObtained: finalMarks,
        feedback,
        gradedBy: req.user.id,
        gradedAt: new Date(),
        status: 'graded'
      }
    });

    // Create grade record
    await prisma.grade.create({
      data: {
        studentId,
        subjectId: assignment.class.subjectId,
        classId: assignment.classId,
        assignmentId,
        gradeType: assignment.type,
        marksObtained: finalMarks,
        totalMarks: assignment.totalMarks,
        term: 'term1', // You might want to make this dynamic
        academicYear: new Date().getFullYear().toString(),
        recordedBy: req.user.id,
        comments: feedback
      }
    });

    res.status(200).json({
      success: true,
      message: 'Assignment graded successfully',
      data: gradedSubmission
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
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if teacher owns this assignment
    if (req.user.role === 'teacher' && assignment.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this assignment'
      });
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined
      },
      include: {
        class: {
          include: {
            subject: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedAssignment
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
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if teacher owns this assignment
    if (req.user.role === 'teacher' && assignment.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this assignment'
      });
    }

    await prisma.assignment.delete({
      where: { id: req.params.id }
    });

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;