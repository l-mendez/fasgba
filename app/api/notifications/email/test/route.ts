import { NextRequest } from 'next/server'
import nodemailer from 'nodemailer'
import { apiSuccess, handleError } from '@/lib/utils/apiResponse'

// Configure nodemailer transporter with Zoho SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465, // use 465 for secure SSL
  secure: true, // true for port 465
  auth: {
    user: "no-responder@fasgba.com", // your Zoho email
    pass: process.env.NO_REPLY_PASSWORD!, // password or app-specific password if using 2FA
  },
})

export async function POST(request: NextRequest) {
  try {
    // Test email content
    const subject = "Prueba del sistema de notificaciones"
    const textContent = `
¡Prueba del sistema de notificaciones por email!

Este es un mensaje de prueba para verificar que el sistema de notificaciones funciona correctamente.

Detalles de la prueba:
- Fecha: ${new Date().toLocaleDateString('es-AR')}
- Hora: ${new Date().toLocaleTimeString('es-AR')}
- Sistema: Federación Argentina de Ajedrez del Sur de Buenos Aires

---
Sistema de notificaciones FASGBA
`

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #8B4513; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .test-info { background-color: white; padding: 15px; border-left: 4px solid #8B4513; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Prueba del Sistema de Notificaciones</h1>
        </div>
        <div class="content">
            <h2>¡Sistema funcionando correctamente!</h2>
            <p>Este es un mensaje de prueba para verificar que el sistema de notificaciones funciona correctamente.</p>
            
            <div class="test-info">
                <strong>Detalles de la prueba:</strong><br>
                <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-AR')}<br>
                <strong>Hora:</strong> ${new Date().toLocaleTimeString('es-AR')}<br>
                <strong>Sistema:</strong> Federación Argentina de Ajedrez del Sur de Buenos Aires
            </div>
            
            <p>Si estás recibiendo este email, significa que:</p>
            <ul>
                <li>✅ La configuración SMTP está funcionando</li>
                <li>✅ Los templates de email se procesan correctamente</li>
                <li>✅ El sistema de notificaciones está listo para producción</li>
            </ul>
        </div>
        <div class="footer">
            <p>Federación Argentina de Ajedrez del Sur de Buenos Aires</p>
            <p>Sistema de notificaciones - Mensaje de prueba</p>
        </div>
    </div>
</body>
</html>
`

    // Send test email
    const info = await transporter.sendMail({
      from: '"Federación de Ajedrez - PRUEBA" <no-responder@fasgba.com>',
      to: 'lolomendez985@gmail.com',
      subject: subject,
      text: textContent,
      html: htmlContent,
    })

    console.log("Test email sent:", info.messageId)

    return apiSuccess({ 
      success: true, 
      messageId: info.messageId,
      message: "Test email sent successfully to lolomendez985@gmail.com"
    })
  } catch (error) {
    console.error('Test email sending error:', error)
    return handleError(error)
  }
} 