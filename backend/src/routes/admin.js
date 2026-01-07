import { Router } from 'express';
import prisma from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

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

export default router;
