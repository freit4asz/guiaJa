const nodemailer = require('nodemailer');

function isConfigured() {
  return Boolean(
    process.env.ADMIN_EMAIL &&
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  );
}

function createTransporter() {
  if (!isConfigured()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
}

module.exports = {isConfigured, createTransporter};
