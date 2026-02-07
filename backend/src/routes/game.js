import { Router } from 'express';
import prisma from '../db.js';
import { authenticate, requireApproval, requireAdmin } from '../middleware/auth.js';

const router = Router();
const EXPORT_FORMAT = 'replaceableParts-save';
const EXPORT_VERSION = 1;
const MAX_SAVE_NAME_LENGTH = 50;

// All game routes require authentication and approval
router.use(authenticate, requireApproval);

function extractTick(gameState) {
  if (!gameState || typeof gameState !== 'object') return null;
  const rawTick = gameState.tick;
  return typeof rawTick === 'number' && Number.isFinite(rawTick) ? rawTick : null;
}

function logSaveDiagnostics(event, payload) {
  console.log(`[GameSaveDiag] ${event}`, payload);
}

function normalizeSaveName(name, fallback = 'Imported Save') {
  if (typeof name !== 'string') return fallback;
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, MAX_SAVE_NAME_LENGTH);
}

function toSafeSlug(value) {
  return String(value || 'save')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'save';
}

function normalizeImportedPayload(rawPayload) {
  if (!rawPayload || typeof rawPayload !== 'object' || Array.isArray(rawPayload)) {
    throw new Error('Invalid import payload');
  }

  if (rawPayload.format && rawPayload.format !== EXPORT_FORMAT) {
    throw new Error('Unsupported save file format');
  }

  if (rawPayload.version !== undefined && !Number.isInteger(rawPayload.version)) {
    throw new Error('Invalid save file version');
  }

  let name;
  let data;

  if (rawPayload.save && typeof rawPayload.save === 'object' && !Array.isArray(rawPayload.save)) {
    name = rawPayload.save.name ?? rawPayload.name;
    data = rawPayload.save.data;
  } else if (rawPayload.state !== undefined) {
    // Backward compatibility with old local export shape.
    name = rawPayload.name;
    data = rawPayload.state;
  } else if (rawPayload.data !== undefined) {
    // Backward compatibility with direct save object shape.
    name = rawPayload.name;
    data = rawPayload.data;
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid save file data');
  }

  return { name, data };
}

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

    logSaveDiagnostics('load_served', {
      userId: req.user.id,
      saveId: save.id,
      tick: extractTick(save.data),
      updatedAt: save.updatedAt,
      clientTabId: req.headers['x-client-tab-id'] || null,
      clientRoute: req.headers['x-client-route'] || null,
      loadReason: req.headers['x-load-reason'] || null,
      loadRequestId: req.headers['x-load-request-id'] || null
    });

    res.json({ save });
  } catch (error) {
    next(error);
  }
});

// Export specific save (admin only)
router.get('/saves/:id/export', requireAdmin, async (req, res, next) => {
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

    const payload = {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      save: {
        id: save.id,
        name: save.name,
        createdAt: save.createdAt,
        updatedAt: save.updatedAt,
        data: save.data
      },
      meta: {
        source: 'replaceableParts',
        exportedByUserId: req.user.id
      }
    };

    const fileName = `${toSafeSlug(save.name)}-${save.id}.rpsave.json`;
    res.json({ fileName, payload });
  } catch (error) {
    next(error);
  }
});

// Maximum number of saves per user
const MAX_SAVES_PER_USER = 5;

// Create new save
router.post('/saves', async (req, res, next) => {
  try {
    const { name, data } = req.body;

    // Check current save count
    const currentSaveCount = await prisma.gameSave.count({
      where: { userId: req.user.id }
    });

    if (currentSaveCount >= MAX_SAVES_PER_USER) {
      return res.status(400).json({
        error: 'SAVE_LIMIT_REACHED',
        message: `Maximum save limit of ${MAX_SAVES_PER_USER} reached`,
        maxSaves: MAX_SAVES_PER_USER
      });
    }

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

// Import save payload into a new or existing slot (admin only)
router.post('/saves/import', requireAdmin, async (req, res, next) => {
  try {
    const { targetSaveId, name, payload } = req.body || {};

    if (!payload) {
      return res.status(400).json({ error: 'Missing import payload' });
    }

    let imported;
    try {
      imported = normalizeImportedPayload(payload);
    } catch (parseError) {
      return res.status(400).json({
        error: 'INVALID_SAVE_FILE',
        message: parseError.message
      });
    }

    const saveName = normalizeSaveName(name ?? imported.name);

    if (targetSaveId) {
      const existingSave = await prisma.gameSave.findFirst({
        where: {
          id: targetSaveId,
          userId: req.user.id
        }
      });

      if (!existingSave) {
        return res.status(404).json({ error: 'Save not found' });
      }

      const save = await prisma.gameSave.update({
        where: { id: targetSaveId },
        data: {
          name: saveName,
          data: imported.data
        }
      });

      return res.json({ save, mode: 'overwrite' });
    }

    const currentSaveCount = await prisma.gameSave.count({
      where: { userId: req.user.id }
    });

    if (currentSaveCount >= MAX_SAVES_PER_USER) {
      return res.status(400).json({
        error: 'SAVE_LIMIT_REACHED',
        message: `Maximum save limit of ${MAX_SAVES_PER_USER} reached`,
        maxSaves: MAX_SAVES_PER_USER
      });
    }

    const save = await prisma.gameSave.create({
      data: {
        userId: req.user.id,
        name: saveName,
        data: imported.data
      }
    });

    res.status(201).json({ save, mode: 'create' });
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

    const incomingTick = extractTick(data);
    const existingTick = extractTick(existingSave.data);
    const diagnostics = {
      userId: req.user.id,
      saveId: req.params.id,
      existingTick,
      incomingTick,
      existingUpdatedAt: existingSave.updatedAt,
      clientTabId: req.headers['x-client-tab-id'] || null,
      clientRoute: req.headers['x-client-route'] || null,
      saveReason: req.headers['x-save-reason'] || null,
      saveRequestId: req.headers['x-save-request-id'] || null,
      clientMeta: req.body?.meta || null
    };

    if (data !== undefined) {
      logSaveDiagnostics('save_update_attempt', diagnostics);
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (data !== undefined) {
      // Guard against stale writes: never allow a lower tick to overwrite a higher tick.
      // This protects against refresh/HMR races, delayed requests, and multi-tab collisions.
      if (incomingTick !== null && existingTick !== null && incomingTick < existingTick) {
        logSaveDiagnostics('save_update_rejected_stale', diagnostics);
        return res.status(409).json({
          error: 'STALE_SAVE_REJECTED',
          code: 'STALE_SAVE_REJECTED',
          message: 'Incoming save state is older than the current saved state',
          attemptedTick: incomingTick,
          currentTick: existingTick
        });
      }
      updateData.data = data;
    }

    const save = await prisma.gameSave.update({
      where: { id: req.params.id },
      data: updateData
    });

    logSaveDiagnostics('save_update_applied', {
      ...diagnostics,
      resultingUpdatedAt: save.updatedAt,
      resultingTick: data !== undefined ? incomingTick : existingTick
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
