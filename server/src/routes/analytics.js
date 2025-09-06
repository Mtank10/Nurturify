import express from 'express';
import prisma from '../config/database.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get student analytics dashboard
// @route   GET /api/analytics/student/:studentId
// @access  Private
router.get('/student/:studentId', protect, async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { timeRange = 'month' } = req.query;

    // Check access permissions
    const hasAccess = 
      req.user.role === 'admin' ||
      (req.user.role === 'student' && req.user.student?.id === studentId) ||
      (req.user.role === 'teacher') ||
      (req.user.role === 'parent' && req.user.parent?.students?.some(s => s.id === studentId));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this data'
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get academic performance
    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        createdAt: { gte: startDate }
      },
      include: {
        subject: {
          select: {
            name: true,
            colorCode: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get learning analytics
    const learningAnalytics = await prisma.learningAnalytic.findMany({
      where: {
        studentId,
        timestamp: { gte: startDate }
      },
      include: {
        subject: {
          select: {
            name: true
          }
        }
      }
    });

    // Get assignment completion stats
    const assignments = await prisma.assignment.findMany({
      where: {
        class: {
          studentClasses: {
            some: {
              studentId,
              status: 'active'
            }
          }
        },
        createdAt: { gte: startDate }
      },
      include: {
        submissions: {
          where: { studentId },
          select: {
            status: true,
            marksObtained: true,
            submittedAt: true,
            isLate: true
          }
        },
        class: {
          include: {
            subject: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    // Calculate performance metrics
    const subjectPerformance = {};
    grades.forEach(grade => {
      const subjectName = grade.subject.name;
      if (!subjectPerformance[subjectName]) {
        subjectPerformance[subjectName] = {
          totalMarks: 0,
          obtainedMarks: 0,
          count: 0,
          colorCode: grade.subject.colorCode
        };
      }
      subjectPerformance[subjectName].totalMarks += parseFloat(grade.totalMarks);
      subjectPerformance[subjectName].obtainedMarks += parseFloat(grade.marksObtained);
      subjectPerformance[subjectName].count++;
    });

    const performanceData = Object.entries(subjectPerformance).map(([subject, data]) => ({
      subject,
      percentage: data.totalMarks > 0 ? Math.round((data.obtainedMarks / data.totalMarks) * 100) : 0,
      colorCode: data.colorCode,
      totalAssessments: data.count
    }));

    // Calculate study metrics
    const totalStudyTime = learningAnalytics
      .filter(la => la.activityType === 'study_session')
      .reduce((sum, la) => sum + (la.durationMinutes || 0), 0);

    const completedAssignments = assignments.filter(a => 
      a.submissions.length > 0 && a.submissions[0].status !== 'draft'
    ).length;

    const averageGrade = grades.length > 0 
      ? grades.reduce((sum, g) => sum + (parseFloat(g.marksObtained) / parseFloat(g.totalMarks)) * 100, 0) / grades.length
      : 0;

    // Calculate streaks (simplified)
    const studyStreak = await calculateStudyStreak(studentId);

    const analytics = {
      performanceData,
      studyMetrics: {
        totalStudyHours: Math.round(totalStudyTime / 60 * 10) / 10,
        completedAssignments,
        averageGrade: Math.round(averageGrade * 10) / 10,
        studyStreak
      },
      learningAnalytics: learningAnalytics.slice(0, 20),
      recentGrades: grades.slice(0, 10),
      timeRange,
      dateRange: {
        start: startDate,
        end: now
      }
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get class analytics
// @route   GET /api/analytics/class/:classId
// @access  Private (Teacher/Admin)
router.get('/class/:classId', protect, authorize('teacher', 'admin'), async (req, res, next) => {
  try {
    const { classId } = req.params;

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        subject: true,
        teacher: {
          select: {
            firstName: true,
            lastName: true
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
          include: {
            submissions: {
              include: {
                student: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
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

    // Check teacher access
    if (req.user.role === 'teacher' && classData.teacherId !== req.user.teacher.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this class'
      });
    }

    // Calculate class statistics
    const totalStudents = classData.studentClasses.length;
    const totalAssignments = classData.assignments.length;
    
    const submissionStats = classData.assignments.map(assignment => {
      const totalSubmissions = assignment.submissions.length;
      const gradedSubmissions = assignment.submissions.filter(s => s.marksObtained !== null).length;
      const averageScore = gradedSubmissions > 0 
        ? assignment.submissions
            .filter(s => s.marksObtained !== null)
            .reduce((sum, s) => sum + s.marksObtained, 0) / gradedSubmissions
        : 0;

      return {
        assignmentId: assignment.id,
        title: assignment.title,
        totalSubmissions,
        submissionRate: totalStudents > 0 ? (totalSubmissions / totalStudents) * 100 : 0,
        gradedSubmissions,
        averageScore: Math.round(averageScore * 10) / 10
      };
    });

    const analytics = {
      classInfo: {
        id: classData.id,
        subject: classData.subject.name,
        grade: classData.grade,
        section: classData.section,
        teacher: `${classData.teacher.firstName} ${classData.teacher.lastName}`
      },
      statistics: {
        totalStudents,
        totalAssignments,
        averageSubmissionRate: submissionStats.length > 0 
          ? submissionStats.reduce((sum, s) => sum + s.submissionRate, 0) / submissionStats.length
          : 0
      },
      submissionStats,
      students: classData.studentClasses.map(sc => sc.student)
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to calculate study streak
async function calculateStudyStreak(studentId) {
  const recentAnalytics = await prisma.learningAnalytic.findMany({
    where: {
      studentId,
      activityType: 'study_session',
      timestamp: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }
    },
    orderBy: { timestamp: 'desc' }
  });

  // Group by date and calculate streak
  const studyDates = new Set();
  recentAnalytics.forEach(analytics => {
    const date = analytics.timestamp.toDateString();
    studyDates.add(date);
  });

  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    
    if (studyDates.has(checkDate.toDateString())) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export default router;