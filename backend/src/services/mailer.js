import sanitizeMail from 'sanitize-mail';
import config from '../config';

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport(
  {
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: {
      user: config.mail.user.email,
      pass: config.mail.user.pass,
    },
  },
);

/**
 * Sends an email to a user
 * @param {User} user The user to send the email to
 * @param {string} subject The email subject
 * @param {string} content The HTML email content
 */
export default async function sendEmail(user, subject, content) {
  if (!user.email.length) return;
  // send mail with defined transport object

  transporter.sendMail({
    from: `"${config.mail.user.name}" <${config.mail.user.email}>`, // sender address
    to: user.email, // list of receivers
    subject, // Subject line
    html: sanitizeMail(content), // html body
  });
}
