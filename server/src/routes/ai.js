import express from 'express';
import { protect } from '../middleware/auth.js';
import prisma from '../config/database.js';
import OpenAI from 'openai';

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// @desc    Chat with AI Assistant
// @route   POST /api/ai/chat
// @access  Private
router.post('/chat', protect, async (req, res, next) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Get user context for personalized responses
    const user = req.user;
    const recentAssignments = await prisma.assignment.findMany({
      where: {
        class: {
          studentClasses: {
            some: {
              studentId: req.user.student?.id,
              status: 'active'
            }
          }
        },
        dueDate: { gte: new Date() }
      },
      take: 5,
      include: {
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

    const recentWellness = await prisma.mentalHealthRecord.findFirst({
      where: { studentId: req.user.student?.id },
      orderBy: { date: 'desc' }
    });

    // Build context for AI
    const studentName = user.student?.firstName || user.teacher?.firstName || 'User';
    const grade = user.student?.grade || 'N/A';
    
    const systemPrompt = `You are an AI study assistant for ${studentName}, a grade ${grade} student. 
    
    Current context:
    - Student name: ${studentName} ${user.student?.lastName || user.teacher?.lastName || ''}
    - Grade: ${grade}
    - Recent assignments: ${recentAssignments.map(a => `${a.title} (${a.class.subject.name}) - Due: ${a.dueDate.toDateString()}`).join(', ')}
    - Recent wellness: ${recentWellness ? 'Available' : 'Not available'}
    
    You should:
    1. Be encouraging and supportive
    2. Provide helpful study tips and academic guidance
    3. Consider their wellness when giving advice
    4. Be concise but thorough
    5. Ask follow-up questions when appropriate
    6. Suggest resources or study strategies
    7. Help with homework questions
    8. Provide emotional support when needed
    
    Keep responses conversational and age-appropriate for a grade ${grade} student.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    // Log the conversation (optional - for analytics)
    // You could store this in a Conversation model

    res.status(200).json({
      success: true,
      response: aiResponse,
      context: {
        upcomingAssignments: recentAssignments.length,
        hasWellnessData: !!recentWellness
      }
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    
    // Fallback response if OpenAI fails
    const fallbackResponses = [
      "I'm having trouble connecting right now, but I'm here to help! Can you try asking your question again?",
      "Sorry, I'm experiencing some technical difficulties. In the meantime, have you checked your assignment calendar?",
      "I'm temporarily unavailable, but don't let that stop your learning! What subject are you working on?"
    ];
    
    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    res.status(200).json({
      success: true,
      response: fallbackResponse,
      fallback: true
    });
  }
});

// @desc    Get study suggestions
// @route   GET /api/ai/study-suggestions
// @access  Private
router.get('/study-suggestions', protect, async (req, res, next) => {
  try {
    const user = req.user;
    
    // Get upcoming assignments
    const upcomingAssignments = await prisma.assignment.findMany({
      where: {
        class: {
          studentClasses: {
            some: {
              studentId: req.user.student?.id,
              status: 'active'
            }
          }
        },
        dueDate: { 
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      },
      include: {
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

    // Get recent wellness data
    const wellnessRecords = await prisma.mentalHealthRecord.findMany({
      where: {
        studentId: req.user.student?.id,
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const wellnessSummary = calculateWellnessSummary(wellnessRecords);

    const suggestions = [];

    // Assignment-based suggestions
    if (upcomingAssignments.length > 0) {
      const urgentAssignments = upcomingAssignments.filter(a => {
        const daysUntilDue = Math.ceil((a.dueDate - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilDue <= 2;
      });

      if (urgentAssignments.length > 0) {
        suggestions.push({
          type: 'urgent',
          title: 'Urgent Assignments',
          description: `You have ${urgentAssignments.length} assignment(s) due soon. Consider prioritizing these.`,
          assignments: urgentAssignments.map(a => ({
            title: a.title,
            subject: a.class.subject.name,
            dueDate: a.dueDate
          }))
        });
      }

      // Subject-specific study suggestions
      const subjectCounts = {};
      upcomingAssignments.forEach(a => {
        subjectCounts[a.class.subject.name] = (subjectCounts[a.class.subject.name] || 0) + 1;
      });

      const heaviestSubject = Object.keys(subjectCounts).reduce((a, b) => 
        subjectCounts[a] > subjectCounts[b] ? a : b
      );

      suggestions.push({
        type: 'focus',
        title: `Focus on ${heaviestSubject}`,
        description: `You have the most upcoming work in ${heaviestSubject}. Consider dedicating extra study time to this subject.`,
        subject: heaviestSubject,
        assignmentCount: subjectCounts[heaviestSubject]
      });
    }

    // Wellness-based suggestions
    if (wellnessSummary.averageStress > 7) {
      suggestions.push({
        type: 'wellness',
        title: 'Stress Management',
        description: 'Your stress levels have been high lately. Consider taking breaks and practicing relaxation techniques.',
        tips: [
          'Take 5-minute breaks every 25 minutes of studying',
          'Try deep breathing exercises',
          'Get some fresh air or light exercise',
          'Talk to a counselor if stress persists'
        ]
      });
    }

    if (wellnessSummary.averageSleep < 6) {
      suggestions.push({
        type: 'wellness',
        title: 'Sleep Improvement',
        description: 'Your sleep quality could be better. Good sleep is crucial for learning and memory.',
        tips: [
          'Aim for 8-9 hours of sleep per night',
          'Create a consistent bedtime routine',
          'Avoid screens 1 hour before bed',
          'Keep your room cool and dark'
        ]
      });
    }

    // Study technique suggestions
    suggestions.push({
      type: 'technique',
      title: 'Study Technique of the Day',
      description: 'Try the Pomodoro Technique: 25 minutes of focused study followed by a 5-minute break.',
      benefits: [
        'Improves focus and concentration',
        'Reduces mental fatigue',
        'Makes large tasks feel manageable',
        'Helps track your productivity'
      ]
    });

    res.status(200).json({
      success: true,
      suggestions,
      summary: {
        upcomingAssignments: upcomingAssignments.length,
        wellnessScore: wellnessSummary.averageWellnessScore || 0,
        stressLevel: wellnessSummary.averageStress || 0
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Generate study plan
// @route   POST /api/ai/study-plan
// @access  Private
router.post('/study-plan', protect, async (req, res, next) => {
  try {
    const { timeAvailable, subjects, preferences } = req.body;

    const user = req.user;
    
    // Get assignments for the specified subjects
    const assignments = await prisma.assignment.findMany({
      where: {
        class: {
          studentClasses: {
            some: {
              studentId: req.user.student?.id,
              status: 'active'
            }
          },
          subjectId: { in: subjects }
        },
        dueDate: { gte: new Date() }
      },
      include: {
        class: {
          include: {
            subject: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Simple study plan algorithm
    const studyPlan = {
      totalTime: timeAvailable,
      sessions: [],
      recommendations: []
    };

    let remainingTime = timeAvailable;
    const timePerAssignment = Math.floor(remainingTime / Math.max(assignments.length, 1));

    assignments.forEach((assignment, index) => {
      if (remainingTime <= 0) return;

      const sessionTime = Math.min(timePerAssignment, remainingTime);
      const daysUntilDue = Math.ceil((assignment.dueDate - new Date()) / (1000 * 60 * 60 * 24));
      
      let priority = 'medium';
      if (daysUntilDue <= 1) priority = 'high';
      else if (daysUntilDue >= 7) priority = 'low';

      studyPlan.sessions.push({
        subject: assignment.class.subject.name,
        assignment: assignment.title,
        duration: sessionTime,
        priority,
        dueDate: assignment.dueDate,
        suggestions: [
          'Review assignment requirements',
          'Break down into smaller tasks',
          'Gather necessary resources',
          'Set mini-deadlines for each part'
        ]
      });

      remainingTime -= sessionTime;
    });

    // Add general recommendations
    studyPlan.recommendations = [
      'Take 5-10 minute breaks between subjects',
      'Start with the most challenging or urgent tasks',
      'Keep water and healthy snacks nearby',
      'Find a quiet, well-lit study space',
      'Turn off distracting notifications'
    ];

    // Add time-specific recommendations
    if (timeAvailable >= 120) { // 2+ hours
      studyPlan.recommendations.push('Consider using the Pomodoro Technique (25 min work, 5 min break)');
    }
    
    if (timeAvailable < 60) { // Less than 1 hour
      studyPlan.recommendations.push('Focus on review and quick tasks rather than starting new material');
    }

    res.status(200).json({
      success: true,
      studyPlan
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get homework help
// @route   POST /api/ai/homework-help
// @access  Private
router.post('/homework-help', protect, async (req, res, next) => {
  try {
    const { question, subject, context } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    const user = req.user;
    const grade = user.student?.grade || 'N/A';

    const systemPrompt = `You are a helpful tutor for ${user.student?.firstName || 'Student'}, a grade ${grade} student. 
    
    Subject: ${subject || 'General'}
    
    Guidelines:
    1. Don't give direct answers - guide the student to find the solution
    2. Break down complex problems into steps
    3. Ask clarifying questions if needed
    4. Provide hints and explanations
    5. Encourage critical thinking
    6. Use age-appropriate language for a grade ${grade} student
    7. If it's a math problem, show the process step by step
    8. For essays, help with structure and ideas, not write the content
    
    Remember: The goal is to help them learn, not do the work for them.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Subject: ${subject}\nContext: ${context}\nQuestion: ${question}` }
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

    res.status(200).json({
      success: true,
      response,
      followUpSuggestions: [
        "Can you explain this part in more detail?",
        "What would happen if we changed this variable?",
        "Can you show me a similar example?",
        "How does this connect to what we learned before?"
      ]
    });

  } catch (error) {
    console.error('Homework Help Error:', error);
    
    res.status(200).json({
      success: true,
      response: "I'm having trouble right now, but here are some general tips: break the problem into smaller parts, review your notes, and don't hesitate to ask your teacher for clarification!",
      fallback: true
    });
  }
});

// Helper function to calculate wellness summary
function calculateWellnessSummary(records) {
  if (records.length === 0) {
    return {
      averageWellnessScore: 0,
      averageStress: 0,
      averageMood: 0
    };
  }

  const totals = records.reduce((acc, record) => {
    acc.stress += record.stressLevel || 0;
    acc.mood += record.moodRating || 0;
    return acc;
  }, { stress: 0, mood: 0 });

  return {
    averageWellnessScore: Math.round((totals.mood / records.length) * 10),
    averageStress: Math.round((totals.stress / records.length) * 10) / 10,
    averageMood: Math.round((totals.mood / records.length) * 10) / 10
  };
}

export default router;