import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { sendFeedbackEmail } from '../services/email.js';

const router = Router();
const feedbackRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Too many feedback submissions. Please try again later.',
  keyGenerator: req => req.user?.id || req.ip
});

// Send feedback email
router.post('/', authenticate, feedbackRateLimit, async (req, res, next) => {
  try {
    const { title, body } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Body is required' });
    }

    // Send feedback email
    await sendFeedbackEmail(req.user, title.trim(), body.trim());

    res.json({ message: 'Feedback sent successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
