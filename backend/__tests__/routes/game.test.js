
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
    next();
  })
}));

const mockSaves = [
  { id: 'save-1', name: 'Save 1', userId: 'user-123', data: {}, createdAt: new Date(), updatedAt: new Date() }
];

// Mock Prisma
jest.unstable_mockModule('../../src/db.js', () => ({
  default: {
    gameSave: {
      findMany: jest.fn().mockResolvedValue(mockSaves),
      findFirst: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(mockSaves.find(s => s.id === where.id && s.userId === where.userId));
      }),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'new-save', ...data })),
      update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
      delete: jest.fn().mockResolvedValue({ id: 'deleted' })
    }
  }
}));

const { default: app } = await import('../../src/app.js');

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
});
