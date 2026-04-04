const nodemailer = require('nodemailer');

const transportConfig = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

let transporter;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport(transportConfig);
} else {
  console.warn('SMTP configuration is missing. Email delivery is disabled.');
}

async function sendEmail({ to, subject, text, html }) {
  if (!transporter) {
    console.warn('Email not sent because SMTP is not configured:', { to, subject });
    return null;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@edushare.local',
    to,
    subject,
    text,
    html
  };

  return transporter.sendMail(mailOptions);
}

async function sendWelcomeEmail({ to, name, email, password }) {
  const subject = 'Welcome to EduShare';
  const text = `Hello ${name},\n\nYour EduShare account has been created by an administrator. You can sign in with the following credentials:\n\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after logging in.\n\nThanks,\nThe EduShare Team`;
  const html = `<p>Hello ${name},</p><p>Your EduShare account has been created by an administrator.</p><p><strong>Email:</strong> ${email}<br /><strong>Password:</strong> ${password}</p><p>Please change your password after logging in.</p><p>Thanks,<br />The EduShare Team</p>`;

  return sendEmail({ to, subject, text, html });
}

async function sendWarningEmail({ to, name }) {
  const subject = 'EduShare Community Guidelines Warning';
  const text = `Hello ${name},\n\nWe have received reports that one of your comments on EduShare may have violated our platform's community guidelines. Please review our guidelines and ensure all future comments adhere to them.\n\nIf you continue to post inappropriate content, your account may be suspended.\n\nThanks,\nThe EduShare Team`;
  const html = `<p>Hello ${name},</p><p>We have received reports that one of your comments on EduShare may have violated our platform's community guidelines. Please review our guidelines and ensure all future comments adhere to them.</p><p>If you continue to post inappropriate content, your account may be suspended.</p><p>Thanks,<br />The EduShare Team</p>`;

  return sendEmail({ to, subject, text, html });
}

async function sendRejectionEmail({ to, name, resourceTitle, reason }) {
  const subject = 'EduShare Resource Submission Update';
  const text = `Hello ${name},\n\nThank you for submitting "${resourceTitle}" to EduShare. After review, we regret to inform you that your resource was not approved for the following reason:\n\n${reason}\n\nPlease review our submission guidelines and feel free to resubmit with improvements.\n\nThanks,\nThe EduShare Team`;
  const html = `<p>Hello ${name},</p><p>Thank you for submitting <strong>"${resourceTitle}"</strong> to EduShare. After review, we regret to inform you that your resource was not approved for the following reason:</p><p><em>${reason}</em></p><p>Please review our submission guidelines and feel free to resubmit with improvements.</p><p>Thanks,<br />The EduShare Team</p>`;

  return sendEmail({ to, subject, text, html });
}

module.exports = { sendEmail, sendWelcomeEmail, sendWarningEmail, sendRejectionEmail };
