import nodemailer from 'nodemailer';

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

  const appName = 'Replaceable Parts';
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
  <title>Welcome to Replaceable Parts</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Replaceable Parts!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px;">Hello <strong>${name}</strong>,</p>

    <p>Thank you for joining Replaceable Parts - the manufacturing simulation game where you build and manage your own production empire!</p>

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
    <p style="color: #666; font-size: 14px;">The Replaceable Parts Team</p>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>This email was sent because you signed up for Replaceable Parts.</p>
  </div>
</body>
</html>
  `;
}

function generateWelcomeEmailText(user) {
  const name = user.name || 'Player';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  return `
Welcome to Replaceable Parts!

Hello ${name},

Thank you for joining Replaceable Parts - the manufacturing simulation game where you build and manage your own production empire!

GETTING STARTED
- Build your factory and place machines on the production floor
- Explore new territories to discover resources
- Research new technologies to unlock advanced recipes
- Trade goods in the market to grow your empire

WE VALUE YOUR FEEDBACK
As you play, we'd love to hear your thoughts! Your feedback helps us make the game better for everyone. Feel free to share suggestions, report bugs, or let us know what features you'd like to see.

Start playing: ${frontendUrl}

Happy manufacturing!
The Replaceable Parts Team
  `.trim();
}

export default {
  sendWelcomeEmail
};
