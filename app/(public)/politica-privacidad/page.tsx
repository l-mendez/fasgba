import { Metadata } from "next"
import { PageHero } from "@/components/page-hero"

// Section headings in terracotta; prose colors mapped to theme tokens (light + dark).
const LEGAL_PROSE =
  "prose max-w-3xl [--tw-prose-body:var(--color-foreground)] [--tw-prose-headings:var(--color-terracotta)] [--tw-prose-bold:var(--color-foreground)] [--tw-prose-links:var(--color-terracotta)] [--tw-prose-bullets:var(--color-muted-foreground)] [--tw-prose-counters:var(--color-muted-foreground)] prose-h2:mb-3 prose-h2:mt-10 prose-h2:text-2xl prose-h2:font-bold prose-h2:tracking-tight prose-h3:text-lg first:prose-h2:mt-0"

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Política de privacidad de la Federación de Ajedrez del Sur del Gran Buenos Aires',
}

export default function PoliticaPrivacidadPage() {
  return (
    <>
      <PageHero
        title="Política de privacidad"
        subtitle="Última actualización: 29 de septiembre de 2025"
      />

      <section className="w-full pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="container px-4 md:px-6">
          <article className={LEGAL_PROSE}>
            <h2>1. Introducción</h2>
            <p>
              La Federación de Ajedrez del Sur del Gran Buenos Aires (en adelante, "FASGBA", "nosotros" o "nuestro") 
              se compromete a proteger la privacidad de los usuarios de nuestro sitio web fasgba.com (el "Sitio"). 
              Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos su información personal.
            </p>
            <p>
              Esta política cumple con la Ley N° 25.326 de Protección de Datos Personales de la República Argentina 
              y normativas aplicables.
            </p>

            <h2>2. Información que recopilamos</h2>
            <p>Recopilamos los siguientes tipos de información:</p>
            
            <h3>2.1 Información que usted nos proporciona</h3>
            <ul>
              <li><strong>Datos de registro:</strong> Nombre, apellido, correo electrónico, contraseña</li>
              <li><strong>Datos de perfil:</strong> Información adicional que elija compartir</li>
              <li><strong>Datos de contacto:</strong> Cuando nos contacta o participa en eventos</li>
              <li><strong>Afiliación:</strong> Club al que pertenece, si aplica</li>
            </ul>

            <h3>2.2 Información recopilada automáticamente</h3>
            <ul>
              <li><strong>Datos de navegación:</strong> Dirección IP, tipo de navegador, páginas visitadas</li>
              <li><strong>Cookies:</strong> Información almacenada en su dispositivo para mejorar la experiencia</li>
              <li><strong>Datos de sesión:</strong> Información sobre su uso del Sitio</li>
            </ul>

            <h2>3. Cómo usamos su información</h2>
            <p>Utilizamos su información personal para:</p>
            <ul>
              <li>Crear y gestionar su cuenta de usuario</li>
              <li>Autenticar su acceso al Sitio</li>
              <li>Enviarle notificaciones sobre torneos, noticias y actualizaciones del ranking</li>
              <li>Procesar inscripciones a torneos y eventos</li>
              <li>Mantener y actualizar el ranking oficial de jugadores</li>
              <li>Comunicarnos con usted sobre su cuenta y nuestros servicios</li>
              <li>Mejorar nuestro Sitio y servicios</li>
              <li>Cumplir con obligaciones legales y reglamentarias</li>
              <li>Prevenir fraudes y garantizar la seguridad del Sitio</li>
            </ul>

            <h2>4. Compartir información</h2>
            <p>No vendemos ni alquilamos su información personal. Podemos compartir su información con:</p>
            
            <h3>4.1 Proveedores de servicios</h3>
            <ul>
              <li><strong>Supabase:</strong> Para autenticación y almacenamiento de datos</li>
              <li><strong>Servicios de email:</strong> Para envío de notificaciones</li>
              <li><strong>Servicios de hosting:</strong> Para alojar el Sitio</li>
            </ul>

            <h3>4.2 Información pública</h3>
            <p>
              El ranking de jugadores y resultados de torneos son información pública visible para todos los usuarios del Sitio.
            </p>

            <h3>4.3 Requisitos legales</h3>
            <p>
              Podemos divulgar su información cuando sea requerido por ley o para proteger nuestros derechos legales.
            </p>

            <h2>5. Seguridad de los datos</h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger su información personal contra 
              acceso no autorizado, alteración, divulgación o destrucción, incluyendo:
            </p>
            <ul>
              <li>Encriptación de contraseñas</li>
              <li>Conexiones seguras HTTPS</li>
              <li>Controles de acceso restringidos</li>
              <li>Monitoreo regular de seguridad</li>
            </ul>
            <p>
              Sin embargo, ningún método de transmisión por Internet es 100% seguro. 
              Usted es responsable de mantener la confidencialidad de su contraseña.
            </p>

            <h2>6. Cookies y tecnologías similares</h2>
            <p>
              Utilizamos cookies y tecnologías similares para mejorar su experiencia en el Sitio. Las cookies son pequeños 
              archivos que se almacenan en su dispositivo y nos permiten:
            </p>
            <ul>
              <li>Mantener su sesión iniciada</li>
              <li>Recordar sus preferencias</li>
              <li>Analizar el uso del Sitio</li>
              <li>Proporcionar funcionalidades personalizadas</li>
            </ul>
            <p>
              Puede configurar su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad del Sitio.
            </p>

            <h2>7. Sus derechos</h2>
            <p>De acuerdo con la legislación aplicable, usted tiene derecho a:</p>
            <ul>
              <li><strong>Acceso:</strong> Solicitar una copia de su información personal</li>
              <li><strong>Rectificación:</strong> Corregir información inexacta o incompleta</li>
              <li><strong>Supresión:</strong> Solicitar la eliminación de su información (derecho al olvido)</li>
              <li><strong>Oposición:</strong> Oponerse al procesamiento de su información</li>
              <li><strong>Portabilidad:</strong> Recibir sus datos en formato estructurado</li>
              <li><strong>Revocación:</strong> Retirar su consentimiento en cualquier momento</li>
            </ul>
            <p>
              Para ejercer estos derechos, contáctenos en: <a href="mailto:secretaria@fasgba.com">secretaria@fasgba.com</a>
            </p>

            <h2>8. Notificaciones por email</h2>
            <p>
              Al registrarse, acepta recibir notificaciones sobre:
            </p>
            <ul>
              <li>Nuevos torneos y eventos</li>
              <li>Noticias de FASGBA y clubes que sigue</li>
              <li>Actualizaciones del ranking</li>
              <li>Comunicaciones importantes sobre su cuenta</li>
            </ul>
            <p>
              Puede gestionar sus preferencias de notificación en cualquier momento desde la página de Ajustes o 
              haciendo clic en el enlace de cancelación de suscripción en nuestros emails.
            </p>

            <h2>9. Retención de datos</h2>
            <p>
              Conservamos su información personal durante el tiempo necesario para cumplir con los propósitos descritos 
              en esta política, a menos que la ley requiera o permita un período de retención más largo.
            </p>
            <p>
              Los datos del ranking y resultados de torneos se conservan de forma permanente como registro histórico 
              de la federación.
            </p>

            <h2>10. Menores de edad</h2>
            <p>
              Nuestro Sitio no está dirigido a menores de 13 años. No recopilamos intencionalmente información de menores. 
              Si es padre o tutor y cree que su hijo nos ha proporcionado información personal, contáctenos para que podamos 
              eliminarla.
            </p>
            <p>
              Los menores entre 13 y 18 años deben contar con la autorización de sus padres o tutores para registrarse.
            </p>

            <h2>11. Enlaces a terceros</h2>
            <p>
              Nuestro Sitio puede contener enlaces a sitios web de terceros. No somos responsables de las prácticas de 
              privacidad de estos sitios. Le recomendamos leer las políticas de privacidad de cada sitio que visite.
            </p>

            <h2>12. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos sobre cambios significativos 
              mediante un aviso destacado en el Sitio o por correo electrónico. La fecha de "Última actualización" al inicio 
              de esta política indica cuándo fue revisada por última vez.
            </p>

            <h2>13. Contacto</h2>
            <p>
              Si tiene preguntas, inquietudes o solicitudes relacionadas con esta Política de Privacidad o el tratamiento 
              de sus datos personales, puede contactarnos:
            </p>
            <div>
              <p><strong>Federación de Ajedrez del Sur del Gran Buenos Aires (FASGBA)</strong></p>
              <p>Email: <a href="mailto:secretaria@fasgba.com">secretaria@fasgba.com</a></p>
              <p>Teléfono: +54 911 4028 2610</p>
              <p>Sitio web: <a href="https://fasgba.com">https://fasgba.com</a></p>
            </div>

            <h2>14. Autoridad de aplicación</h2>
            <p>
              La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la Ley N° 25.326, 
              tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento 
              de las normas sobre protección de datos personales.
            </p>
            <p>
              Sitio web: <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer">
                www.argentina.gob.ar/aaip
              </a>
            </p>
          </article>
        </div>
      </section>
    </>
  )
}
