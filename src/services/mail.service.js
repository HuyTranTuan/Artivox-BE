const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || "gmail",
  auth: {
    user: process.env.MAIL_USER || "[EMAIL_ADDRESS]",
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Send a raw email
 * @param {Object} opts - { to, subject, html, text }
 */
async function sendMail({ to, subject, html, text }) {
  return transporter.sendMail({
    from: `"Artivox" <${process.env.MAIL_USER || "[EMAIL_ADDRESS]"}>`,
    to,
    subject,
    html,
    text,
  });
}

/**
 * Send email-verification email
 * @param {string} to - recipient email
 * @param {string} token - JWT access token
 */
async function sendVerificationEmail(to, token) {
  const feCustomerUrl = process.env.FE_CUSTOMER_URL || "http://localhost:3000";
  const verifyUrl = `${feCustomerUrl}/auth/verify-email?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1a1a2e; padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px; }
    .body { padding: 32px; color: #333; }
    .body p { line-height: 1.6; }
    .btn { display: block; width: fit-content; margin: 24px auto; padding: 14px 36px; background: #6c63ff; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
    .footer { text-align: center; padding: 16px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Artivox</h1></div>
    <div class="body">
      <p>Hi there,</p>
      <p>Thank you for registering at <strong>Artivox</strong>. Please verify your email by clicking the button below:</p>
      <a class="btn" href="${verifyUrl}">Verify Email</a>
      <p>This link will expire in <strong>1 hour</strong>.</p>
      <p>If you didn't create an account, you can ignore this email.</p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} Artivox. All rights reserved.</div>
  </div>
</body>
</html>`;

  return sendMail({ to, subject: "Verify your Artivox account", html });
}

async function sendResetPasswordEmail(to, token, userType = "customer") {
  const feUrl = process.env.FE_CUSTOMER_URL || "http://localhost:3000";
  const resetUrl = `${feUrl}/auth/reset-password?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #FF6B00; padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px; }
    .body { padding: 32px; color: #333; }
    .body p { line-height: 1.6; }
    .btn { display: block; width: fit-content; margin: 24px auto; padding: 14px 36px; background: #FF6B00; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }
    .footer { text-align: center; padding: 16px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Artivox</h1></div>
    <div class="body">
      <p>Hi there,</p>
      <p>We received a request to reset your <strong>Artivox</strong> account password. Click the button below to reset it:</p>
      <a class="btn" href="${resetUrl}">Reset Password</a>
      <p>This link will expire in <strong>1 hour</strong>.</p>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} Artivox. All rights reserved.</div>
  </div>
</body>
</html>`;

  return sendMail({ to, subject: "Reset your Artivox password", html });
}

module.exports = { sendMail, sendVerificationEmail, sendResetPasswordEmail };
