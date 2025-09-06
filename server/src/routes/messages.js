import express from 'express';
import prisma from '../config/database.js';
import { protect } from '../middleware/auth.js';
import { validate, sendMessageSchema, createConversationSchema } from '../utils/validation.js';

const router = express.Router();

// @desc    Get user conversations
// @route   GET /api/messages/conversations
// @access  Private
router.get('/conversations', protect, async (req, res, next) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: req.user.id,
            leftAt: null
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                role: true,
                student: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                },
                teacher: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                },
                parent: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            content: true,
            createdAt: true,
            messageType: true,
            sender: {
              select: {
                id: true,
                student: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                },
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
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: req.user.id }
              }
            }
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get conversation messages
// @route   GET /api/messages/conversations/:id/messages
// @access  Private
router.get('/conversations/:id/messages', protect, async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: req.user.id,
        leftAt: null
      }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this conversation'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await prisma.message.findMany({
      where: { conversationId },
      skip,
      take: parseInt(limit),
      include: {
        sender: {
          select: {
            id: true,
            role: true,
            student: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            teacher: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            parent: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                student: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                },
                teacher: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: req.user.id },
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      data: messages.reverse()
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Send message
// @route   POST /api/messages
// @access  Private
router.post('/', protect, validate(sendMessageSchema), async (req, res, next) => {
  try {
    const {
      conversationId,
      content,
      messageType = 'text',
      priority = 'medium',
      replyToMessageId
    } = req.body;

    // Check if user is participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: req.user.id,
        leftAt: null
      }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages to this conversation'
      });
    }

    const message = await prisma.$transaction(async (tx) => {
      // Create message
      const newMessage = await tx.message.create({
        data: {
          senderId: req.user.id,
          conversationId,
          content,
          messageType,
          priority,
          replyToMessageId
        },
        include: {
          sender: {
            select: {
              id: true,
              role: true,
              student: {
                select: {
                  firstName: true,
                  lastName: true
                }
              },
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

      // Update conversation last message time
      await tx.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });

      return newMessage;
    });

    // Emit real-time message
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation_${conversationId}`).emit('new_message', message);
    }

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create conversation
// @route   POST /api/messages/conversations
// @access  Private
router.post('/conversations', protect, validate(createConversationSchema), async (req, res, next) => {
  try {
    const {
      type,
      title,
      description,
      participantIds
    } = req.body;

    // Add current user to participants if not included
    const allParticipantIds = participantIds.includes(req.user.id) 
      ? participantIds 
      : [...participantIds, req.user.id];

    const conversation = await prisma.$transaction(async (tx) => {
      // Create conversation
      const newConversation = await tx.conversation.create({
        data: {
          type,
          title,
          description,
          createdBy: req.user.id,
          participantCount: allParticipantIds.length
        }
      });

      // Add participants
      await tx.conversationParticipant.createMany({
        data: allParticipantIds.map(userId => ({
          conversationId: newConversation.id,
          userId,
          role: userId === req.user.id ? 'admin' : 'member'
        }))
      });

      return newConversation;
    });

    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
});

export default router;