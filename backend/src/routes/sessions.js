import { Router } from 'express';
import prisma from '../db.js';
import { authenticate, requireApproval } from '../middleware/auth.js';

const router = Router();

// All session routes require authentication and approval
router.use(authenticate, requireApproval);

// Start a new session
router.post('/start', async (req, res, next) => {
  try {
    const { gameSaveId, sessionType, startingAge, factoryWidth, factoryHeight } = req.body;
    const userId = req.user.id;

    // Close any active sessions for this user
    await prisma.session.updateMany({
      where: {
        userId,
        isActive: true
      },
      data: {
        isActive: false,
        endedAt: new Date()
      }
    });

    // Create new session
    const session = await prisma.session.create({
      data: {
        userId,
        gameSaveId: gameSaveId || null,
        sessionType: sessionType || 'new',
        startingAge: startingAge || 1,
        currentAge: startingAge || 1,
        factoryWidth: factoryWidth || 16,
        factoryHeight: factoryHeight || 16,
        isActive: true
      }
    });

    res.json({ session });
  } catch (error) {
    next(error);
  }
});

// Heartbeat - update session metrics
router.put('/heartbeat/:id', async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const { currentAge, maxMachines, factoryWidth, factoryHeight, durationSeconds } = req.body;
    const userId = req.user.id;

    // Verify session belongs to user
    const existingSession = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId
      }
    });

    if (!existingSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update session metrics
    const updateData = {};
    if (currentAge !== undefined) updateData.currentAge = currentAge;
    if (maxMachines !== undefined) updateData.maxMachines = maxMachines;
    if (factoryWidth !== undefined) updateData.factoryWidth = factoryWidth;
    if (factoryHeight !== undefined) updateData.factoryHeight = factoryHeight;
    if (durationSeconds !== undefined) updateData.durationSeconds = durationSeconds;

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: updateData
    });

    res.json({ session });
  } catch (error) {
    next(error);
  }
});

// End session (supports both regular request and beacon)
router.post('/end/:id', async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const { currentAge, maxMachines, factoryWidth, factoryHeight, durationSeconds } = req.body;
    const userId = req.user.id;

    // Verify session belongs to user
    const existingSession = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId
      }
    });

    if (!existingSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update and close session
    const updateData = {
      isActive: false,
      endedAt: new Date()
    };
    if (currentAge !== undefined) updateData.currentAge = currentAge;
    if (maxMachines !== undefined) updateData.maxMachines = maxMachines;
    if (factoryWidth !== undefined) updateData.factoryWidth = factoryWidth;
    if (factoryHeight !== undefined) updateData.factoryHeight = factoryHeight;
    if (durationSeconds !== undefined) updateData.durationSeconds = durationSeconds;

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: updateData
    });

    res.json({ session });
  } catch (error) {
    next(error);
  }
});

export default router;
