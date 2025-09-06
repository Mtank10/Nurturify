import express from 'express';
import prisma from '../config/database.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      isRead,
      priority
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let where = { userId: req.user.id };

    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (priority) where.priority = priority;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: req.user.id,
          isRead: false
        }
      })
    ]);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: notifications
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res, next) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: req.params.id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      data: updatedNotification
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private (System/Admin)
router.post('/', protect, async (req, res, next) => {
  try {
    const {
      userId,
      type,
      title,
      message,
      data,
      priority = 'normal',
      deliveryMethod = 'in_app',
      scheduledFor,
      expiresAt
    } = req.body;

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data,
        priority,
        deliveryMethod,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    // Emit real-time notification if socket.io is available
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('notification', notification);
    }

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    next(error);
  }
});

export default router;