import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          student: true,
          teacher: true,
          parent: true,
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.status !== 'active') {
        return res.status(401).json({
          success: false,
          message: 'Account is not active'
        });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          include: {
            student: true,
            teacher: true,
            parent: true,
          }
        });
        
        if (user && user.status === 'active') {
          req.user = user;
        }
      } catch (error) {
        // Token invalid, but continue without user
        req.user = null;
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Check if user owns resource or has permission
export const checkResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      let hasAccess = false;

      switch (resourceType) {
        case 'student':
          if (req.user.role === 'student' && req.user.student?.id === resourceId) {
            hasAccess = true;
          } else if (req.user.role === 'parent') {
            const student = await prisma.student.findUnique({
              where: { id: resourceId }
            });
            hasAccess = student?.parentId === req.user.parent?.id;
          } else if (['teacher', 'admin', 'counselor'].includes(req.user.role)) {
            hasAccess = true;
          }
          break;

        case 'assignment':
          const assignment = await prisma.assignment.findUnique({
            where: { id: resourceId },
            include: {
              class: {
                include: {
                  studentClasses: true
                }
              }
            }
          });

          if (req.user.role === 'teacher' && assignment?.createdBy === req.user.id) {
            hasAccess = true;
          } else if (req.user.role === 'student') {
            hasAccess = assignment?.class.studentClasses.some(
              sc => sc.studentId === req.user.student?.id
            );
          } else if (['admin'].includes(req.user.role)) {
            hasAccess = true;
          }
          break;

        case 'mental_health':
          if (req.user.role === 'student' && req.user.student?.id === req.params.studentId) {
            hasAccess = true;
          } else if (['counselor', 'admin'].includes(req.user.role)) {
            hasAccess = true;
          } else if (req.user.role === 'parent') {
            const student = await prisma.student.findUnique({
              where: { id: req.params.studentId }
            });
            hasAccess = student?.parentId === req.user.parent?.id;
          }
          break;

        default:
          hasAccess = ['admin'].includes(req.user.role);
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this resource'
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};