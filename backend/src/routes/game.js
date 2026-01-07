import { Router } from 'express';
import prisma from '../db.js';
import { authenticate, requireApproval } from '../middleware/auth.js';

const router = Router();

// All game routes require authentication and approval
router.use(authenticate, requireApproval);

// Get all saves for current user
router.get('/saves', async (req, res, next) => {
  try {
    const saves = await prisma.gameSave.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ saves });
  } catch (error) {
    next(error);
  }
});

// Get specific save
router.get('/saves/:id', async (req, res, next) => {
  try {
    const save = await prisma.gameSave.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!save) {
      return res.status(404).json({ error: 'Save not found' });
    }

    res.json({ save });
  } catch (error) {
    next(error);
  }
});

// Create new save
router.post('/saves', async (req, res, next) => {
  try {
    const { name, data } = req.body;

    const save = await prisma.gameSave.create({
      data: {
        userId: req.user.id,
        name: name || 'New Save',
        data: data || {}
      }
    });

    res.status(201).json({ save });
  } catch (error) {
    next(error);
  }
});

// Update save
router.put('/saves/:id', async (req, res, next) => {
  try {
    const { name, data } = req.body;

    // Verify ownership
    const existingSave = await prisma.gameSave.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingSave) {
      return res.status(404).json({ error: 'Save not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (data !== undefined) updateData.data = data;

    const save = await prisma.gameSave.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({ save });
  } catch (error) {
    next(error);
  }
});

// Delete save
router.delete('/saves/:id', async (req, res, next) => {
  try {
    // Verify ownership
    const existingSave = await prisma.gameSave.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!existingSave) {
      return res.status(404).json({ error: 'Save not found' });
    }

    await prisma.gameSave.delete({
      where: { id: req.params.id }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
