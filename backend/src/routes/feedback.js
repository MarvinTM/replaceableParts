import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { sendFeedbackEmail } from '../services/email.js';

const router = Router();

// Send feedback email
router.post('/', authenticate, async (req, res, next) => {
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
