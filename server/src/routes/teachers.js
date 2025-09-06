import express from 'express';
import prisma from '../config/database.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, createTeacherSchema } from '../utils/validation.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      department,
      schoolId,
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let where = {};

    if (department) where.department = department;
    if (schoolId) where.schoolId = schoolId;
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { teacherId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          user: {
            select: {
              email: true,
              phone: true,
              status: true,
              lastLogin: true
            }
          },
          school: {
            select: {
              name: true,
              code: true
            }
          },
          classes: {
            include: {
              subject: {
                select: {
                  name: true,
                  code: true
                }
              },
              _count: {
                select: {
                  studentClasses: true
                }
              }
            }
          }
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      }),
      prisma.teacher.count({ where })
    ]);

    res.status(200).json({
      success: true,
      count: teachers.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: teachers
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get teacher dashboard data
// @route   GET /api/teachers/dashboard
// @access  Private (Teacher)
router.get('/dashboard', protect, authorize('teacher'), async (req, res, next) => {
  try {
    const teacherId = req.user.teacher.id;

    // Get teacher's classes
    const classes = await prisma.class.findMany({
      where: { teacherId },
      include: {
        subject: true,
        studentClasses: {
          where: { status: 'active' },
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                studentId: true
              }
            }
          }
        },
        assignments: {
          take: 5,
          orderBy: { dueDate: 'desc' },
          include: {
            _count: {
              select: {
                submissions: true
              }
            }
          }
        }
      }
    });

    // Get recent assignments
    const recentAssignments = await prisma.assignment.findMany({
      where: { createdBy: req.user.id },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        class: {
          include: {
            subject: {
              select: {
                name: true,
                colorCode: true
              }
            }
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    // Get pending submissions to grade
    const pendingGrading = await prisma.assignmentSubmission.findMany({
      where: {
        assignment: {
          createdBy: req.user.id
        },
        status: 'submitted'
      },
      take: 10,
      include: {
        assignment: {
          select: {
            title: true,
            totalMarks: true
          }
        },
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentId: true
          }
        }
      },
      orderBy: { submittedAt: 'asc' }
    });

    // Calculate statistics
    const totalStudents = classes.reduce((sum, cls) => sum + cls.studentClasses.length, 0);
    const totalAssignments = recentAssignments.length;
    const pendingGradingCount = pendingGrading.length;

    res.status(200).json({
      success: true,
      data: {
        classes,
        recentAssignments,
        pendingGrading,
        statistics: {
          totalClasses: classes.length,
          totalStudents,
          totalAssignments,
          pendingGradingCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;