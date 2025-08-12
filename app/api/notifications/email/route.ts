import { NextRequest } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, unauthorizedError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

// Create a Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

interface EmailNotificationRequest {
  type: 'news_created'
  newsId: number
  recipientEmail?: string // For testing purposes
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Parse request body
    const body: EmailNotificationRequest = await request.json()
    
    if (body.type !== 'news_created') {
      return handleError(new Error('Invalid notification type'))
    }

    // Get news details from database
    const { data: newsData, error: newsError } = await supabase
      .from('news')
      .select(`
        id,
        title,
        extract,
        date,
        club_id,
        clubs (
          name
        )
      `)
      .eq('id', body.newsId)
      .single()

    if (newsError || !newsData) {
      return handleError(new Error('News not found'))
    }

    // Determine the news source (FASGBA or specific club)
    const clubData = newsData.clubs as any
    const newsSource = clubData?.name || 'Federación Argentina de Ajedrez del Sur de Buenos Aires (FASGBA)'
    
    // For testing, use the provided email or the default test email
    const recipientEmail = body.recipientEmail || 'lolomendez985@gmail.com'
    
    // Format the date
    const newsDate = new Date(newsData.date).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Create email content
    const subject = `Nueva noticia: ${newsData.title}`
    const textContent = `
¡Nueva noticia publicada!

Título: ${newsData.title}
Fuente: ${newsSource}
Fecha: ${newsDate}

${newsData.extract ? `Resumen: ${newsData.extract}` : ''}

¡Visita nuestro sitio web para leer la noticia completa!

---
Federación Argentina de Ajedrez del Sur de Buenos Aires
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
        .news-title { color: #8B4513; font-size: 24px; margin-bottom: 10px; }
        .news-meta { color: #666; margin-bottom: 15px; }
        .news-extract { background-color: white; padding: 15px; border-left: 4px solid #8B4513; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>♟️ Nueva Noticia Publicada</h1>
        </div>
        <div class="content">
            <h2 class="news-title">${newsData.title}</h2>
            <div class="news-meta">
                <strong>Fuente:</strong> ${newsSource}<br>
                <strong>Fecha:</strong> ${newsDate}
            </div>
            ${newsData.extract ? `
            <div class="news-extract">
                <strong>Resumen:</strong><br>
                ${newsData.extract}
            </div>
            ` : ''}
            <p>¡Visita nuestro sitio web para leer la noticia completa!</p>
        </div>
        <div class="footer">
            <p>Federación Argentina de Ajedrez del Sur de Buenos Aires</p>
            <p>Este es un mensaje automático. Por favor, no responda a este correo.</p>
        </div>
    </div>
</body>
</html>
`

    // Send email
    const info = await transporter.sendMail({
      from: '"Federación de Ajedrez" <no-responder@fasgba.com>',
      to: recipientEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
    })

    console.log("Email sent:", info.messageId)

    return apiSuccess({ 
      success: true, 
      messageId: info.messageId,
      recipient: recipientEmail,
      newsTitle: newsData.title
    })
  } catch (error) {
    console.error('Email sending error:', error)
    return handleError(error)
  }
} 