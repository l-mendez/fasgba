import nodemailer from 'nodemailer'

// Shared Zoho SMTP transport and sender for every FASGBA email.
export const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: 'no-responder@fasgba.com',
    pass: process.env.NO_REPLY_PASSWORD!,
  },
})

export const NO_REPLY_ADDRESS = 'no-responder@fasgba.com'
export const FROM = `"FASGBA" <${NO_REPLY_ADDRESS}>`
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fasgba.com'
