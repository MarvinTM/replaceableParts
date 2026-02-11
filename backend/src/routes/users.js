import { Router } from 'express';
import prisma from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get current user's profile
router.get('/profile', authenticate, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    picture: req.user.picture,
    role: req.user.role,
    isApproved: req.user.isApproved,
    createdAt: req.user.createdAt
  });
});

// Update current user's profile (limited fields)
router.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const { name } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        role: true,
        isApproved: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// Delete current user's account
router.delete('/profile', authenticate, async (req, res, next) => {
  try {
    await prisma.user.delete({
      where: { id: req.user.id }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
