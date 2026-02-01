import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { sendInviteEmail } from '../services/email.js';

const router = Router();

// Send invite email
router.post('/', authenticate, async (req, res, next) => {
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
