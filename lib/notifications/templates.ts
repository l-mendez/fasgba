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
    const newsSource = clubData?.name || 'FASGBA'
    const newsUrl = `${baseUrl}/noticias/${newsData.id}`
    const category = newsData.club_id ? 'news_club' : 'news_fasgba'

    const subject = `Nueva noticia: ${newsData.title}`
    const textContent = plainText([
      '¡Nueva noticia publicada!',
      `Título: ${newsData.title}`,
      `Fuente: ${newsSource}`,
      newsData.extract || '',
      `Leer la noticia: ${newsUrl}`,
      `Desactivar notificaciones: ${unsubscribeUrl}`,
    ])
    const htmlContent = shellHtml({
      eyebrow: 'Nueva noticia',
      heading: newsData.title,
      byline: `Publicado por ${newsSource}`,
      meta: [],
      body: newsData.extract || null,
      ctaLabel: 'Leer la noticia',
      ctaUrl: newsUrl,
      unsubscribeUrl,
    })

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
    const textContent = plainText([
      '¡Nuevo torneo publicado!',
      `Título: ${t.title}`,
      `Organizador: ${source}`,
      `Lugar: ${t.place || 'Por confirmar'}`,
      t.description || '',
      `Ver torneo: ${tournamentUrl}`,
      `Desactivar notificaciones: ${unsubscribeUrl}`,
    ])
    const htmlContent = shellHtml({
      eyebrow: 'Nuevo torneo',
      heading: t.title,
      meta: [
        { label: 'Organizador', value: source },
        { label: 'Lugar', value: t.place || 'Por confirmar' },
      ],
      body: t.description || null,
      ctaLabel: 'Ver torneo',
      ctaUrl: tournamentUrl,
      unsubscribeUrl,
    })

    const category: 'tournament_fasgba' | 'tournament_club' = t.created_by_club_id ? 'tournament_club' : 'tournament_fasgba'
    return { subject, textContent, htmlContent, category, clubId: t.created_by_club_id ?? null }
  }

  if (input.type === 'ranking_updated') {
    const rankingUrl = `${baseUrl}/ranking`
    const monthName = new Date(input.rankingYear, input.rankingMonth - 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

    const subject = `Ranking actualizado: ${monthName}`
    const textContent = plainText([
      '¡Nuevo ranking publicado!',
      `El ranking de ${monthName} ya está disponible.`,
      `Ver ranking: ${rankingUrl}`,
      `Desactivar notificaciones: ${unsubscribeUrl}`,
    ])
    const htmlContent = shellHtml({
      eyebrow: 'Ranking actualizado',
      heading: `Ranking de ${monthName}`,
      meta: [],
      body: 'El nuevo ranking ya está disponible. ¡Consulta tu posición!',
      ctaLabel: 'Ver ranking',
      ctaUrl: rankingUrl,
      unsubscribeUrl,
    })

    return { subject, textContent, htmlContent, category: 'ranking', clubId: null }
  }

  return null
}

function plainText(lines: string[]): string {
  return '\n' + lines.filter(Boolean).join('\n\n') + '\n\n---\nFederación de Ajedrez del Sur del Gran Buenos Aires'
}

interface ShellOptions {
  eyebrow: string
  heading: string
  byline?: string
  meta: Array<{ label: string; value: string }>
  body: string | null
  ctaLabel: string
  ctaUrl: string
  unsubscribeUrl: string
}

// Exported so the test-email endpoint can render in the same shell.
export function shellHtml(opts: ShellOptions): string {
  const metaRows = opts.meta
    .map(
      (m) =>
        `<div style="margin:4px 0;"><span style="color:#8f3f12;font-weight:600;">${m.label}:</span> <span style="color:#444;">${m.value}</span></div>`
    )
    .join('')

  const bodyBlock = opts.body
    ? `<div class="extract">${opts.body}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${opts.eyebrow} - FASGBA</title>
<style>
body { margin:0; padding:0; background:#f8f9fa; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color:#333; line-height:1.6; -webkit-text-size-adjust:100%; }
.email-container { max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08); }
.header { background:linear-gradient(135deg, #8f3f12 0%, #a85a2d 100%); padding:36px 30px; text-align:center; color:#ffffff; }
.logo { font-size:28px; font-weight:bold; letter-spacing:1px; margin-bottom:6px; }
.subtitle { font-size:13px; opacity:0.9; margin:0; }
.content { padding:40px 30px; text-align:center; }
.eyebrow { color:#daa056; font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:10px; }
.title { font-size:24px; font-weight:bold; color:#8f3f12; margin:0 0 12px; }
.byline { color:#888; font-size:13px; font-style:italic; margin:0 0 24px; }
.meta { color:#666; font-size:14px; text-align:left; max-width:360px; margin:0 auto 24px; }
.extract { background:#fef7f0; border:1px solid #e5bb7f; border-radius:8px; padding:20px; font-size:15px; color:#555; line-height:1.7; text-align:left; margin:24px 0; }
.cta-container { margin:32px 0 8px; }
.cta-button { display:inline-block; padding:14px 32px; background:linear-gradient(135deg, #8f3f12 0%, #a85a2d 100%); color:#ffffff !important; text-decoration:none; border-radius:8px; font-weight:bold; font-size:15px; letter-spacing:0.3px; box-shadow:0 4px 12px rgba(143,63,18,0.25); }
.footer { background:#2c2c2c; padding:28px 30px; text-align:center; }
.footer-logo { color:#daa056; font-size:18px; font-weight:bold; margin-bottom:10px; letter-spacing:0.5px; }
.footer-text { font-size:13px; margin:4px 0; color:#cccccc; }
.footer-link { color:#daa056; text-decoration:none; }
.footer-link:hover { text-decoration:underline; }
@media only screen and (max-width:600px) {
  .email-container { margin:0 12px; }
  .header, .content, .footer { padding-left:20px; padding-right:20px; }
  .header { padding-top:28px; padding-bottom:28px; }
  .content { padding-top:32px; padding-bottom:32px; }
  .title { font-size:20px; }
  .cta-button { padding:12px 24px; font-size:14px; }
}
</style>
</head>
<body>
<div style="background:#f8f9fa; padding:24px 0;">
  <div class="email-container">
    <div class="header">
      <div class="logo">FASGBA</div>
      <p class="subtitle">Federación de Ajedrez del Sur del Gran Buenos Aires</p>
    </div>
    <div class="content">
      <div class="eyebrow">${opts.eyebrow}</div>
      <h1 class="title">${opts.heading}</h1>
      ${opts.byline ? `<div class="byline">${opts.byline}</div>` : ''}
      ${metaRows ? `<div class="meta">${metaRows}</div>` : ''}
      ${bodyBlock}
      <div class="cta-container">
        <a href="${opts.ctaUrl}" class="cta-button">${opts.ctaLabel}</a>
      </div>
    </div>
    <div class="footer">
      <div class="footer-logo">FASGBA</div>
      <p class="footer-text">Federación de Ajedrez del Sur del Gran Buenos Aires</p>
      <p class="footer-text"><a class="footer-link" href="${opts.unsubscribeUrl}">Desactivar notificaciones</a></p>
    </div>
  </div>
</div>
</body>
</html>`
}
