
import { jest } from '@jest/globals';

// Mock JWT
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: jest.fn()
  }
}));

// Mock Prisma
jest.unstable_mockModule('../../src/db.js', () => ({
  default: {
    user: {
      findUnique: jest.fn()
    }
  }
}));

const { authenticate, requireApproval } = await import('../../src/middleware/auth.js');
const { default: jwt } = await import('jsonwebtoken');
const { default: prisma } = await import('../../src/db.js');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    req = {
      headers: {},
      body: {},
      baseUrl: '',
      method: 'GET',
      path: ''
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should attach user to request with valid JWT', async () => {
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ userId: 'user-123' });
      prisma.user.findUnique.mockResolvedValue({ id: 'user-123', name: 'Test' });

      await authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('user-123');
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 with missing token', async () => {
      await authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept token from body for session end beacon', async () => {
      req.baseUrl = '/api/sessions';
      req.method = 'POST';
      req.path = '/end/session-1';
      req.body._token = 'beacon-token';
      jwt.verify.mockReturnValue({ userId: 'user-123' });
      prisma.user.findUnique.mockResolvedValue({ id: 'user-123', name: 'Test' });

      await authenticate(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('beacon-token', 'test-secret');
      expect(req.body._token).toBeUndefined();
      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalled();
    });

    it('should accept token from body for game save beacon', async () => {
      req.baseUrl = '/api/game';
      req.method = 'PUT';
      req.path = '/saves/save-1';
      req.body._token = 'beacon-token';
      jwt.verify.mockReturnValue({ userId: 'user-123' });
      prisma.user.findUnique.mockResolvedValue({ id: 'user-123', name: 'Test' });

      await authenticate(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('beacon-token', 'test-secret');
      expect(req.body._token).toBeUndefined();
      expect(req.user).toBeDefined();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireApproval', () => {
    it('should continue for approved users', () => {
      req.user = { isApproved: true };
      requireApproval(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return 403 for unapproved users', () => {
      req.user = { isApproved: false, role: 'USER' };
      requireApproval(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
