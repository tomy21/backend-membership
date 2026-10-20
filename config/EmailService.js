import nodemailer from "nodemailer";

const host = process.env.EMAIL_HOST || "mail.skyparking.co.id";
const port = Number(process.env.EMAIL_PORT || 465);
const secure = process.env.EMAIL_SECURE !== "false";
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

if (!user || !pass) {
  throw new Error("EMAIL_USER dan EMAIL_PASS belum dikonfigurasi.");
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
});

export async function verifyEmailConnection() {
  await transporter.verify();
  console.info("SMTP connection verified successfully.");
}

/**
 * @param {{
 *   to: string | string[],
 *   subject: string,
 *   html: string,
 *   attachments?: import("nodemailer").SendMailOptions["attachments"]
 * }} options
 */
export async function sendEmailRegister({
  to,
  subject,
  html,
  attachments = [],
}) {
  if (!to || !subject || !html) {
    throw new Error("Recipient, subject, dan HTML email wajib diisi.");
  }

  const result = await transporter.sendMail({
    from: process.env.EMAIL_FROM || user,
    to,
    subject,
    html,
    attachments,
  });

  if (result.accepted.length === 0 || result.rejected.length > 0) {
    throw new Error("SMTP server menolak satu atau lebih penerima email.");
  }

  console.info("Email accepted by SMTP server:", {
    messageId: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected,
  });

  return result;
}
