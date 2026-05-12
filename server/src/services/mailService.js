import nodemailer from 'nodemailer'

let transporter

export function getMailer() {
  if (transporter) return transporter
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  return transporter
}

/**
 * @returns {Promise<boolean>} true if sent, false if SMTP is not configured
 */
export async function sendMail({ to, subject, html, text }) {
  const mailer = getMailer()
  if (!mailer) {
    return false
  }
  const from = process.env.SMTP_FROM || `"VaultX" <${process.env.SMTP_USER}>`
  await mailer.sendMail({
    from,
    to,
    subject,
    html,
    text: text ?? '',
  })
  return true
}
