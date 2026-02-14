import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { sendInviteEmail } from '../services/email.js';

const router = Router();

const INVITE_HOURLY_LIMIT = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Invite hourly limit reached. Please try again later.',
  keyGenerator: req => req.user?.id || req.ip
});

const INVITE_DAILY_LIMIT = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  message: 'Invite daily limit reached. Please try again tomorrow.',
  keyGenerator: req => req.user?.id || req.ip
});

const INVITE_RECIPIENT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const inviteRecipientCooldowns = new Map();

function normalizeInviteEmail(email) {
  return email.trim().toLowerCase();
}

function getInviteCooldownKey(req, recipientEmail) {
  const senderKey = req.user?.id || req.ip || 'global';
  return `${senderKey}:${recipientEmail}`;
}

function cleanupExpiredCooldowns(now) {
  if (inviteRecipientCooldowns.size <= 1000) {
    return;
  }

  for (const [key, expiresAt] of inviteRecipientCooldowns.entries()) {
    if (expiresAt <= now) {
      inviteRecipientCooldowns.delete(key);
    }
  }
}

export function resetInviteRecipientCooldownForTests() {
  inviteRecipientCooldowns.clear();
}

// Send invite email
router.post('/', authenticate, INVITE_HOURLY_LIMIT, INVITE_DAILY_LIMIT, async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const now = Date.now();
    cleanupExpiredCooldowns(now);

    const normalizedEmail = normalizeInviteEmail(email);
    const cooldownKey = getInviteCooldownKey(req, normalizedEmail);
    const existingCooldownExpiry = inviteRecipientCooldowns.get(cooldownKey);

    if (existingCooldownExpiry && existingCooldownExpiry > now) {
      const retryAfterSeconds = Math.ceil((existingCooldownExpiry - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        error: 'You already invited this person recently. Please try again next week.'
      });
    }

    // Send invite email
    await sendInviteEmail(req.user, email.trim());
    inviteRecipientCooldowns.set(cooldownKey, now + INVITE_RECIPIENT_COOLDOWN_MS);

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
