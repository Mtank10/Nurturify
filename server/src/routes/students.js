import express from 'express';
import prisma from '../config/database.js';
import { protect, authorize, checkResourceOwnership } from '../middleware/auth.js';
import { validate, createStudentSchema } from '../utils/validation.js';

const router = express.Router();

// @desc    Get all students
// @route   GET /api/students
// @access  Private (Teacher/Admin)
router.get('/', protect, authorize('teacher', 'admin', 'counselor'), async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      grade,
      section,
      schoolId,
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let where = {};

    // Apply filters
    if (grade) where.grade = parseInt(grade);
    if (section) where.section = section;
    if (schoolId) where.schoolId = schoolId;
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { studentId: { contains: search, mode: 'insensitive' } }
      ];
    }

    // If teacher, only show students in their classes
    if (req.user.role === 'teacher') {
      const teacherClasses = await prisma.class.findMany({
        where: { teacherId: req.user.teacher.id },
        select: { id: true }
      });

      const classIds = teacherClasses.map(c => c.id);
      
      where.studentClasses = {
        some: {
          classId: { in: classIds },
          status: 'active'
        }
      };
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
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
          parent: {
            select: {
              firstName: true,
              lastName: true,
              relationshipToStudent: true
            }
          },
          studentClasses: {
            where: { status: 'active' },
            include: {
              class: {
                include: {
                  subject: {
                    select: {
                      name: true,
                      code: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: [
          { grade: 'asc' },
          { section: 'asc' },
          { lastName: 'asc' }
        ]
      }),
      prisma.student.count({ where })
    ]);

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: students
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
router.get('/:id', protect, checkResourceOwnership('student'), async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            status: true,
            lastLogin: true,
            createdAt: true
          }
        },
        school: true,
        parent: true,
        studentClasses: {
          where: { status: 'active' },
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
        },
        grades: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            subject: {
              select: {
                name: true,
                code: true
              }
            },
            assignment: {
              select: {
                title: true,
                type: true
              }
            }
          }
        },
        mentalHealthRecords: {
          take: 5,
          orderBy: { date: 'desc' }
        },
        learningAnalytics: {
          take: 10,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new student
// @route   POST /api/students
// @access  Private (Admin)
router.post('/', protect, authorize('admin'), validate(createStudentSchema), async (req, res, next) => {
  try {
    const {
      email,
      password,
      studentId,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      grade,
      section,
      schoolId,
      parentId,
      admissionDate,
      bloodGroup,
      address,
      emergencyContact,
      interests,
      learningStyle
    } = req.body;

    // Check if student ID already exists
    const existingStudent = await prisma.student.findUnique({
      where: { studentId }
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student ID already exists'
      });
    }

    // Create user and student in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user account
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: await bcrypt.hash(password || 'defaultPassword123', 12),
          role: 'student'
        }
      });

      // Create student profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentId,
          firstName,
          lastName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender,
          grade,
          section,
          schoolId,
          parentId,
          admissionDate: admissionDate ? new Date(admissionDate) : null,
          bloodGroup,
          address,
          emergencyContact,
          interests,
          learningStyle
        },
        include: {
          user: {
            select: {
              email: true,
              role: true,
              status: true
            }
          }
        }
      });

      return student;
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
router.put('/:id', protect, checkResourceOwnership('student'), async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      grade,
      section,
      bloodGroup,
      address,
      emergencyContact,
      interests,
      learningStyle,
      profilePictureUrl
    } = req.body;

    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        grade,
        section,
        bloodGroup,
        address,
        emergencyContact,
        interests,
        learningStyle,
        profilePictureUrl
      },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            status: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: { user: true }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Delete user (cascade will delete student)
    await prisma.user.delete({
      where: { id: student.userId }
    });

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get student dashboard data
// @route   GET /api/students/:id/dashboard
// @access  Private
router.get('/:id/dashboard', protect, checkResourceOwnership('student'), async (req, res, next) => {
  try {
    const studentId = req.params.id;

    // Get upcoming assignments
    const upcomingAssignments = await prisma.assignment.findMany({
      where: {
        class: {
          studentClasses: {
            some: {
              studentId,
              status: 'active'
            }
          }
        },
        dueDate: {
          gte: new Date()
        }
      },
      take: 5,
      orderBy: { dueDate: 'asc' },
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
        submissions: {
          where: { studentId },
          select: {
            status: true,
            submittedAt: true
          }
        }
      }
    });

    // Get recent grades
    const recentGrades = await prisma.grade.findMany({
      where: { studentId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        subject: {
          select: {
            name: true,
            colorCode: true
          }
        },
        assignment: {
          select: {
            title: true,
            type: true
          }
        }
      }
    });

    // Get subject progress
    const subjectProgress = await prisma.studentProgress.findMany({
      where: { studentId },
      include: {
        subject: {
          select: {
            name: true,
            colorCode: true
          }
        }
      }
    });

    // Get recent mental health records
    const recentWellness = await prisma.mentalHealthRecord.findFirst({
      where: { studentId },
      orderBy: { date: 'desc' }
    });

    // Get learning analytics summary
    const learningStats = await prisma.learningAnalytic.groupBy({
      by: ['activityType'],
      where: {
        studentId,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      _count: {
        id: true
      },
      _avg: {
        performanceScore: true,
        engagementScore: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        upcomingAssignments,
        recentGrades,
        subjectProgress,
        recentWellness,
        learningStats
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Enroll student in class
// @route   POST /api/students/:id/enroll
// @access  Private (Teacher/Admin)
router.post('/:id/enroll', protect, authorize('teacher', 'admin'), async (req, res, next) => {
  try {
    const { classId } = req.body;
    const studentId = req.params.id;

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.studentClass.findUnique({
      where: {
        studentId_classId: {
          studentId,
          classId
        }
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this class'
      });
    }

    // Enroll student
    const enrollment = await prisma.studentClass.create({
      data: {
        studentId,
        classId
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
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
});

export default router;