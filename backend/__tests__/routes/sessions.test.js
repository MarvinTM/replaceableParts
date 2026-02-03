
import { jest } from '@jest/globals';
import request from 'supertest';

// Mock User
const mockUser = {
  id: 'user-123',
  email: 'user@example.com',
  name: 'User',
  isApproved: true,
  role: 'USER'
};

// Mock Auth Middleware
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

const mockSession = { id: 'session-1', userId: 'user-123', isActive: true };

// Mock Prisma
jest.unstable_mockModule('../../src/db.js', () => ({
  default: {
    session: {
      create: jest.fn().mockResolvedValue(mockSession),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findFirst: jest.fn().mockResolvedValue(mockSession),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockSession, ...data }))
    }
  }
}));

const { default: app } = await import('../../src/app.js');

describe('POST /api/sessions/start', () => {
  it('should start a new session', async () => {
    const res = await request(app)
      .post('/api/sessions/start')
      .send({ sessionType: 'new' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.session.id).toEqual('session-1');
  });
});

describe('PUT /api/sessions/heartbeat/:id', () => {
  it('should update session metrics', async () => {
    const res = await request(app)
      .put('/api/sessions/heartbeat/session-1')
      .send({ currentAge: 2, durationSeconds: 60 });

    expect(res.statusCode).toEqual(200);
    expect(res.body.session.currentAge).toEqual(2);
  });
});
