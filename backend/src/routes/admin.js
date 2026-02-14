import { Router } from 'express';
import prisma from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();
const MAX_SESSION_PAGE_SIZE = 100;

function parseDateFilter(value) {
  if (typeof value !== 'string') return null;
  const trimmedValue = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) return null;

  const parsedDate = new Date(`${trimmedValue}T00:00:00.000Z`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Get all users
router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        role: true,
        isApproved: true,
        createdAt: true,
        lastLoginAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// Get single user
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        role: true,
        isApproved: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update user permissions (approve/revoke access, change role)
router.patch('/users/:id/permissions', async (req, res, next) => {
  try {
    const { isApproved, role } = req.body;
    const userId = req.params.id;

    // Prevent admin from demoting themselves
    if (userId === req.user.id && role === 'USER') {
      return res.status(400).json({
        error: 'Cannot remove your own admin privileges'
      });
    }

    // Prevent admin from revoking their own approval
    if (userId === req.user.id && isApproved === false) {
      return res.status(400).json({
        error: 'Cannot revoke your own access'
      });
    }

    const updateData = {};
    if (typeof isApproved === 'boolean') {
      updateData.isApproved = isApproved;
    }
    if (role && ['USER', 'ADMIN'].includes(role)) {
      updateData.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        role: true,
        isApproved: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
});

// Delete user
router.delete('/users/:id', async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Cannot delete your own account from admin panel'
      });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get system stats
router.get('/stats', async (req, res, next) => {
  try {
    const [totalUsers, approvedUsers, pendingUsers, adminCount] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isApproved: true } }),
      prisma.user.count({ where: { isApproved: false } }),
      prisma.user.count({ where: { role: 'ADMIN' } })
    ]);

    res.json({
      stats: {
        totalUsers,
        approvedUsers,
        pendingUsers,
        adminCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get session stats
router.get('/sessions/stats', async (req, res, next) => {
  try {
    const [totalSessions, activeSessions, avgDurationResult, ageDistribution] = await Promise.all([
      prisma.session.count(),
      prisma.session.count({ where: { isActive: true } }),
      prisma.session.aggregate({
        _avg: { durationSeconds: true },
        where: { isActive: false }
      }),
      prisma.session.groupBy({
        by: ['currentAge'],
        _count: { currentAge: true },
        orderBy: { currentAge: 'asc' }
      })
    ]);

    const avgDuration = Math.round(avgDurationResult._avg.durationSeconds || 0);

    res.json({
      stats: {
        totalSessions,
        activeSessions,
        avgDuration,
        ageDistribution: ageDistribution.map(item => ({
          age: item.currentAge,
          count: item._count.currentAge
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get paginated sessions list
router.get('/sessions', async (req, res, next) => {
  try {
    const rawPage = Number.parseInt(req.query.page, 10);
    const rawLimit = Number.parseInt(req.query.limit, 10);
    const userFilter = typeof req.query.user === 'string' ? req.query.user.trim() : '';
    const sessionTypeFilter = typeof req.query.sessionType === 'string'
      ? req.query.sessionType.trim()
      : '';
    const startDateFilter = parseDateFilter(req.query.startDate);
    const endDateFilter = parseDateFilter(req.query.endDate);
    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isInteger(rawLimit) && rawLimit > 0
      ? Math.min(rawLimit, MAX_SESSION_PAGE_SIZE)
      : 20;
    const skip = (page - 1) * limit;
    const where = {};

    if (userFilter) {
      where.user = {
        OR: [
          { name: { contains: userFilter, mode: 'insensitive' } },
          { email: { contains: userFilter, mode: 'insensitive' } }
        ]
      };
    }

    if (sessionTypeFilter && sessionTypeFilter !== 'all') {
      where.sessionType = sessionTypeFilter;
    }

    if (startDateFilter || endDateFilter) {
      where.startedAt = {};

      if (startDateFilter) {
        where.startedAt.gte = startDateFilter;
      }

      if (endDateFilter) {
        const endDateExclusive = new Date(endDateFilter);
        endDateExclusive.setUTCDate(endDateExclusive.getUTCDate() + 1);
        where.startedAt.lt = endDateExclusive;
      }
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              picture: true
            }
          }
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.session.count({ where })
    ]);

    res.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
