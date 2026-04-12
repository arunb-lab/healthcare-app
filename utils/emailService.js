const nodemailer = require("nodemailer");

/**
 * Send an email using Nodemailer
 * @param {Object} options - { email, subject, message, html }
 */
const sendEmail = async (options) => {
  // 1) Create a transporter
  // Using Mailtrap for demo/dev purposes by default.
  // Can be easily switched to Gmail/SendGrid in .env
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
    port: process.env.SMTP_PORT || 2525,
    auth: {
      user: process.env.SMTP_USER || "your_mailtrap_user",
      pass: process.env.SMTP_PASS || "your_mailtrap_pass",
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: `"Healthseva Support" <no-reply@healthseva.com>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // 3) Actually send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Sent to ${options.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("[EMAIL] Error sending email:", error);
    throw error; // Let the controller handle it
  }
};

module.exports = sendEmail;
