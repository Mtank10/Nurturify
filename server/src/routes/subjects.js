import express from 'express';
import prisma from '../config/database.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, createSubjectSchema } from '../utils/validation.js';

const router = express.Router();

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 50,
      grade,
      category,
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let where = {};

    if (grade) where.grade = parseInt(grade);
    if (category) where.category = category;
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          classes: {
            include: {
              teacher: {
                select: {
                  firstName: true,
                  lastName: true
                }
              },
              _count: {
                select: {
                  studentClasses: true
                }
              }
            }
          },
          _count: {
            select: {
              classes: true
            }
          }
        },
        orderBy: [
          { grade: 'asc' },
          { name: 'asc' }
        ]
      }),
      prisma.subject.count({ where })
    ]);

    res.status(200).json({
      success: true,
      count: subjects.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: subjects
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get subject with student progress
// @route   GET /api/subjects/:id/progress
// @access  Private (Student)
router.get('/:id/progress', protect, authorize('student'), async (req, res, next) => {
  try {
    const subjectId = req.params.id;
    const studentId = req.user.student.id;

    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        classes: {
          where: {
            studentClasses: {
              some: {
                studentId,
                status: 'active'
              }
            }
          },
          include: {
            assignments: {
              include: {
                submissions: {
                  where: { studentId },
                  select: {
                    status: true,
                    marksObtained: true,
                    submittedAt: true
                  }
                }
              }
            }
          }
        },
        grades: {
          where: { studentId },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        studentProgress: {
          where: { studentId }
        }
      }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Calculate progress statistics
    const allAssignments = subject.classes.flatMap(cls => cls.assignments);
    const completedAssignments = allAssignments.filter(assignment => 
      assignment.submissions.length > 0 && assignment.submissions[0].status !== 'draft'
    );

    const totalMarks = subject.grades.reduce((sum, grade) => sum + parseFloat(grade.marksObtained), 0);
    const totalPossible = subject.grades.reduce((sum, grade) => sum + parseFloat(grade.totalMarks), 0);
    const averageGrade = totalPossible > 0 ? (totalMarks / totalPossible) * 100 : 0;

    const progressData = {
      subject,
      statistics: {
        totalAssignments: allAssignments.length,
        completedAssignments: completedAssignments.length,
        completionRate: allAssignments.length > 0 ? (completedAssignments.length / allAssignments.length) * 100 : 0,
        averageGrade: Math.round(averageGrade * 10) / 10,
        totalGrades: subject.grades.length
      }
    };

    res.status(200).json({
      success: true,
      data: progressData
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), validate(createSubjectSchema), async (req, res, next) => {
  try {
    const subject = await prisma.subject.create({
      data: req.body
    });

    res.status(201).json({
      success: true,
      data: subject
    });
  } catch (error) {
    next(error);
  }
});

export default router;