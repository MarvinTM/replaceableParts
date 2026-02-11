import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { sendInviteEmail } from '../services/email.js';

const router = Router();
const inviteRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many invites sent. Please try again later.',
  keyGenerator: req => req.user?.id || req.ip
});

// Send invite email
router.post('/', authenticate, inviteRateLimit, async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Send invite email
    await sendInviteEmail(req.user, email.trim());

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
