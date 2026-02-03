
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

const mockSession = { id: 'session-1', userId: 'user-123', isActive: true };

// Shared Prisma mock
const mockPrisma = {
  session: {
    create: jest.fn().mockResolvedValue(mockSession),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    findFirst: jest.fn().mockResolvedValue(mockSession),
    update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockSession, ...data }))
  }
};

// Mock Auth Middleware
jest.unstable_mockModule('../../src/middleware/auth.js', () => ({
  authenticate: jest.fn().mockImplementation((req, res, next) => {
    req.user = mockUser;
    next();
  }),
  requireApproval: jest.fn().mockImplementation((req, res, next) => {
    if (!req.user.isApproved && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Account not approved', code: 'NOT_APPROVED' });
    }
    next();
  }),
  requireAdmin: jest.fn().mockImplementation((req, res, next) => {
    next();
  })
}));

// Mock Prisma
jest.unstable_mockModule('../../src/db.js', () => ({
  default: mockPrisma
}));

const { default: app } = await import('../../src/app.js');

describe('POST /api/sessions/start', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser.isApproved = true;
    // ensure create resolves active session with defaults
    mockPrisma.session.create.mockResolvedValue({ ...mockSession, isActive: true });
    mockPrisma.session.findFirst.mockResolvedValue(mockSession);
  });

  it('should start a new session', async () => {
    const res = await request(app)
      .post('/api/sessions/start')
      .send({ sessionType: 'new' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.session.id).toEqual('session-1');
  });

  it('should close existing active sessions before starting', async () => {
    await request(app).post('/api/sessions/start').send({});

    expect(mockPrisma.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: mockUser.id, isActive: true })
      })
    );
  });

  it('should reject unapproved users', async () => {
    mockUser.isApproved = false;

    const res = await request(app).post('/api/sessions/start').send({});
    expect(res.statusCode).toBe(403);

    mockUser.isApproved = true;
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

  it('should return 404 when session not found', async () => {
    mockPrisma.session.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/sessions/heartbeat/unknown')
      .send({ currentAge: 2 });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Session not found');
  });
});

describe('POST /api/sessions/end/:id', () => {
  it('should end an existing session', async () => {
    mockPrisma.session.findFirst.mockResolvedValueOnce(mockSession);

    const res = await request(app)
      .post('/api/sessions/end/session-1')
      .send({ durationSeconds: 120 });

    expect(res.statusCode).toBe(200);
    expect(res.body.session.isActive).toBe(false);
  });

  it('should return 404 for missing session', async () => {
    mockPrisma.session.findFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/sessions/end/missing')
      .send({});

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Session not found');
  });
});
