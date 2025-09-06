import express from 'express';
import prisma from '../config/database.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate, createClassSchema } from '../utils/validation.js';

const router = express.Router();

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      grade,
      section,
      teacherId,
      subjectId
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let where = {};

    // Apply filters based on user role
    if (req.user.role === 'teacher') {
      where.teacherId = req.user.teacher.id;
    } else if (req.user.role === 'student') {
      where.studentClasses = {
        some: {
          studentId: req.user.student.id,
          status: 'active'
        }
      };
    }

    // Apply additional filters
    if (grade) where.grade = parseInt(grade);
    if (section) where.section = section;
    if (teacherId) where.teacherId = teacherId;
    if (subjectId) where.subjectId = subjectId;

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          subject: true,
          teacher: {
            select: {
              firstName: true,
              lastName: true,
              teacherId: true
            }
          },
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
            take: 3,
            orderBy: { dueDate: 'desc' },
            select: {
              id: true,
              title: true,
              dueDate: true,
              type: true
            }
          },
          _count: {
            select: {
              studentClasses: true,
              assignments: true
            }
          }
        },
        orderBy: [
          { grade: 'asc' },
          { section: 'asc' }
        ]
      }),
      prisma.class.count({ where })
    ]);

    res.status(200).json({
      success: true,
      count: classes.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: classes
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single class
// @route   GET /api/classes/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const classData = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: {
        subject: true,
        teacher: {
          select: {
            firstName: true,
            lastName: true,
            teacherId: true,
            qualifications: true,
            experienceYears: true
          }
        },
        studentClasses: {
          where: { status: 'active' },
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                studentId: true,
                grade: true,
                section: true
              }
            }
          }
        },
        assignments: {
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

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check access permissions
    const hasAccess = 
      req.user.role === 'admin' ||
      (req.user.role === 'teacher' && classData.teacherId === req.user.teacher.id) ||
      (req.user.role === 'student' && classData.studentClasses.some(sc => sc.studentId === req.user.student?.id));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this class'
      });
    }

    res.status(200).json({
      success: true,
      data: classData
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new class
// @route   POST /api/classes
// @access  Private (Teacher/Admin)
router.post('/', protect, authorize('teacher', 'admin'), validate(createClassSchema), async (req, res, next) => {
  try {
    const {
      subjectId,
      grade,
      section,
      schoolYear,
      schedule,
      roomNumber,
      maxStudents,
      description
    } = req.body;

    const teacherId = req.user.role === 'teacher' ? req.user.teacher.id : req.body.teacherId;

    const classData = await prisma.class.create({
      data: {
        teacherId,
        subjectId,
        grade: parseInt(grade),
        section,
        schoolYear,
        schedule,
        roomNumber,
        maxStudents: maxStudents ? parseInt(maxStudents) : 40,
        description
      },
      include: {
        subject: true,
        teacher: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: classData
    });
  } catch (error) {
    next(error);
  }
});

export default router;