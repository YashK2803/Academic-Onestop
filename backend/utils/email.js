// backend/utils/email.js

const nodemailer = require('nodemailer');

// Send an email (async)
async function sendEmail({ to, subject, text, html }) {
  // Configure your mail transport (use environment variables in production)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your.email@gmail.com',
      pass: process.env.EMAIL_PASS || 'yourpassword',
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER || 'your.email@gmail.com',
    to,
    subject,
    text,
    html,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendEmail,
};
