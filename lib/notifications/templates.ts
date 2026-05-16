import type { SupabaseClient } from '@supabase/supabase-js'
import type { BroadcastInput, EmailContent } from './types'

export async function buildEmailContent(
  input: BroadcastInput,
  supabase: SupabaseClient,
  baseUrl: string
): Promise<EmailContent | null> {
  const unsubscribeUrl = `${baseUrl}/ajustes?notificaciones=off`

  if (input.type === 'news_created') {
    const { data: newsData, error } = await supabase
      .from('news')
      .select(`id, title, extract, date, club_id, clubs (name)`)
      .eq('id', input.newsId)
      .single()
    if (error || !newsData) return null

    const clubData = newsData.clubs as any
    const newsSource = clubData?.name || 'Federación de Ajedrez del Sur del Gran Buenos Aires (FASGBA)'
    const newsDate = new Date(newsData.date).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const newsUrl = `${baseUrl}/noticias/${newsData.id}`
    const category = newsData.club_id ? 'news_club' : 'news_fasgba'

    const subject = `Nueva noticia: ${newsData.title}`
    const textContent = `\n¡Nueva noticia publicada!\n\nTítulo: ${newsData.title}\nFuente: ${newsSource}\nFecha: ${newsDate}\n\n${newsData.extract || ''}\n\nLeer la noticia: ${newsUrl}\nDesactivar notificaciones: ${unsubscribeUrl}\n\n---\nFederación de Ajedrez del Sur del Gran Buenos Aires`
    const htmlContent = newsHtml({ title: newsData.title, source: newsSource, date: newsDate, extract: newsData.extract, url: newsUrl, unsubscribeUrl })

    return { subject, textContent, htmlContent, category, clubId: newsData.club_id ?? null }
  }

  if (input.type === 'tournament_created') {
    const { data: t, error } = await supabase
      .from('tournaments')
      .select(`id, title, description, place, created_by_club_id, clubs (name)`)
      .eq('id', input.tournamentId)
      .single()
    if (error || !t) return null

    const clubData = t.clubs as any
    const source = clubData?.name || 'FASGBA'
    const tournamentUrl = `${baseUrl}/torneos/${t.id}`

    const subject = `Nuevo torneo: ${t.title}`
    const textContent = `\n¡Nuevo torneo publicado!\n\nTítulo: ${t.title}\nOrganizador: ${source}\nLugar: ${t.place || 'Por confirmar'}\n\n${t.description || ''}\n\nVer torneo: ${tournamentUrl}\nDesactivar notificaciones: ${unsubscribeUrl}\n\n---\nFederación de Ajedrez del Sur del Gran Buenos Aires`
    const htmlContent = tournamentHtml({ title: t.title, source, place: t.place, description: t.description, url: tournamentUrl, unsubscribeUrl })

    const category: 'tournament_fasgba' | 'tournament_club' = t.created_by_club_id ? 'tournament_club' : 'tournament_fasgba'
    return { subject, textContent, htmlContent, category, clubId: t.created_by_club_id ?? null }
  }

  if (input.type === 'ranking_updated') {
    const rankingUrl = `${baseUrl}/ranking`
    const monthName = new Date(input.rankingYear, input.rankingMonth - 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

    const subject = `Ranking actualizado: ${monthName}`
    const textContent = `\n¡Nuevo ranking publicado!\n\nEl ranking de ${monthName} ya está disponible.\n\nVer ranking: ${rankingUrl}\nDesactivar notificaciones: ${unsubscribeUrl}\n\n---\nFederación de Ajedrez del Sur del Gran Buenos Aires`
    const htmlContent = rankingHtml({ monthName, url: rankingUrl, unsubscribeUrl })

    return { subject, textContent, htmlContent, category: 'ranking', clubId: null }
  }

  return null
}

// ─── HTML helpers (copied verbatim from the deleted route, wrapped in functions) ──

function shellHtml(headerTitle: string, body: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
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
</style></head><body><div class="container">
<div class="header"><h1>${headerTitle}</h1></div>
<div class="content">${body}</div>
<div class="footer">
  <p>Federación de Ajedrez del Sur del Gran Buenos Aires</p>
  <p><a class="link" href="${unsubscribeUrl}">Desactivar notificaciones</a></p>
</div></div></body></html>`
}

function newsHtml(p: { title: string; source: string; date: string; extract: string | null; url: string; unsubscribeUrl: string }): string {
  const body = `
<h2 class="title">${p.title}</h2>
<div class="meta"><strong>Fuente:</strong> ${p.source}<br><strong>Fecha:</strong> ${p.date}</div>
${p.extract ? `<div class="extract">${p.extract}</div>` : ''}
<p style="text-align:center; margin: 20px 0;"><a class="cta-button" href="${p.url}">Leer la noticia</a></p>`
  return shellHtml('♟️ Nueva Noticia', body, p.unsubscribeUrl)
}

function tournamentHtml(p: { title: string; source: string; place: string | null; description: string | null; url: string; unsubscribeUrl: string }): string {
  const body = `
<h2 class="title">${p.title}</h2>
<div class="meta"><strong>Organizador:</strong> ${p.source}<br><strong>Lugar:</strong> ${p.place || 'Por confirmar'}</div>
${p.description ? `<p>${p.description}</p>` : ''}
<p style="text-align:center; margin: 20px 0;"><a class="cta-button" href="${p.url}">Ver torneo</a></p>`
  return shellHtml('♟️ Nuevo Torneo', body, p.unsubscribeUrl)
}

function rankingHtml(p: { monthName: string; url: string; unsubscribeUrl: string }): string {
  const body = `
<h2 class="title">Ranking ${p.monthName}</h2>
<p>El nuevo ranking ya está disponible. ¡Consulta tu posición!</p>
<p style="text-align:center; margin: 20px 0;"><a class="cta-button" href="${p.url}">Ver ranking</a></p>`
  return shellHtml('♟️ Ranking Actualizado', body, p.unsubscribeUrl)
}
