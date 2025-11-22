/**
 * Script para enviar actualizaciones de la plataforma a los administradores
 * 
 * Este script obtiene todos los administradores de la base de datos y les envía
 * un correo electrónico con información sobre nuevas funcionalidades, bugs corregidos
 * y mejoras implementadas en la plataforma.
 * 
 * Uso:
 *   npx tsx scripts/send-admin-update.ts
 * 
 * Requisitos:
 *   - Variables de entorno configuradas (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NO_REPLY_PASSWORD)
 *   - Email template en email-templates/admin-update.html
 */

import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Verificar variables de entorno requeridas
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NO_REPLY_PASSWORD'
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Error: Falta la variable de entorno ${envVar}`)
    process.exit(1)
  }
}

// Configurar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Configurar nodemailer con Zoho SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: "no-responder@fasgba.com",
    pass: process.env.NO_REPLY_PASSWORD!,
  },
})

interface AdminData {
  auth_id: string
  email: string
}

/**
 * Obtiene todos los administradores del sistema con sus emails
 */
async function getAdminEmails(): Promise<AdminData[]> {
  try {
    // Obtener todos los auth_id de la tabla admins
    const { data: admins, error: adminsError } = await supabase
      .from('admins')
      .select('auth_id')

    if (adminsError) {
      throw new Error(`Error obteniendo administradores: ${adminsError.message}`)
    }

    if (!admins || admins.length === 0) {
      console.warn('⚠️  No se encontraron administradores en la base de datos')
      return []
    }

    console.log(`📊 Se encontraron ${admins.length} administrador(es) en la base de datos`)

    // Obtener los datos de usuario de Supabase Auth para cada admin
    const adminEmails: AdminData[] = []

    for (const admin of admins) {
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(admin.auth_id)

      if (userError) {
        console.error(`⚠️  Error obteniendo datos del usuario ${admin.auth_id}:`, userError.message)
        continue
      }

      if (userData.user && userData.user.email) {
        adminEmails.push({
          auth_id: admin.auth_id,
          email: userData.user.email
        })
        console.log(`✅ Admin encontrado: ${userData.user.email}`)
      } else {
        console.warn(`⚠️  Admin ${admin.auth_id} no tiene email`)
      }
    }

    return adminEmails
  } catch (error) {
    console.error('❌ Error obteniendo administradores:', error)
    throw error
  }
}

/**
 * Lee el template HTML del email
 */
function loadEmailTemplate(): string {
  const templatePath = path.resolve(process.cwd(), 'email-templates', 'admin-update.html')
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`No se encontró el template de email en: ${templatePath}`)
  }

  return fs.readFileSync(templatePath, 'utf-8')
}

/**
 * Genera el contenido en texto plano del email
 */
function getPlainTextContent(): string {
  return `
ACTUALIZACIÓN DEL SISTEMA - FASGBA
Federación de Ajedrez del Sur del Gran Buenos Aires

Estimados/as Administradores,

Nos complace informarles sobre las últimas actualizaciones implementadas en la plataforma de FASGBA.

ERRORES CORREGIDOS
==================
• Se corrigió el problema donde se agregaba la fecha anterior a la indicada durante la creación y edición de torneos.
• Se solucionó la búsqueda y el filtrado defectuoso de jugadores en la sección de ranking.

NUEVAS FUNCIONALIDADES
=====================
• Sistema de Notificaciones: Los usuarios ahora reciben notificaciones por cada nuevo torneo, noticia o actualización del ranking. Pueden personalizar o desactivar estas notificaciones desde la sección de Ajustes.
• Enlaces de Inscripción: Se implementó la posibilidad de agregar enlaces de inscripción a los torneos (por ejemplo, formularios de Google Forms).
• Información Institucional: Se agregaron al footer las secciones de Estatuto, Comisión Directiva y Calendario Anual.
• Datos de Contacto: Se corrigieron y actualizaron los datos de contacto en el footer del sitio.

MEJORAS DE EXPERIENCIA
======================
• Se agregó una notificación de confirmación cuando se guardan exitosamente los cambios en la sección de Ajustes.

SU OPINIÓN ES IMPORTANTE
========================
Los invitamos cordialmente a compartir sus comentarios, reportar cualquier error que detecten o enviar sugerencias para mejorar la plataforma.

Contacto: lolomendez985@gmail.com

Estas actualizaciones reflejan nuestro compromiso continuo con la mejora de la plataforma y la experiencia de todos los usuarios de FASGBA.

Quedamos a su disposición para cualquier consulta o aclaración que requieran.

Cordialmente,
Equipo de Desarrollo FASGBA

---
Federación de Ajedrez del Sur del Gran Buenos Aires
© 2025 FASGBA - Todos los derechos reservados.
`
}

/**
 * Envía el email de actualización a todos los administradores
 */
async function sendUpdateEmail(admins: AdminData[]): Promise<void> {
  if (admins.length === 0) {
    console.log('⚠️  No hay administradores a los cuales enviar el email')
    return
  }

  const htmlContent = loadEmailTemplate()
  const textContent = getPlainTextContent()
  const subject = '📢 Actualización del Sistema - FASGBA'

  console.log('\n📧 Preparando envío de emails...\n')

  try {
    // Enviar email a todos los admins usando BCC
    const adminEmails = admins.map(admin => admin.email)

    const info = await transporter.sendMail({
      from: '"FASGBA - Sistema de Actualizaciones" <no-responder@fasgba.com>',
      to: 'no-responder@fasgba.com', // Email principal (no visible para destinatarios)
      bcc: adminEmails, // Todos los admins en BCC para privacidad
      subject: subject,
      text: textContent,
      html: htmlContent,
    })

    console.log('✅ Email enviado exitosamente!')
    console.log(`📬 ID del mensaje: ${info.messageId}`)
    console.log(`👥 Destinatarios: ${adminEmails.length}`)
    console.log(`📧 Emails enviados a:`)
    adminEmails.forEach(email => console.log(`   - ${email}`))

  } catch (error) {
    console.error('❌ Error enviando email:', error)
    throw error
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando envío de actualización a administradores...\n')

  try {
    // Verificar configuración del transporter
    console.log('🔧 Verificando configuración SMTP...')
    await transporter.verify()
    console.log('✅ Conexión SMTP verificada\n')

    // Obtener administradores
    console.log('👥 Obteniendo lista de administradores...')
    const admins = await getAdminEmails()

    if (admins.length === 0) {
      console.log('\n⚠️  No se encontraron administradores con email válido')
      console.log('💡 Asegúrese de que existan administradores en la base de datos')
      process.exit(0)
    }

    console.log(`\n✅ Se encontraron ${admins.length} administrador(es) con email válido\n`)

    // Confirmar envío
    console.log('⚠️  A punto de enviar email a los siguientes administradores:')
    admins.forEach(admin => console.log(`   - ${admin.email}`))
    console.log('\n⏳ Enviando en 3 segundos... (Presione Ctrl+C para cancelar)\n')
    
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Enviar email
    await sendUpdateEmail(admins)

    console.log('\n✨ Proceso completado exitosamente!\n')

  } catch (error) {
    console.error('\n❌ Error durante la ejecución:', error)
    process.exit(1)
  }
}

// Ejecutar script
main()

