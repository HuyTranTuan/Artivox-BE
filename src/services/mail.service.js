const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || "gmail",
  auth: {
    user: process.env.MAIL_USER || "[EMAIL_ADDRESS]",
    pass: process.env.MAIL_PASS,
  },
});

async function sendMail({ to, subject, html, text }) {
  return transporter.sendMail({
    from: `"Artivox" <${process.env.MAIL_USER || "[EMAIL_ADDRESS]"}>`,
    to,
    subject,
    html,
    text,
  });
}

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

async function sendOrderModelEmail(to, customerName, orderId, models) {
  const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
  const { GetObjectCommand } = require("@aws-sdk/client-s3");
  const r2Client = require("@libs/r2");

  const baseUrl = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

  const links = await Promise.all(
    models.map(async (m) => {
      let url = m.sourceFileUrl || "";
      // Extract the R2 key from the public URL
      if (url.startsWith(baseUrl) && baseUrl) {
        const key = url.slice(baseUrl.length + 1);
        url = await getSignedUrl(
          r2Client,
          new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }),
          { expiresIn: 60 } // 1 minute
        );
      }
      return { name: m.name, url };
    })
  );

  const modelRows = links
    .map(
      (l) =>
        `<tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">${l.name}</td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;">
            <a href="${l.url}" style="background:#FF6B00;color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-weight:bold;">Download</a>
          </td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1a1a2e; padding: 32px; text-align: center; }
    .header h1 { color: #FF6B00; margin: 0; font-size: 26px; letter-spacing: 1px; }
    .body { padding: 32px; color: #333; }
    .body p { line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .notice { background: #fff8e1; border-left: 4px solid #FF6B00; padding: 12px 16px; border-radius: 4px; margin-top: 20px; font-size: 13px; color: #555; }
    .footer { text-align: center; padding: 16px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Artivox</h1></div>
    <div class="body">
      <p>Hi <strong>${customerName}</strong>,</p>
      <p>Your order <strong>#${orderId}</strong> has been confirmed. Your purchased 3D models are ready to download:</p>
      <table>${modelRows}</table>
      <div class="notice">⏱ These download links expire in <strong>10 minutes</strong>. If they expire, you can request new links from your order history.</div>
    </div>
    <div class="footer">© ${new Date().getFullYear()} Artivox. All rights reserved.</div>
  </div>
</body>
</html>`;

  return sendMail({ to, subject: `Your Artivox order #${orderId} is ready to download`, html });
}

module.exports = { sendMail, sendVerificationEmail, sendResetPasswordEmail, sendOrderModelEmail };
