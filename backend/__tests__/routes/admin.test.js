
import { jest } from '@jest/globals';
import request from 'supertest';

// Mock Admin User
const mockAdmin = {
  id: 'admin-123',
  email: 'admin@example.com',
  name: 'Admin User',
  isApproved: true,
  role: 'ADMIN'
};

// Mock Auth Middleware
jest.unstable_mockModule('../../src/middleware/auth.js', () => ({
  authenticate: jest.fn().mockImplementation((req, res, next) => {
    req.user = mockAdmin;
    next();
  }),
  requireAdmin: jest.fn().mockImplementation((req, res, next) => {
    if (mockAdmin.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  }),
  requireApproval: jest.fn().mockImplementation((req, res, next) => {
    next();
  })
}));

// Mock Prisma
jest.unstable_mockModule('../../src/db.js', () => ({
  default: {
    user: {
      findMany: jest.fn().mockResolvedValue([mockAdmin, { id: 'u2', role: 'USER' }]),
      findUnique: jest.fn().mockResolvedValue({ id: 'u2', role: 'USER', isApproved: false }),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'u2', ...data })),
      delete: jest.fn().mockResolvedValue({ id: 'u2' }),
      count: jest.fn().mockResolvedValue(10)
    },
    session: {
      count: jest.fn().mockResolvedValue(5),
      aggregate: jest.fn().mockResolvedValue({ _avg: { durationSeconds: 100 } }),
      groupBy: jest.fn().mockResolvedValue([]),
      findMany: jest.fn().mockResolvedValue([])
    }
  }
}));

const { default: app } = await import('../../src/app.js');

describe('Admin Routes', () => {
  describe('GET /api/admin/users', () => {
    it('should return all users', async () => {
      const res = await request(app).get('/api/admin/users');
      expect(res.statusCode).toEqual(200);
      expect(res.body.users).toHaveLength(2);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return system stats', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.statusCode).toEqual(200);
      expect(res.body.stats.totalUsers).toBe(10);
    });
  });

  describe('PATCH /api/admin/users/:id/permissions', () => {
    it('should approve user', async () => {
      const res = await request(app)
        .patch('/api/admin/users/u2/permissions')
        .send({ isApproved: true });
        
      expect(res.statusCode).toEqual(200);
      expect(res.body.user.isApproved).toBe(true);
    });
  });
});
