import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to frontend assets (relative to backend/src/services/)
const ASSETS_PATH = path.join(__dirname, '../../../frontend/public/assets');

// Create reusable transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('Email service not configured - emails will be skipped');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

/**
 * Send welcome email to new user
 * @param {Object} user - User object with email and name
 */
export async function sendWelcomeEmail(user) {
  const transport = getTransporter();

  if (!transport) {
    console.log(`Skipping welcome email for ${user.email} - email not configured`);
    return;
  }

  const appName = 'replaceableParts';
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

  const mailOptions = {
    from: `"${appName}" <${fromAddress}>`,
    to: user.email,
    subject: `Welcome to ${appName}!`,
    html: generateWelcomeEmailHtml(user),
    text: generateWelcomeEmailText(user)
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log(`Welcome email sent to ${user.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Failed to send welcome email to ${user.email}:`, error.message);
  }
}

function generateWelcomeEmailHtml(user) {
  const name = user.name || 'Player';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to replaceableParts</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to replaceableParts!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px;">Hello <strong>${name}</strong>,</p>

    <p>Thank you for joining replaceableParts - the manufacturing simulation game where you build and manage your own production empire!</p>

    <h2 style="color: #667eea; font-size: 18px;">Getting Started</h2>
    <ul style="padding-left: 20px;">
      <li>Build your factory and place machines on the production floor</li>
      <li>Explore new territories to discover resources</li>
      <li>Research new technologies to unlock advanced recipes</li>
      <li>Trade goods in the market to grow your empire</li>
    </ul>

    <h2 style="color: #667eea; font-size: 18px;">We Value Your Feedback</h2>
    <p>As you play, we'd love to hear your thoughts! Your feedback helps us make the game better for everyone. Feel free to share suggestions, report bugs, or let us know what features you'd like to see.</p>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${frontendUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Start Playing</a>
    </div>

    <p style="margin-top: 30px; color: #666; font-size: 14px;">Happy manufacturing!</p>
    <p style="color: #666; font-size: 14px;">The replaceableParts Team</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>This email was sent because you signed up for replaceableParts.</p>
  </div>
</body>
</html>
  `;
}

function generateWelcomeEmailText(user) {
  const name = user.name || 'Player';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  return `
Welcome to replaceableParts!

Hello ${name},

Thank you for joining replaceableParts - the manufacturing simulation game where you build and manage your own production empire!

GETTING STARTED
- Build your factory and place machines on the production floor
- Explore new territories to discover resources
- Research new technologies to unlock advanced recipes
- Trade goods in the market to grow your empire

WE VALUE YOUR FEEDBACK
As you play, we'd love to hear your thoughts! Your feedback helps us make the game better for everyone. Feel free to share suggestions, report bugs, or let us know what features you'd like to see.

Start playing: ${frontendUrl}

Happy manufacturing!
The replaceableParts Team
  `.trim();
}

/**
 * Send feedback email from a user
 * @param {Object} user - User object with email and name
 * @param {string} title - Feedback title/subject
 * @param {string} body - Feedback body/message
 */
export async function sendFeedbackEmail(user, title, body) {
  const transport = getTransporter();

  if (!transport) {
    console.log(`Skipping feedback email from ${user.email} - email not configured`);
    return;
  }

  const feedbackRecipient = process.env.FEEDBACK_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER;
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

  const mailOptions = {
    from: `"replaceableParts Feedback" <${fromAddress}>`,
    to: feedbackRecipient,
    replyTo: user.email,
    subject: `Feedback: ${title}`,
    html: generateFeedbackEmailHtml(user, title, body),
    text: generateFeedbackEmailText(user, title, body)
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log(`Feedback email sent from ${user.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Failed to send feedback email from ${user.email}:`, error.message);
    throw error;
  }
}

function generateFeedbackEmailHtml(user, title, body) {
  const name = user.name || 'Anonymous';
  const bodyHtml = body.replace(/\n/g, '<br>');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Feedback</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">User Feedback</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <h2 style="color: #667eea; font-size: 20px; margin-top: 0;">${title}</h2>

    <div style="background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #667eea; margin: 20px 0;">
      <p style="margin: 0; white-space: pre-wrap;">${bodyHtml}</p>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <p style="margin: 5px 0; color: #666;"><strong>From:</strong> ${name}</p>
      <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${user.email}</p>
      <p style="margin: 5px 0; color: #666; font-size: 12px;"><em>You can reply directly to this email to respond to the user.</em></p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateFeedbackEmailText(user, title, body) {
  const name = user.name || 'Anonymous';

  return `
USER FEEDBACK
=============

Title: ${title}

Message:
${body}

---
From: ${name}
Email: ${user.email}

You can reply directly to this email to respond to the user.
  `.trim();
}

/**
 * Send invite email to a friend
 * @param {Object} inviter - User object of the person sending the invite
 * @param {string} recipientEmail - Email address of the friend to invite
 */
export async function sendInviteEmail(inviter, recipientEmail) {
  const transport = getTransporter();

  if (!transport) {
    console.log(`Skipping invite email to ${recipientEmail} - email not configured`);
    return;
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

  const mailOptions = {
    from: `"replaceableParts" <${fromAddress}>`,
    to: recipientEmail,
    subject: `${inviter.name || 'A friend'} has invited you to play replaceableParts!`,
    html: generateInviteEmailHtml(inviter),
    text: generateInviteEmailText(inviter),
    attachments: [
      {
        filename: 'logo.png',
        path: path.join(ASSETS_PATH, 'smallLogo.png'),
        cid: 'logo@replaceableparts'
      },
      {
        filename: 'preview.png',
        path: path.join(ASSETS_PATH, 'invite_preview.png'),
        cid: 'preview@replaceableparts'
      }
    ]
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log(`Invite email sent to ${recipientEmail} from ${inviter.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Failed to send invite email to ${recipientEmail}:`, error.message);
    throw error;
  }
}

function generateInviteEmailHtml(inviter) {
  const inviterName = inviter.name || 'A friend';
  const gameUrl = 'https://replaceable.parts/';

  // Theme colors from theme.js
  const colors = {
    headerBg: '#8B5A2B',      // Copper/bronze primary
    contentBg: '#F4E4C9',     // Parchment cream
    cardBg: '#FAF3E6',        // Warm cream
    textPrimary: '#2D2520',   // Dark brown
    textSecondary: '#5C4B3A', // Medium brown
    border: '#D4C4A8',        // Light tan
    ctaButton: '#8B5A2B',     // Copper/bronze
    ctaText: '#FDF8F0'        // Light text
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to play replaceableParts!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: ${colors.textPrimary}; max-width: 600px; margin: 0 auto; padding: 20px; background-color: ${colors.contentBg};">
  <div style="background: ${colors.headerBg}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <img src="cid:logo@replaceableparts" alt="replaceableParts" style="max-width: 200px; height: auto;" />
  </div>

  <div style="background: ${colors.cardBg}; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid ${colors.border}; border-top: none;">
    <h1 style="color: ${colors.textPrimary}; font-size: 24px; margin-top: 0; text-align: center;">
      ${inviterName} has invited you to play replaceableParts!
    </h1>

    <div style="text-align: center; margin: 25px 0;">
      <img src="cid:preview@replaceableparts" alt="replaceableParts Game Preview" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid ${colors.border};" />
    </div>

    <p style="color: ${colors.textSecondary}; font-size: 16px; text-align: center;">
      Build and manage your own manufacturing empire in this engaging simulation game.
      Explore new territories, research technologies, and trade goods to grow your factory!
    </p>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${gameUrl}" style="background: ${colors.ctaButton}; color: ${colors.ctaText}; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 18px;">Play Now</a>
    </div>

    <p style="margin-top: 30px; color: ${colors.textSecondary}; font-size: 14px; text-align: center;">
      Join ${inviterName} and start building your manufacturing empire today!
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: ${colors.textSecondary}; font-size: 12px;">
    <p>This invitation was sent by ${inviterName} via replaceableParts.</p>
  </div>
</body>
</html>
  `;
}

function generateInviteEmailText(inviter) {
  const inviterName = inviter.name || 'A friend';
  const gameUrl = 'https://replaceable.parts/';

  return `
${inviterName} has invited you to play replaceableParts!

Build and manage your own manufacturing empire in this engaging simulation game.
Explore new territories, research technologies, and trade goods to grow your factory!

Start playing now: ${gameUrl}

Join ${inviterName} and start building your manufacturing empire today!

---
This invitation was sent by ${inviterName} via replaceableParts.
  `.trim();
}

export default {
  sendWelcomeEmail,
  sendFeedbackEmail,
  sendInviteEmail
};
