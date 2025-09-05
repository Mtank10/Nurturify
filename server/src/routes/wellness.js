import express from 'express';
import prisma from '../config/database.js';
import { protect, authorize, checkResourceOwnership } from '../middleware/auth.js';
import { validate, mentalHealthRecordSchema } from '../utils/validation.js';

const router = express.Router();

// @desc    Get mental health records
// @route   GET /api/wellness/records/:studentId
// @access  Private
router.get('/records/:studentId', protect, checkResourceOwnership('mental_health'), async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let where = { studentId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [records, total] = await Promise.all([
      prisma.mentalHealthRecord.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { date: 'desc' }
      }),
      prisma.mentalHealthRecord.count({ where })
    ]);

    res.status(200).json({
      success: true,
      count: records.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: records
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create mental health record
// @route   POST /api/wellness/records/:studentId
// @access  Private
router.post('/records/:studentId', protect, checkResourceOwnership('mental_health'), validate(mentalHealthRecordSchema), async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const {
      date,
      moodRating,
      stressLevel,
      sleepHours,
      energyLevel,
      anxietyLevel,
      notes,
      triggers,
      copingStrategiesUsed
    } = req.body;

    // Check if record already exists for this date
    const existingRecord = await prisma.mentalHealthRecord.findFirst({
      where: {
        studentId,
        date: new Date(date)
      }
    });

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'Mental health record already exists for this date'
      });
    }

    const record = await prisma.mentalHealthRecord.create({
      data: {
        studentId,
        date: new Date(date),
        moodRating,
        stressLevel,
        sleepHours,
        energyLevel,
        anxietyLevel,
        notes,
        triggers,
        copingStrategiesUsed
      }
    });

    // Check for alerts based on the new record
    await checkMentalHealthAlerts(studentId, record);

    res.status(201).json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update mental health record
// @route   PUT /api/wellness/records/:id
// @access  Private
router.put('/records/:id', protect, async (req, res, next) => {
  try {
    const recordId = req.params.id;

    const existingRecord = await prisma.mentalHealthRecord.findUnique({
      where: { id: recordId },
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    });

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        message: 'Mental health record not found'
      });
    }

    // Check permissions
    const hasAccess = 
      req.user.role === 'student' && existingRecord.student.userId === req.user.id ||
      req.user.role === 'parent' && existingRecord.student.parentId === req.user.parent?.id ||
      ['counselor', 'admin'].includes(req.user.role);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this record'
      });
    }

    const updatedRecord = await prisma.mentalHealthRecord.update({
      where: { id: recordId },
      data: {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined
      }
    });

    // Check for alerts based on updated record
    await checkMentalHealthAlerts(existingRecord.studentId, updatedRecord);

    res.status(200).json({
      success: true,
      data: updatedRecord
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get wellness analytics
// @route   GET /api/wellness/analytics/:studentId
// @access  Private
router.get('/analytics/:studentId', protect, checkResourceOwnership('mental_health'), async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const records = await prisma.mentalHealthRecord.findMany({
      where: {
        studentId,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    });

    if (records.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          averages: {},
          trends: [],
          insights: [],
          totalRecords: 0
        }
      });
    }

    // Calculate averages
    const averages = {
      moodRating: calculateAverage(records, 'moodRating'),
      stressLevel: calculateAverage(records, 'stressLevel'),
      sleepHours: calculateAverage(records, 'sleepHours'),
      energyLevel: calculateAverage(records, 'energyLevel'),
      anxietyLevel: calculateAverage(records, 'anxietyLevel')
    };

    // Calculate trends (last 7 days vs previous 7 days)
    const recentRecords = records.slice(-7);
    const previousRecords = records.slice(-14, -7);

    const trends = {
      moodRating: calculateTrend(previousRecords, recentRecords, 'moodRating'),
      stressLevel: calculateTrend(previousRecords, recentRecords, 'stressLevel'),
      sleepHours: calculateTrend(previousRecords, recentRecords, 'sleepHours'),
      energyLevel: calculateTrend(previousRecords, recentRecords, 'energyLevel'),
      anxietyLevel: calculateTrend(previousRecords, recentRecords, 'anxietyLevel')
    };

    // Generate insights
    const insights = generateWellnessInsights(averages, trends, records);

    // Get wellness score trend
    const wellnessScores = records.map(record => ({
      date: record.date,
      score: calculateWellnessScore(record)
    }));

    res.status(200).json({
      success: true,
      data: {
        averages,
        trends,
        insights,
        wellnessScores,
        totalRecords: records.length,
        dateRange: {
          start: startDate,
          end: new Date()
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get counseling sessions
// @route   GET /api/wellness/counseling/:studentId
// @access  Private
router.get('/counseling/:studentId', protect, checkResourceOwnership('mental_health'), async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      status,
      sessionType 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let where = { studentId };

    if (status) where.status = status;
    if (sessionType) where.sessionType = sessionType;

    const [sessions, total] = await Promise.all([
      prisma.counselingSession.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          counselor: {
            select: {
              id: true,
              role: true,
              teacher: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { scheduledAt: 'desc' }
      }),
      prisma.counselingSession.count({ where })
    ]);

    res.status(200).json({
      success: true,
      count: sessions.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: sessions
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Schedule counseling session
// @route   POST /api/wellness/counseling/:studentId
// @access  Private (Counselor/Admin)
router.post('/counseling/:studentId', protect, authorize('counselor', 'admin'), async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const {
      sessionType,
      scheduledAt,
      durationMinutes,
      mode,
      privacyLevel
    } = req.body;

    const session = await prisma.counselingSession.create({
      data: {
        studentId,
        counselorId: req.user.id,
        sessionType,
        scheduledAt: new Date(scheduledAt),
        durationMinutes: durationMinutes || 60,
        status: 'scheduled',
        mode: mode || 'in_person',
        privacyLevel: privacyLevel || 'confidential'
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        counselor: {
          select: {
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
      data: session
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get mental health alerts
// @route   GET /api/wellness/alerts
// @access  Private (Counselor/Admin)
router.get('/alerts', protect, authorize('counselor', 'admin'), async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      severity,
      status = 'active',
      alertType 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let where = {};

    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (alertType) where.alertType = alertType;

    const [alerts, total] = await Promise.all([
      prisma.mentalHealthAlert.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              studentId: true,
              grade: true,
              section: true
            }
          },
          assignedUser: {
            select: {
              teacher: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.mentalHealthAlert.count({ where })
    ]);

    res.status(200).json({
      success: true,
      count: alerts.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: alerts
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions
function calculateAverage(records, field) {
  const validRecords = records.filter(r => r[field] !== null && r[field] !== undefined);
  if (validRecords.length === 0) return 0;
  
  const sum = validRecords.reduce((acc, record) => acc + parseFloat(record[field]), 0);
  return Math.round((sum / validRecords.length) * 10) / 10;
}

function calculateTrend(previousRecords, recentRecords, field) {
  const previousAvg = calculateAverage(previousRecords, field);
  const recentAvg = calculateAverage(recentRecords, field);
  
  if (previousAvg === 0) return 0;
  
  const change = ((recentAvg - previousAvg) / previousAvg) * 100;
  return Math.round(change * 10) / 10;
}

function calculateWellnessScore(record) {
  const mood = record.moodRating || 5;
  const stress = record.stressLevel ? (11 - record.stressLevel) : 5; // Invert stress
  const energy = record.energyLevel || 5;
  const anxiety = record.anxietyLevel ? (11 - record.anxietyLevel) : 5; // Invert anxiety
  const sleep = record.sleepHours ? Math.min(record.sleepHours / 8 * 10, 10) : 5;
  
  const total = mood + stress + energy + anxiety + sleep;
  return Math.round((total / 50) * 100);
}

function generateWellnessInsights(averages, trends, records) {
  const insights = [];

  // Mood insights
  if (averages.moodRating < 4) {
    insights.push({
      type: 'concern',
      category: 'mood',
      message: 'Your mood ratings have been consistently low. Consider speaking with a counselor.',
      priority: 'high'
    });
  } else if (trends.moodRating < -20) {
    insights.push({
      type: 'warning',
      category: 'mood',
      message: 'Your mood has declined significantly recently. This might be worth discussing.',
      priority: 'medium'
    });
  }

  // Stress insights
  if (averages.stressLevel > 7) {
    insights.push({
      type: 'concern',
      category: 'stress',
      message: 'Your stress levels are quite high. Try some relaxation techniques or talk to someone.',
      priority: 'high'
    });
  }

  // Sleep insights
  if (averages.sleepHours < 6) {
    insights.push({
      type: 'advice',
      category: 'sleep',
      message: 'You\'re not getting enough sleep. Aim for 7-9 hours per night for better wellbeing.',
      priority: 'medium'
    });
  }

  // Positive insights
  if (averages.moodRating >= 7 && averages.stressLevel <= 4) {
    insights.push({
      type: 'positive',
      category: 'overall',
      message: 'Great job maintaining good mental health! Keep up the positive habits.',
      priority: 'low'
    });
  }

  return insights;
}

async function checkMentalHealthAlerts(studentId, record) {
  const alerts = [];

  // Check for concerning patterns
  if (record.moodRating && record.moodRating <= 3) {
    alerts.push({
      studentId,
      alertType: 'mood_decline',
      severity: record.moodRating <= 2 ? 'high' : 'medium',
      description: `Student reported low mood rating of ${record.moodRating}/10`,
      triggeredBy: { recordId: record.id, field: 'moodRating', value: record.moodRating }
    });
  }

  if (record.stressLevel && record.stressLevel >= 8) {
    alerts.push({
      studentId,
      alertType: 'stress_spike',
      severity: record.stressLevel >= 9 ? 'high' : 'medium',
      description: `Student reported high stress level of ${record.stressLevel}/10`,
      triggeredBy: { recordId: record.id, field: 'stressLevel', value: record.stressLevel }
    });
  }

  if (record.anxietyLevel && record.anxietyLevel >= 8) {
    alerts.push({
      studentId,
      alertType: 'anxiety_increase',
      severity: record.anxietyLevel >= 9 ? 'high' : 'medium',
      description: `Student reported high anxiety level of ${record.anxietyLevel}/10`,
      triggeredBy: { recordId: record.id, field: 'anxietyLevel', value: record.anxietyLevel }
    });
  }

  // Create alerts in database
  for (const alertData of alerts) {
    try {
      await prisma.mentalHealthAlert.create({
        data: alertData
      });
    } catch (error) {
      console.error('Error creating mental health alert:', error);
    }
  }
}

export default router;