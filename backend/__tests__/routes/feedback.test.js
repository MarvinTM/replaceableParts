
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

const mockSendFeedbackEmail = jest.fn().mockResolvedValue(true);

// Mock Email Service
jest.unstable_mockModule('../../src/services/email.js', () => ({
  sendFeedbackEmail: mockSendFeedbackEmail,
  sendWelcomeEmail: jest.fn(),
  sendInviteEmail: jest.fn()
}));

// Mock Prisma (needed because app imports db)
jest.unstable_mockModule('../../src/db.js', () => ({
  default: {}
}));

const { default: app } = await import('../../src/app.js');

describe('POST /api/feedback', () => {
  it('should submit feedback successfully', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({ title: 'Bug Report', body: 'Found a glitch' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.message).toMatch(/success/i);
    expect(mockSendFeedbackEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'user@example.com' }),
        'Bug Report',
        'Found a glitch'
    );
  });

  it('should validate required fields', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .send({ title: '' }); // Missing body

    expect(res.statusCode).toEqual(400);
  });
});
