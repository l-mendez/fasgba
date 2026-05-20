import nodemailer from 'nodemailer'
import { shellHtml } from '@/lib/notifications/templates'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: 'no-responder@fasgba.com',
    pass: process.env.NO_REPLY_PASSWORD!,
  },
})

const TEST_RECIPIENT = 'lolomendez985@gmail.com'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fasgba.com'

export async function POST() {
  try {
    const date = new Date().toLocaleDateString('es-AR')
    const time = new Date().toLocaleTimeString('es-AR')
    const subject = 'Prueba del sistema de notificaciones'
    const textContent = `\n¡Prueba del sistema de notificaciones por email!\n\nFecha: ${date}\nHora: ${time}\n\n---\nFederación de Ajedrez del Sur del Gran Buenos Aires`
    const htmlContent = shellHtml({
      eyebrow: 'Mensaje de prueba',
      heading: 'Sistema funcionando correctamente',
      meta: [
        { label: 'Fecha', value: date },
        { label: 'Hora', value: time },
      ],
      body: 'Si recibís este email, la configuración SMTP y los templates se están procesando como esperamos.',
      ctaLabel: 'Ir al sitio',
      ctaUrl: SITE_URL,
      unsubscribeUrl: `${SITE_URL}/ajustes?notificaciones=off`,
    })

    const info = await transporter.sendMail({
      from: '"FASGBA - PRUEBA" <no-responder@fasgba.com>',
      to: TEST_RECIPIENT,
      subject,
      text: textContent,
      html: htmlContent,
    })

    console.log('Test email sent:', info.messageId)
    return apiSuccess({
      success: true,
      messageId: info.messageId,
      message: `Test email sent successfully to ${TEST_RECIPIENT}`,
    })
  } catch (error) {
    console.error('Test email sending error:', error)
    return handleError(error)
  }
}
