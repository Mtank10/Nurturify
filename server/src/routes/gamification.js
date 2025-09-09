import express from 'express';
import prisma from '../config/database.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Achievement definitions
const ACHIEVEMENTS = {
  'first-assignment': {
    title: 'First Steps',
    description: 'Complete your first assignment',
    icon: '🎯',
    rarity: 'common',
    xp: 50,
    points: 100
  },
  'study-warrior': {
    title: 'Study Warrior',
    description: 'Study for 7 consecutive days',
    icon: '⚔️',
    rarity: 'rare',
    xp: 200,
    points: 500
  },
  'perfect-score': {
    title: 'Perfect Score',
    description: 'Get 100% on any quiz',
    icon: '💯',
    rarity: 'epic',
    xp: 300,
    points: 750
  },
  'knowledge-master': {
    title: 'Knowledge Master',
    description: 'Complete 50 assignments',
    icon: '🧠',
    rarity: 'legendary',
    xp: 500,
    points: 1000
  },
  'wellness-champion': {
    title: 'Wellness Champion',
    description: 'Maintain high wellness score for 30 days',
    icon: '💚',
    rarity: 'epic',
    xp: 400,
    points: 800
  },
  'streak-master': {
    title: 'Streak Master',
    description: 'Maintain a 30-day study streak',
    icon: '🔥',
    rarity: 'legendary',
    xp: 600,
    points: 1200
  }
};

// @desc    Get student gamification profile
// @route   GET /api/gamification/profile
// @access  Private (Student)
router.get('/profile', protect, authorize('student'), async (req, res, next) => {
  try {
    const studentId = req.user.student.id;

    // Get student's gamification data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        user: {
          select: {
            createdAt: true
          }
        }
      }
    });

    // Get achievements
    const achievements = await prisma.studentProgress.findMany({
      where: {
        studentId,
        skillName: { startsWith: 'achievement_' }
      }
    });

    // Calculate level and XP
    const totalXP = achievements.reduce((sum, achievement) => {
      const achievementKey = achievement.skillName.replace('achievement_', '');
      return sum + (ACHIEVEMENTS[achievementKey]?.xp || 0);
    }, 0);

    const level = Math.floor(totalXP / 1000) + 1;
    const xpToNext = (level * 1000) - totalXP;

    // Calculate total points
    const totalPoints = achievements.reduce((sum, achievement) => {
      const achievementKey = achievement.skillName.replace('achievement_', '');
      return sum + (ACHIEVEMENTS[achievementKey]?.points || 0);
    }, 0);

    // Get study streak
    const studyStreak = await calculateStudyStreak(studentId);

    // Get rank
    const rank = await calculateStudentRank(studentId, totalPoints);

    const profile = {
      level,
      xp: totalXP,
      xpToNext,
      totalPoints,
      rank,
      streakDays: studyStreak,
      achievements: achievements.map(a => ({
        id: a.skillName.replace('achievement_', ''),
        ...ACHIEVEMENTS[a.skillName.replace('achievement_', '')],
        unlockedAt: a.lastAssessmentDate
      }))
    };

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get achievements
// @route   GET /api/gamification/achievements
// @access  Private (Student)
router.get('/achievements', protect, authorize('student'), async (req, res, next) => {
  try {
    const studentId = req.user.student.id;

    // Get unlocked achievements
    const unlockedAchievements = await prisma.studentProgress.findMany({
      where: {
        studentId,
        skillName: { startsWith: 'achievement_' }
      }
    });

    const unlockedIds = unlockedAchievements.map(a => a.skillName.replace('achievement_', ''));

    // Format all achievements
    const achievements = Object.entries(ACHIEVEMENTS).map(([id, achievement]) => ({
      id,
      ...achievement,
      unlocked: unlockedIds.includes(id),
      unlockedDate: unlockedAchievements.find(a => a.skillName === `achievement_${id}`)?.lastAssessmentDate,
      progress: getAchievementProgress(id, studentId)
    }));

    res.status(200).json({
      success: true,
      data: achievements
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get leaderboard
// @route   GET /api/gamification/leaderboard
// @access  Private
router.get('/leaderboard', protect, async (req, res, next) => {
  try {
    const { limit = 50, type = 'points' } = req.query;

    // Get all students with their achievements
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            status: true
          }
        },
        studentProgress: {
          where: {
            skillName: { startsWith: 'achievement_' }
          }
        }
      },
      where: {
        user: {
          status: 'active'
        }
      }
    });

    // Calculate points and rank students
    const leaderboard = students.map(student => {
      const totalPoints = student.studentProgress.reduce((sum, achievement) => {
        const achievementKey = achievement.skillName.replace('achievement_', '');
        return sum + (ACHIEVEMENTS[achievementKey]?.points || 0);
      }, 0);

      const totalXP = student.studentProgress.reduce((sum, achievement) => {
        const achievementKey = achievement.skillName.replace('achievement_', '');
        return sum + (ACHIEVEMENTS[achievementKey]?.xp || 0);
      }, 0);

      const level = Math.floor(totalXP / 1000) + 1;

      return {
        studentId: student.id,
        name: `${student.firstName} ${student.lastName}`,
        points: totalPoints,
        level,
        badge: getBadgeForRank(1), // Will be updated after sorting
        isCurrentUser: req.user.role === 'student' && student.id === req.user.student.id
      };
    });

    // Sort by points or level
    leaderboard.sort((a, b) => {
      if (type === 'level') {
        return b.level - a.level || b.points - a.points;
      }
      return b.points - a.points;
    });

    // Add ranks and badges
    leaderboard.forEach((student, index) => {
      student.rank = index + 1;
      student.badge = getBadgeForRank(student.rank);
    });

    res.status(200).json({
      success: true,
      data: leaderboard.slice(0, parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get challenges
// @route   GET /api/gamification/challenges
// @access  Private (Student)
router.get('/challenges', protect, authorize('student'), async (req, res, next) => {
  try {
    const studentId = req.user.student.id;
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get daily challenge progress
    const todayAssignments = await prisma.assignmentSubmission.count({
      where: {
        studentId,
        submittedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        },
        status: { not: 'draft' }
      }
    });

    // Get weekly study hours
    const weeklyStudyTime = await prisma.learningAnalytic.aggregate({
      where: {
        studentId,
        activityType: 'study_session',
        timestamp: { gte: startOfWeek }
      },
      _sum: {
        durationMinutes: true
      }
    });

    // Get monthly grades
    const monthlyGrades = await prisma.grade.findMany({
      where: {
        studentId,
        createdAt: { gte: startOfMonth }
      }
    });

    const aGrades = monthlyGrades.filter(grade => {
      const percentage = (parseFloat(grade.marksObtained) / parseFloat(grade.totalMarks)) * 100;
      return percentage >= 90;
    }).length;

    const challenges = [
      {
        id: '1',
        title: 'Daily Grind',
        description: 'Complete 3 assignments today',
        type: 'daily',
        progress: todayAssignments,
        maxProgress: 3,
        reward: '50 XP',
        expiresIn: getTimeUntilEndOfDay()
      },
      {
        id: '2',
        title: 'Study Marathon',
        description: 'Study for 20 hours this week',
        type: 'weekly',
        progress: Math.floor((weeklyStudyTime._sum.durationMinutes || 0) / 60),
        maxProgress: 20,
        reward: '200 XP + Badge',
        expiresIn: getTimeUntilEndOfWeek()
      },
      {
        id: '3',
        title: 'Subject Master',
        description: 'Get A grade in all subjects this month',
        type: 'monthly',
        progress: aGrades,
        maxProgress: 5,
        reward: '500 XP + Title',
        expiresIn: getTimeUntilEndOfMonth()
      }
    ];

    res.status(200).json({
      success: true,
      data: challenges
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Check and award achievements
// @route   POST /api/gamification/check-achievements
// @access  Private (Student)
router.post('/check-achievements', protect, authorize('student'), async (req, res, next) => {
  try {
    const studentId = req.user.student.id;
    const newAchievements = await checkAndAwardAchievements(studentId);

    res.status(200).json({
      success: true,
      data: {
        newAchievements,
        message: newAchievements.length > 0 ? 'New achievements unlocked!' : 'No new achievements'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions
async function calculateStudyStreak(studentId) {
  const recentAnalytics = await prisma.learningAnalytic.findMany({
    where: {
      studentId,
      activityType: 'study_session',
      timestamp: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    },
    orderBy: { timestamp: 'desc' }
  });

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

async function calculateStudentRank(studentId, studentPoints) {
  const allStudents = await prisma.student.findMany({
    include: {
      studentProgress: {
        where: {
          skillName: { startsWith: 'achievement_' }
        }
      }
    }
  });

  const studentScores = allStudents.map(student => {
    const points = student.studentProgress.reduce((sum, achievement) => {
      const achievementKey = achievement.skillName.replace('achievement_', '');
      return sum + (ACHIEVEMENTS[achievementKey]?.points || 0);
    }, 0);
    return { id: student.id, points };
  });

  studentScores.sort((a, b) => b.points - a.points);
  
  const rank = studentScores.findIndex(s => s.id === studentId) + 1;
  return rank || studentScores.length + 1;
}

function getBadgeForRank(rank) {
  if (rank === 1) return '👑';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  if (rank <= 10) return '🏆';
  if (rank <= 50) return '⭐';
  return '🎯';
}

async function getAchievementProgress(achievementId, studentId) {
  switch (achievementId) {
    case 'knowledge-master':
      const completedAssignments = await prisma.assignmentSubmission.count({
        where: {
          studentId,
          status: { not: 'draft' }
        }
      });
      return { current: completedAssignments, target: 50 };

    case 'wellness-champion':
      const wellnessRecords = await prisma.mentalHealthRecord.count({
        where: {
          studentId,
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });
      return { current: wellnessRecords, target: 30 };

    default:
      return null;
  }
}

async function checkAndAwardAchievements(studentId) {
  const newAchievements = [];

  // Check first assignment
  const firstAssignment = await prisma.assignmentSubmission.findFirst({
    where: {
      studentId,
      status: { not: 'draft' }
    }
  });

  if (firstAssignment) {
    const hasAchievement = await prisma.studentProgress.findFirst({
      where: {
        studentId,
        skillName: 'achievement_first-assignment'
      }
    });

    if (!hasAchievement) {
      await prisma.studentProgress.create({
        data: {
          studentId,
          skillName: 'achievement_first-assignment',
          currentLevel: 1,
          progressPercentage: 100,
          lastAssessmentDate: new Date()
        }
      });
      newAchievements.push('first-assignment');
    }
  }

  // Check perfect score
  const perfectScore = await prisma.grade.findFirst({
    where: {
      studentId,
      marksObtained: { equals: prisma.grade.fields.totalMarks }
    }
  });

  if (perfectScore) {
    const hasAchievement = await prisma.studentProgress.findFirst({
      where: {
        studentId,
        skillName: 'achievement_perfect-score'
      }
    });

    if (!hasAchievement) {
      await prisma.studentProgress.create({
        data: {
          studentId,
          skillName: 'achievement_perfect-score',
          currentLevel: 1,
          progressPercentage: 100,
          lastAssessmentDate: new Date()
        }
      });
      newAchievements.push('perfect-score');
    }
  }

  // Check study warrior (7-day streak)
  const studyStreak = await calculateStudyStreak(studentId);
  if (studyStreak >= 7) {
    const hasAchievement = await prisma.studentProgress.findFirst({
      where: {
        studentId,
        skillName: 'achievement_study-warrior'
      }
    });

    if (!hasAchievement) {
      await prisma.studentProgress.create({
        data: {
          studentId,
          skillName: 'achievement_study-warrior',
          currentLevel: 1,
          progressPercentage: 100,
          lastAssessmentDate: new Date()
        }
      });
      newAchievements.push('study-warrior');
    }
  }

  return newAchievements;
}

function getTimeUntilEndOfDay() {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  
  const diff = endOfDay - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

function getTimeUntilEndOfWeek() {
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (6 - now.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);
  
  const diff = endOfWeek - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return `${days}d ${hours}h`;
}

function getTimeUntilEndOfMonth() {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);
  
  const diff = endOfMonth - now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  return `${days}d ${hours}h`;
}

export default router;