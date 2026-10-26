import { Metadata } from "next"
import { PageHero } from "@/components/page-hero"

// Section headings in terracotta; prose colors mapped to theme tokens (light + dark).
const LEGAL_PROSE =
  "prose max-w-3xl [--tw-prose-body:var(--color-foreground)] [--tw-prose-headings:var(--color-terracotta)] [--tw-prose-bold:var(--color-foreground)] [--tw-prose-links:var(--color-terracotta)] [--tw-prose-bullets:var(--color-muted-foreground)] [--tw-prose-counters:var(--color-muted-foreground)] prose-h2:mb-3 prose-h2:mt-10 prose-h2:text-2xl prose-h2:font-bold prose-h2:tracking-tight prose-h3:text-lg first:prose-h2:mt-0"

export const metadata: Metadata = {
  title: 'Términos y condiciones',
  description: 'Términos y condiciones de uso de la Federación de Ajedrez del Sur del Gran Buenos Aires',
}

export default function TerminosCondicionesPage() {
  return (
    <>
      <PageHero
        title="Términos y condiciones"
        subtitle="Última actualización: 29 de septiembre de 2025"
      />

      <section className="w-full pt-6 pb-12 md:pt-8 md:pb-16">
        <div className="container px-4 md:px-6">
          <article className={LEGAL_PROSE}>
            <h2>1. Aceptación de los términos</h2>
            <p>
              Bienvenido al sitio web de la Federación de Ajedrez del Sur del Gran Buenos Aires ("FASGBA", "nosotros" o "nuestro"). 
              Al acceder y usar fasgba.com (el "Sitio"), usted acepta estar sujeto a estos Términos y Condiciones ("Términos").
            </p>
            <p>
              Si no está de acuerdo con estos Términos, por favor no use el Sitio. Nos reservamos el derecho de modificar 
              estos Términos en cualquier momento, y su uso continuado del Sitio constituye su aceptación de cualquier cambio.
            </p>

            <h2>2. Definiciones</h2>
            <ul>
              <li><strong>"Usuario":</strong> Cualquier persona que acceda o use el Sitio</li>
              <li><strong>"Cuenta":</strong> Perfil de usuario registrado en el Sitio</li>
              <li><strong>"Contenido":</strong> Toda información, texto, imágenes y datos en el Sitio</li>
              <li><strong>"Servicios":</strong> Funcionalidades proporcionadas a través del Sitio</li>
              <li><strong>"Club Afiliado":</strong> Club de ajedrez reconocido oficialmente por FASGBA</li>
            </ul>

            <h2>3. Uso del sitio</h2>
            <h3>3.1 Elegibilidad</h3>
            <p>
              Para crear una cuenta, debe tener al menos 13 años de edad. Los menores entre 13 y 18 años deben contar con 
              la autorización de sus padres o tutores.
            </p>

            <h3>3.2 Registro de cuenta</h3>
            <p>Para acceder a ciertas funcionalidades, debe crear una cuenta proporcionando:</p>
            <ul>
              <li>Información precisa y completa</li>
              <li>Una dirección de correo electrónico válida</li>
              <li>Una contraseña segura</li>
            </ul>
            <p>
              Usted es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades 
              que ocurran bajo su cuenta.
            </p>

            <h3>3.3 Uso permitido</h3>
            <p>Usted se compromete a usar el Sitio únicamente para:</p>
            <ul>
              <li>Consultar información sobre torneos, clubes y ranking</li>
              <li>Registrarse en eventos y torneos</li>
              <li>Recibir notificaciones relacionadas con el ajedrez</li>
              <li>Interactuar con contenido de forma legal y respetuosa</li>
            </ul>

            <h2>4. Conductas prohibidas</h2>
            <p>Está estrictamente prohibido:</p>
            <ul>
              <li>Proporcionar información falsa o engañosa</li>
              <li>Suplantar la identidad de otra persona</li>
              <li>Usar el Sitio para actividades ilegales o fraudulentas</li>
              <li>Intentar acceder a áreas restringidas sin autorización</li>
              <li>Interferir con el funcionamiento del Sitio</li>
              <li>Cargar virus, malware o código dañino</li>
              <li>Realizar scraping o extracción automatizada de datos</li>
              <li>Acosar, amenazar o intimidar a otros usuarios</li>
              <li>Publicar contenido ofensivo, difamatorio o ilegal</li>
              <li>Vender o transferir su cuenta a terceros</li>
            </ul>

            <h2>5. Torneos y ranking</h2>
            <h3>5.1 Información de torneos</h3>
            <p>
              La información sobre torneos se proporciona con fines informativos. FASGBA se reserva el derecho de modificar, 
              cancelar o reprogramar torneos sin previo aviso.
            </p>

            <h3>5.2 Inscripciones</h3>
            <p>
              Las inscripciones a torneos están sujetas a los reglamentos específicos de cada evento. 
              Es responsabilidad del jugador verificar los requisitos y fechas límite.
            </p>

            <h3>5.3 Ranking oficial</h3>
            <p>
              El ranking publicado en el Sitio es el ranking oficial de FASGBA. Los cálculos y actualizaciones 
              se realizan según los reglamentos de la federación. Las disputas sobre el ranking deben dirigirse 
              formalmente a FASGBA.
            </p>

            <h3>5.4 Resultados</h3>
            <p>
              Los resultados de torneos son publicados de buena fe. En caso de error, FASGBA realizará las 
              correcciones necesarias una vez verificados.
            </p>

            <h2>6. Contenido y propiedad intelectual</h2>
            <h3>6.1 Propiedad del sitio</h3>
            <p>
              El Sitio, su diseño, código, logotipos y contenido original son propiedad de FASGBA y están protegidos 
              por leyes de propiedad intelectual. No se autoriza su reproducción sin permiso expreso.
            </p>

            <h3>6.2 Contenido de usuarios</h3>
            <p>
              Al publicar contenido en el Sitio (si aplica), usted otorga a FASGBA una licencia mundial, no exclusiva, 
              libre de regalías para usar, reproducir y mostrar dicho contenido.
            </p>

            <h3>6.3 Contenido de clubes</h3>
            <p>
              Los clubes afiliados son responsables del contenido que publican. FASGBA no asume responsabilidad 
              por la exactitud o legalidad del contenido generado por clubes.
            </p>

            <h2>7. Roles y permisos</h2>
            <h3>7.1 Administradores</h3>
            <p>
              Los administradores de FASGBA tienen acceso completo para gestionar torneos, ranking, noticias 
              y usuarios del Sitio.
            </p>

            <h3>7.2 Administradores de club</h3>
            <p>
              Los administradores de club pueden gestionar información y contenido específico de su club. 
              Este rol es otorgado por FASGBA y puede ser revocado en cualquier momento.
            </p>

            <h3>7.3 Usuarios registrados</h3>
            <p>
              Los usuarios registrados pueden acceder a funcionalidades adicionales como notificaciones 
              personalizadas y seguimiento de clubes.
            </p>

            <h2>8. Notificaciones y comunicaciones</h2>
            <p>
              Al registrarse, acepta recibir comunicaciones de FASGBA por correo electrónico, incluyendo:
            </p>
            <ul>
              <li>Anuncios de torneos y eventos</li>
              <li>Actualizaciones del ranking</li>
              <li>Noticias de FASGBA y clubes</li>
              <li>Comunicaciones administrativas importantes</li>
            </ul>
            <p>
              Puede gestionar sus preferencias de notificación en cualquier momento desde la página de Ajustes.
            </p>

            <h2>9. Privacidad</h2>
            <p>
              El uso de sus datos personales está regido por nuestra{' '}
              <a href="/politica-privacidad">
                Política de Privacidad
              </a>, que forma parte integral de estos Términos.
            </p>

            <h2>10. Suspensión y terminación de cuentas</h2>
            <h3>10.1 Por el usuario</h3>
            <p>
              Puede eliminar su cuenta en cualquier momento contactando a secretaria@fasgba.com. 
              Algunos datos pueden conservarse según lo requerido por ley.
            </p>

            <h3>10.2 Por FASGBA</h3>
            <p>
              Nos reservamos el derecho de suspender o terminar su cuenta inmediatamente, sin previo aviso, si:
            </p>
            <ul>
              <li>Viola estos Términos y Condiciones</li>
              <li>Proporciona información falsa</li>
              <li>Realiza actividades fraudulentas o ilegales</li>
              <li>Interfiere con el funcionamiento del Sitio</li>
              <li>Abusa o acosa a otros usuarios</li>
            </ul>

            <h2>11. Limitación de responsabilidad</h2>
            <p>
              En la medida máxima permitida por la ley:
            </p>
            <ul>
              <li>El Sitio se proporciona "tal cual" y "según disponibilidad"</li>
              <li>No garantizamos que el Sitio esté libre de errores o interrupciones</li>
              <li>No somos responsables de daños directos, indirectos, incidentales o consecuentes</li>
              <li>No somos responsables por contenido de terceros o enlaces externos</li>
              <li>No garantizamos la exactitud de toda la información publicada</li>
            </ul>
            <p>
              Usted asume toda la responsabilidad por el uso del Sitio y cualquier consecuencia derivada.
            </p>

            <h2>12. Indemnización</h2>
            <p>
              Usted acepta indemnizar y mantener indemne a FASGBA, sus directivos, empleados y afiliados de cualquier 
              reclamo, demanda, pérdida o daño que surja de:
            </p>
            <ul>
              <li>Su uso del Sitio</li>
              <li>Su violación de estos Términos</li>
              <li>Su violación de derechos de terceros</li>
              <li>Contenido que usted publique o transmita</li>
            </ul>

            <h2>13. Disputas y apelaciones</h2>
            <p>
              Las disputas relacionadas con torneos, ranking o sanciones deben ser presentadas formalmente por escrito a:
            </p>
            <p>
              Email: <a href="mailto:secretaria@fasgba.com">secretaria@fasgba.com</a>
            </p>
            <p>
              Las decisiones de la comisión directiva de FASGBA son finales y vinculantes.
            </p>

            <h2>14. Modificaciones del servicio</h2>
            <p>
              FASGBA se reserva el derecho de:
            </p>
            <ul>
              <li>Modificar o discontinuar cualquier aspecto del Sitio</li>
              <li>Cambiar estas condiciones en cualquier momento</li>
              <li>Implementar nuevas funcionalidades o restricciones</li>
            </ul>
            <p>
              Los cambios significativos serán notificados a través del Sitio o por correo electrónico.
            </p>

            <h2>15. Enlaces a terceros</h2>
            <p>
              El Sitio puede contener enlaces a sitios web de terceros. FASGBA no controla ni es responsable 
              del contenido, políticas o prácticas de sitios de terceros. El acceso a estos sitios es bajo 
              su propio riesgo.
            </p>

            <h2>16. Fuerza mayor</h2>
            <p>
              FASGBA no será responsable por incumplimientos debido a circunstancias fuera de su control razonable, 
              incluyendo desastres naturales, fallas técnicas, pandemias, o decisiones gubernamentales.
            </p>

            <h2>17. Ley aplicable y jurisdicción</h2>
            <p>
              Estos Términos se rigen por las leyes de la República Argentina. Cualquier disputa legal se someterá 
              a la jurisdicción de los tribunales competentes de la Provincia de Buenos Aires, Argentina.
            </p>

            <h2>18. Divisibilidad</h2>
            <p>
              Si alguna disposición de estos Términos se considera inválida o inaplicable, las demás disposiciones 
              permanecerán en pleno vigor y efecto.
            </p>

            <h2>19. Acuerdo completo</h2>
            <p>
              Estos Términos, junto con la Política de Privacidad, constituyen el acuerdo completo entre usted y 
              FASGBA respecto al uso del Sitio, y reemplazan todos los acuerdos previos.
            </p>

            <h2>20. Contacto</h2>
            <p>
              Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos:
            </p>
            <div>
              <p><strong>Federación de Ajedrez del Sur del Gran Buenos Aires (FASGBA)</strong></p>
              <p>Email: <a href="mailto:secretaria@fasgba.com">secretaria@fasgba.com</a></p>
              <p>Teléfono: +54 911 4028 2610</p>
              <p>Sitio web: <a href="https://fasgba.com">https://fasgba.com</a></p>
            </div>

            <p className="border-t pt-6 text-sm text-muted-foreground">
              Al usar el Sitio, usted reconoce que ha leído, entendido y acepta estar sujeto a estos Términos y Condiciones.
            </p>
          </article>
        </div>
      </section>
    </>
  )
}
