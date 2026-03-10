import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  port: 587,
  secure: false, // Tetap false karena kita pakai STARTTLS di 587
  requireTLS: true, // Tambahkan ini
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

export const sendEmailRegister = async ({ to, subject, html, attachments }) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
    attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Failed to send email to ${to}: `, error);
  }
};
