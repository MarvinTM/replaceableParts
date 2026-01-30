import jwt from 'jsonwebtoken';
import prisma from '../db.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // Try Authorization header first, fall back to _token in body (for sendBeacon)
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.body && req.body._token) {
      // Fallback for sendBeacon requests which can't set headers
      token = req.body._token;
      // Remove _token from body so it doesn't interfere with other processing
      delete req.body._token;
    }

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    next(error);
  }
}

export function requireApproval(req, res, next) {
  if (!req.user.isApproved && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Account not approved',
      code: 'NOT_APPROVED'
    });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
