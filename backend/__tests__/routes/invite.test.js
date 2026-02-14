
import { jest } from '@jest/globals';
import request from 'supertest';

// Mock User
const mockUser = {
  id: 'user-123',
  email: 'user@example.com',
  name: 'User',
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

const mockSendInviteEmail = jest.fn().mockResolvedValue(true);

// Mock Email Service
jest.unstable_mockModule('../../src/services/email.js', () => ({
  sendInviteEmail: mockSendInviteEmail,
  sendFeedbackEmail: jest.fn(),
  sendWelcomeEmail: jest.fn()
}));

// Mock Prisma
jest.unstable_mockModule('../../src/db.js', () => ({
  default: {}
}));

const { default: app } = await import('../../src/app.js');
const { resetInviteRecipientCooldownForTests } = await import('../../src/routes/invite.js');

beforeEach(() => {
  mockSendInviteEmail.mockClear();
  resetInviteRecipientCooldownForTests();
});

describe('POST /api/invite', () => {
  it('should send invite successfully', async () => {
    const res = await request(app)
      .post('/api/invite')
      .send({ email: 'friend@example.com' });

    expect(res.statusCode).toEqual(200);
    expect(mockSendInviteEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@example.com' }),
      'friend@example.com'
    );
  });

  it('should validate email format', async () => {
    const res = await request(app)
      .post('/api/invite')
      .send({ email: 'invalid-email' });

    expect(res.statusCode).toEqual(400);
    expect(mockSendInviteEmail).not.toHaveBeenCalled();
  });

  it('should require an email', async () => {
    const res = await request(app)
      .post('/api/invite')
      .send({});

    expect(res.statusCode).toEqual(400);
    expect(mockSendInviteEmail).not.toHaveBeenCalled();
  });

  it('should block repeated invites to the same recipient during cooldown', async () => {
    const first = await request(app)
      .post('/api/invite')
      .send({ email: 'friend@example.com' });

    const second = await request(app)
      .post('/api/invite')
      .send({ email: 'FRIEND@example.com' });

    expect(first.statusCode).toEqual(200);
    expect(second.statusCode).toEqual(429);
    expect(second.body.error).toMatch(/already invited/i);
    expect(mockSendInviteEmail).toHaveBeenCalledTimes(1);
  });

  it('should allow invites to different recipients', async () => {
    const first = await request(app)
      .post('/api/invite')
      .send({ email: 'friend1@example.com' });

    const second = await request(app)
      .post('/api/invite')
      .send({ email: 'friend2@example.com' });

    expect(first.statusCode).toEqual(200);
    expect(second.statusCode).toEqual(200);
    expect(mockSendInviteEmail).toHaveBeenCalledTimes(2);
  });
});
