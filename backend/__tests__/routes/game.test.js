
import { jest } from '@jest/globals';
import request from 'supertest';

// Mock User for middleware
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  isApproved: true,
  role: 'USER'
};

// Mock Authenticate Middleware
jest.unstable_mockModule('../../src/middleware/auth.js', () => ({
  authenticate: jest.fn().mockImplementation((req, res, next) => {
    req.user = mockUser;
    next();
  }),
  requireApproval: jest.fn().mockImplementation((req, res, next) => {
    next();
  }),
  requireAdmin: jest.fn().mockImplementation((req, res, next) => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  })
}));

const mockSaves = [
  { id: 'save-1', name: 'Save 1', userId: 'user-123', data: { tick: 100 }, createdAt: new Date(), updatedAt: new Date() }
];

// Shared Prisma mock for consistency across imports
const mockPrisma = {
  gameSave: {
    findMany: jest.fn().mockResolvedValue(mockSaves),
    findFirst: jest.fn().mockImplementation(({ where }) =>
      Promise.resolve(mockSaves.find(s => s.id === where.id && s.userId === where.userId))
    ),
    count: jest.fn().mockResolvedValue(1),
    create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'new-save', ...data })),
    update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
    delete: jest.fn().mockResolvedValue({ id: 'deleted' })
  }
};

// Mock Prisma
jest.unstable_mockModule('../../src/db.js', () => ({
  default: mockPrisma
}));

const { default: app } = await import('../../src/app.js');

beforeEach(() => {
  jest.clearAllMocks();
  mockUser.role = 'USER';
});

describe('GET /api/game/saves', () => {
  it('should return all saves for current user', async () => {
    const res = await request(app).get('/api/game/saves');
    expect(res.statusCode).toEqual(200);
    expect(res.body.saves).toHaveLength(1);
    expect(res.body.saves[0].name).toEqual('Save 1');
  });
});

describe('POST /api/game/saves', () => {
  it('should create new save', async () => {
    const res = await request(app)
      .post('/api/game/saves')
      .send({ name: 'New Game', data: { score: 100 } });

    expect(res.statusCode).toEqual(201);
    expect(res.body.save.name).toEqual('New Game');
  });

  it('should enforce save limit', async () => {
    mockPrisma.gameSave.count.mockResolvedValueOnce(5);

    const res = await request(app)
      .post('/api/game/saves')
      .send({ name: 'Overflow', data: {} });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('SAVE_LIMIT_REACHED');
  });
});

describe('PUT /api/game/saves/:id', () => {
  it('should reject stale save updates that would reduce tick', async () => {
    const res = await request(app)
      .put('/api/game/saves/save-1')
      .send({ data: { tick: 48 } });

    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe('STALE_SAVE_REJECTED');
    expect(res.body.attemptedTick).toBe(48);
    expect(res.body.currentTick).toBe(100);
    expect(mockPrisma.gameSave.update).not.toHaveBeenCalled();
  });

  it('should allow save updates when tick is newer', async () => {
    const res = await request(app)
      .put('/api/game/saves/save-1')
      .send({ data: { tick: 150 } });

    expect(res.statusCode).toBe(200);
    expect(res.body.save.id).toBe('save-1');
    expect(mockPrisma.gameSave.update).toHaveBeenCalled();
  });

  it('should return 404 when save is missing', async () => {
    mockPrisma.gameSave.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/game/saves/missing')
      .send({ name: 'New Name' });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Save not found');
  });
});

describe('DELETE /api/game/saves/:id', () => {
  it('should return 404 when save is missing', async () => {
    mockPrisma.gameSave.findFirst.mockResolvedValueOnce(null);

    const res = await request(app).delete('/api/game/saves/missing');

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Save not found');
  });
});

describe('GET /api/game/saves/:id/export', () => {
  it('should reject non-admin users', async () => {
    const res = await request(app).get('/api/game/saves/save-1/export');
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Admin access required');
  });

  it('should export save payload for admin users', async () => {
    mockUser.role = 'ADMIN';

    const res = await request(app).get('/api/game/saves/save-1/export');

    expect(res.statusCode).toBe(200);
    expect(res.body.fileName).toMatch(/save-1/);
    expect(res.body.payload.format).toBe('replaceableParts-save');
    expect(res.body.payload.save.id).toBe('save-1');
  });
});

describe('POST /api/game/saves/import', () => {
  it('should reject non-admin users', async () => {
    const res = await request(app)
      .post('/api/game/saves/import')
      .send({
        payload: { state: { tick: 12 }, name: 'Legacy Import' }
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe('Admin access required');
  });

  it('should import into existing save when targetSaveId is provided', async () => {
    mockUser.role = 'ADMIN';

    const res = await request(app)
      .post('/api/game/saves/import')
      .send({
        targetSaveId: 'save-1',
        name: 'Imported Save',
        payload: {
          format: 'replaceableParts-save',
          version: 1,
          save: {
            name: 'Exported Name',
            data: { tick: 222 }
          }
        }
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.mode).toBe('overwrite');
    expect(mockPrisma.gameSave.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'save-1' },
        data: expect.objectContaining({
          name: 'Imported Save',
          data: { tick: 222 }
        })
      })
    );
  });

  it('should create a new save from legacy import payload', async () => {
    mockUser.role = 'ADMIN';

    const res = await request(app)
      .post('/api/game/saves/import')
      .send({
        payload: {
          name: 'Old Export',
          state: { tick: 500 }
        }
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.mode).toBe('create');
    expect(mockPrisma.gameSave.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-123',
          name: 'Old Export',
          data: { tick: 500 }
        })
      })
    );
  });

  it('should reject invalid import payloads', async () => {
    mockUser.role = 'ADMIN';

    const res = await request(app)
      .post('/api/game/saves/import')
      .send({
        payload: { bad: true }
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('INVALID_SAVE_FILE');
  });
});
