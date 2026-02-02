import { jest } from '@jest/globals';
import request from 'supertest';

// In ESM, we must mock BEFORE importing the module that uses them.
// And we must use dynamic import for the app.

// Mock Google Auth
jest.unstable_mockModule('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      getPayload: () => ({
        sub: 'google-id-123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'test.png'
      })
    })
  }))
}));

// Create mock objects outside so they can be referenced
const mockUserCreate = jest.fn().mockResolvedValue({
  id: 'user-id-123',
  googleId: 'google-id-123',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'test.png',
  role: 'ADMIN',
  isApproved: true
});

const mockUserCount = jest.fn().mockResolvedValue(0);
const mockUserFindUnique = jest.fn().mockResolvedValue(null);
const mockUserUpdate = jest.fn().mockImplementation(({ data }) => Promise.resolve({
    id: 'user-id-123',
    ...data
}));

// Mock Prisma
jest.unstable_mockModule('../../src/db.js', () => ({
  default: {
    user: {
      count: mockUserCount,
      findUnique: mockUserFindUnique,
      create: mockUserCreate,
      update: mockUserUpdate
    }
  }
}));

// Mock Email Service
jest.unstable_mockModule('../../src/services/email.js', () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendFeedbackEmail: jest.fn().mockResolvedValue(true),
  sendInviteEmail: jest.fn().mockResolvedValue(true),
  default: {
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendFeedbackEmail: jest.fn().mockResolvedValue(true),
    sendInviteEmail: jest.fn().mockResolvedValue(true)
  }
}));

const { default: app } = await import('../../src/app.js');

describe('POST /api/auth/google', () => {
  it('should create new user on first login', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'mock-token' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.user.email).toEqual('test@example.com');
    expect(res.body.token).toBeDefined();
    expect(mockUserCreate).toHaveBeenCalled();
  });
});