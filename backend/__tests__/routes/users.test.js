import { jest } from '@jest/globals';
import request from 'supertest';

// Mock User for middleware
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  isApproved: true,
  role: 'USER',
  createdAt: new Date().toISOString()
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

// Mock Prisma
jest.unstable_mockModule('../../src/db.js', () => ({
  default: {
    user: {
      update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ 
          id: where.id, 
          email: mockUser.email,
          role: mockUser.role,
          isApproved: mockUser.isApproved,
          ...data 
      }))
    }
  }
}));

const { default: app } = await import('../../src/app.js');

describe('GET /api/users/profile', () => {
  it('should return current user profile', async () => {
    const res = await request(app).get('/api/users/profile');
    expect(res.statusCode).toEqual(200);
    expect(res.body.email).toEqual('test@example.com');
  });
});

describe('PATCH /api/users/profile', () => {
  it('should update user profile name', async () => {
    const res = await request(app)
      .patch('/api/users/profile')
      .send({ name: 'New Name' });
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toEqual('New Name');
  });
});