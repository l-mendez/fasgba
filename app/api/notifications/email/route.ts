import { NextRequest } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'
import { apiSuccess, handleError, unauthorizedError } from '@/lib/utils/apiResponse'
import { ERROR_MESSAGES } from '@/lib/utils/constants'

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
  type: 'news_created' | 'tournament_created' | 'ranking_updated'
  newsId?: number
  tournamentId?: number
  rankingMonth?: number
  rankingYear?: number
  recipientEmail?: string // Optional: if omitted and broadcast=true, will send to all users
  broadcast?: boolean // When true, send to all users
}

type NotificationCategory = 'news_fasgba' | 'news_club' | 'tournament' | 'ranking'

async function buildEmailContent(body: EmailNotificationRequest, supabase: any, request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  const unsubscribeUrl = `${baseUrl}/ajustes?notificaciones=off`

  if (body.type === 'news_created' && body.newsId) {
    const { data: newsData, error: newsError } = await supabase
      .from('news')
      .select(`id, title, extract, date, club_id, clubs (name)`)
      .eq('id', body.newsId)
      .single()

    if (newsError || !newsData) return null

    const clubData = newsData.clubs as any
    const newsSource = clubData?.name || 'Federación de Ajedrez del Sur del Gran Buenos Aires (FASGBA)'
    const newsDate = new Date(newsData.date).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const newsUrl = `${baseUrl}/noticias/${newsData.id}`
    const category: NotificationCategory = newsData.club_id ? 'news_club' : 'news_fasgba'

    const subject = `Nueva noticia: ${newsData.title}`
    const textContent = `
¡Nueva noticia publicada!

Título: ${newsData.title}
Fuente: ${newsSource}
Fecha: ${newsDate}

${newsData.extract || ''}

Leer la noticia: ${newsUrl}
Desactivar notificaciones: ${unsubscribeUrl}

---
Federación de Ajedrez del Sur del Gran Buenos Aires`

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
        .title { color: #8B4513; font-size: 24px; margin-bottom: 10px; }
        .meta { color: #666; margin-bottom: 15px; }
        .extract { background-color: white; padding: 15px; border-left: 4px solid #8B4513; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .cta-button { display: inline-block; background-color: #8B4513; color: white; padding: 10px 16px; border-radius: 6px; text-decoration: none; }
        .link { color: #8B4513; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>♟️ Nueva Noticia</h1>
        </div>
        <div class="content">
            <h2 class="title">${newsData.title}</h2>
            <div class="meta"><strong>Fuente:</strong> ${newsSource}<br><strong>Fecha:</strong> ${newsDate}</div>
            ${newsData.extract ? `<div class="extract">${newsData.extract}</div>` : ''}
            <p style="text-align:center; margin: 20px 0;"><a class="cta-button" href="${newsUrl}">Leer la noticia</a></p>
        </div>
        <div class="footer">
            <p>Federación de Ajedrez del Sur del Gran Buenos Aires</p>
            <p><a class="link" href="${unsubscribeUrl}">Desactivar notificaciones</a></p>
        </div>
    </div>
</body>
</html>`

    return { subject, textContent, htmlContent, category, clubId: newsData.club_id }
  }

  if (body.type === 'tournament_created' && body.tournamentId) {
    const { data: tournamentData, error } = await supabase
      .from('tournaments')
      .select(`id, title, description, place, created_by_club_id, clubs (name)`)
      .eq('id', body.tournamentId)
      .single()

    if (error || !tournamentData) return null

    const clubData = tournamentData.clubs as any
    const source = clubData?.name || 'FASGBA'
    const tournamentUrl = `${baseUrl}/torneos/${tournamentData.id}`
    const category: NotificationCategory = 'tournament'

    const subject = `Nuevo torneo: ${tournamentData.title}`
    const textContent = `
¡Nuevo torneo publicado!

Título: ${tournamentData.title}
Organizador: ${source}
Lugar: ${tournamentData.place || 'Por confirmar'}

${tournamentData.description || ''}

Ver torneo: ${tournamentUrl}
Desactivar notificaciones: ${unsubscribeUrl}

---
Federación de Ajedrez del Sur del Gran Buenos Aires`

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
        .title { color: #8B4513; font-size: 24px; margin-bottom: 10px; }
        .meta { color: #666; margin-bottom: 15px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .cta-button { display: inline-block; background-color: #8B4513; color: white; padding: 10px 16px; border-radius: 6px; text-decoration: none; }
        .link { color: #8B4513; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>♟️ Nuevo Torneo</h1>
        </div>
        <div class="content">
            <h2 class="title">${tournamentData.title}</h2>
            <div class="meta"><strong>Organizador:</strong> ${source}<br><strong>Lugar:</strong> ${tournamentData.place || 'Por confirmar'}</div>
            ${tournamentData.description ? `<p>${tournamentData.description}</p>` : ''}
            <p style="text-align:center; margin: 20px 0;"><a class="cta-button" href="${tournamentUrl}">Ver torneo</a></p>
        </div>
        <div class="footer">
            <p>Federación de Ajedrez del Sur del Gran Buenos Aires</p>
            <p><a class="link" href="${unsubscribeUrl}">Desactivar notificaciones</a></p>
        </div>
    </div>
</body>
</html>`

    return { subject, textContent, htmlContent, category, clubId: tournamentData.created_by_club_id }
  }

  if (body.type === 'ranking_updated' && body.rankingMonth && body.rankingYear) {
    const rankingUrl = `${baseUrl}/ranking`
    const category: NotificationCategory = 'ranking'
    const monthName = new Date(body.rankingYear, body.rankingMonth - 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

    const subject = `Ranking actualizado: ${monthName}`
    const textContent = `
¡Nuevo ranking publicado!

El ranking de ${monthName} ya está disponible.

Ver ranking: ${rankingUrl}
Desactivar notificaciones: ${unsubscribeUrl}

---
Federación de Ajedrez del Sur del Gran Buenos Aires`

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
        .title { color: #8B4513; font-size: 24px; margin-bottom: 10px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .cta-button { display: inline-block; background-color: #8B4513; color: white; padding: 10px 16px; border-radius: 6px; text-decoration: none; }
        .link { color: #8B4513; text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>♟️ Ranking Actualizado</h1>
        </div>
        <div class="content">
            <h2 class="title">Ranking ${monthName}</h2>
            <p>El nuevo ranking ya está disponible. ¡Consulta tu posición!</p>
            <p style="text-align:center; margin: 20px 0;"><a class="cta-button" href="${rankingUrl}">Ver ranking</a></p>
        </div>
        <div class="footer">
            <p>Federación de Ajedrez del Sur del Gran Buenos Aires</p>
            <p><a class="link" href="${unsubscribeUrl}">Desactivar notificaciones</a></p>
        </div>
    </div>
</body>
</html>`

    return { subject, textContent, htmlContent, category, clubId: null }
  }

  return null
}

function shouldIncludeUser(notif: any, category: NotificationCategory, clubId: number | null): boolean {
  const type = notif?.type?.toLowerCase?.()
  if (type === 'ninguna') return false
  if (type === 'todas') return true
  if (type === 'personalizar') {
    if (category === 'news_fasgba') {
      const pref = notif?.noticias?.toLowerCase?.()
      return ['todos', 'fasgba-y-clubes', 'fasgba'].includes(pref)
    }
    if (category === 'news_club') {
      const pref = notif?.noticias?.toLowerCase?.()
      return ['todos', 'fasgba-y-clubes', 'clubes'].includes(pref)
    }
    if (category === 'tournament') {
      const pref = notif?.torneos?.toLowerCase?.()
      if (clubId) {
        return ['todos', 'fasgba-y-clubes', 'clubes'].includes(pref)
      } else {
        return ['todos', 'fasgba-y-clubes', 'fasgba'].includes(pref)
      }
    }
    if (category === 'ranking') {
      return !!notif?.ranking
    }
  }
  return true
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }
    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const body: EmailNotificationRequest = await request.json()
    if (!['news_created', 'tournament_created', 'ranking_updated'].includes(body.type)) {
      return handleError(new Error('Invalid notification type'))
    }

    const emailData = await buildEmailContent(body, supabase, request)
    if (!emailData) {
      return handleError(new Error('Failed to build email content'))
    }

    const { subject, textContent, htmlContent, category, clubId } = emailData
    const recipientEmail = body.recipientEmail

    if (body.broadcast) {
      // Verify requester is site admin for broadcast
      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('auth_id')
        .eq('auth_id', user.id)
        .single()

      if (adminError || !admin) {
        return unauthorizedError(ERROR_MESSAGES.UNAUTHORIZED)
      }

      const allEmails: string[] = []
      let page = 1
      const perPage = 1000
      while (true) {
        const { data: { users } = { users: [] }, error: listError } = await supabase.auth.admin.listUsers({ page, perPage })
        if (listError) {
          console.error('Failed to list users for broadcast:', listError)
          break
        }
        if (!users || users.length === 0) break
        for (const u of users) {
          const notif = (u.user_metadata as any)?.notifications
          if (u.email && shouldIncludeUser(notif, category, clubId)) {
            allEmails.push(u.email)
          }
        }
        if (users.length < perPage) break
        page += 1
      }

      if (allEmails.length === 0) {
        return apiSuccess({ success: false, message: 'No recipient emails found' })
      }

      const info = await transporter.sendMail({
        from: '"Federación de Ajedrez" <no-responder@fasgba.com>',
        to: 'no-responder@fasgba.com',
        bcc: allEmails,
        subject,
        text: textContent,
        html: htmlContent,
      })

      console.log('Broadcast email sent:', info.messageId, 'to', allEmails.length, 'recipients')
      return apiSuccess({ success: true, messageId: info.messageId, recipients: allEmails.length })
    }

    if (!recipientEmail) {
      return handleError(new Error('recipientEmail required when not broadcasting'))
    }

    const info = await transporter.sendMail({
      from: '"Federación de Ajedrez" <no-responder@fasgba.com>',
      to: recipientEmail,
      subject,
      text: textContent,
      html: htmlContent,
    })

    console.log('Email sent:', info.messageId)
    return apiSuccess({ success: true, messageId: info.messageId, recipient: recipientEmail })
  } catch (error) {
    console.error('Email sending error:', error)
    return handleError(error)
  }
}