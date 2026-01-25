import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { sendWelcomeEmail } from '../services/email.js';

const router = Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verify Google token and create/login user
router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if this is the first user (will be admin)
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { googleId }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId,
          email,
          name,
          picture,
          role: isFirstUser ? 'ADMIN' : 'USER',
          isApproved: true
        }
      });

      // Send welcome email (non-blocking)
      sendWelcomeEmail(user).catch(err => {
        console.error('Failed to send welcome email:', err);
      });
    } else {
      // Update user info on login
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name,
          picture,
          lastLoginAt: new Date()
        }
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    if (error.message?.includes('Token used too late') ||
        error.message?.includes('Invalid token')) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
      role: req.user.role,
      isApproved: req.user.isApproved
    }
  });
});

// Logout (client-side, but we can track last activity)
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { lastLoginAt: new Date() }
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
