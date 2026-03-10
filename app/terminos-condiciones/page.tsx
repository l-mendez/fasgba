export const dynamic = 'force-dynamic'

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso de la Federación de Ajedrez del Sur del Gran Buenos Aires',
}

export default function TerminosCondicionesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader pathname="/terminos-condiciones" />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-muted-foreground">
                  Términos y Condiciones
                </h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                  Última actualización: {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container max-w-4xl px-4 md:px-6">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>1. Aceptación de los Términos</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>
                    Bienvenido al sitio web de la Federación de Ajedrez del Sur del Gran Buenos Aires ("FASGBA", "nosotros" o "nuestro"). 
                    Al acceder y usar fasgba.com (el "Sitio"), usted acepta estar sujeto a estos Términos y Condiciones ("Términos").
                  </p>
                  <p>
                    Si no está de acuerdo con estos Términos, por favor no use el Sitio. Nos reservamos el derecho de modificar 
                    estos Términos en cualquier momento, y su uso continuado del Sitio constituye su aceptación de cualquier cambio.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. Definiciones</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <ul>
                    <li><strong>"Usuario":</strong> Cualquier persona que acceda o use el Sitio</li>
                    <li><strong>"Cuenta":</strong> Perfil de usuario registrado en el Sitio</li>
                    <li><strong>"Contenido":</strong> Toda información, texto, imágenes y datos en el Sitio</li>
                    <li><strong>"Servicios":</strong> Funcionalidades proporcionadas a través del Sitio</li>
                    <li><strong>"Club Afiliado":</strong> Club de ajedrez reconocido oficialmente por FASGBA</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. Uso del Sitio</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <h3 className="text-lg font-semibold mt-4 mb-2">3.1 Elegibilidad</h3>
                  <p>
                    Para crear una cuenta, debe tener al menos 13 años de edad. Los menores entre 13 y 18 años deben contar con 
                    la autorización de sus padres o tutores.
                  </p>

                  <h3 className="text-lg font-semibold mt-4 mb-2">3.2 Registro de Cuenta</h3>
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

                  <h3 className="text-lg font-semibold mt-4 mb-2">3.3 Uso Permitido</h3>
                  <p>Usted se compromete a usar el Sitio únicamente para:</p>
                  <ul>
                    <li>Consultar información sobre torneos, clubes y ranking</li>
                    <li>Registrarse en eventos y torneos</li>
                    <li>Recibir notificaciones relacionadas con el ajedrez</li>
                    <li>Interactuar con contenido de forma legal y respetuosa</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>4. Conductas Prohibidas</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>5. Torneos y Ranking</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <h3 className="text-lg font-semibold mt-4 mb-2">5.1 Información de Torneos</h3>
                  <p>
                    La información sobre torneos se proporciona con fines informativos. FASGBA se reserva el derecho de modificar, 
                    cancelar o reprogramar torneos sin previo aviso.
                  </p>

                  <h3 className="text-lg font-semibold mt-4 mb-2">5.2 Inscripciones</h3>
                  <p>
                    Las inscripciones a torneos están sujetas a los reglamentos específicos de cada evento. 
                    Es responsabilidad del jugador verificar los requisitos y fechas límite.
                  </p>

                  <h3 className="text-lg font-semibold mt-4 mb-2">5.3 Ranking Oficial</h3>
                  <p>
                    El ranking publicado en el Sitio es el ranking oficial de FASGBA. Los cálculos y actualizaciones 
                    se realizan según los reglamentos de la federación. Las disputas sobre el ranking deben dirigirse 
                    formalmente a FASGBA.
                  </p>

                  <h3 className="text-lg font-semibold mt-4 mb-2">5.4 Resultados</h3>
                  <p>
                    Los resultados de torneos son publicados de buena fe. En caso de error, FASGBA realizará las 
                    correcciones necesarias una vez verificados.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>6. Contenido y Propiedad Intelectual</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <h3 className="text-lg font-semibold mt-4 mb-2">6.1 Propiedad del Sitio</h3>
                  <p>
                    El Sitio, su diseño, código, logotipos y contenido original son propiedad de FASGBA y están protegidos 
                    por leyes de propiedad intelectual. No se autoriza su reproducción sin permiso expreso.
                  </p>

                  <h3 className="text-lg font-semibold mt-4 mb-2">6.2 Contenido de Usuarios</h3>
                  <p>
                    Al publicar contenido en el Sitio (si aplica), usted otorga a FASGBA una licencia mundial, no exclusiva, 
                    libre de regalías para usar, reproducir y mostrar dicho contenido.
                  </p>

                  <h3 className="text-lg font-semibold mt-4 mb-2">6.3 Contenido de Clubes</h3>
                  <p>
                    Los clubes afiliados son responsables del contenido que publican. FASGBA no asume responsabilidad 
                    por la exactitud o legalidad del contenido generado por clubes.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>7. Roles y Permisos</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <h3 className="text-lg font-semibold mt-4 mb-2">7.1 Administradores</h3>
                  <p>
                    Los administradores de FASGBA tienen acceso completo para gestionar torneos, ranking, noticias 
                    y usuarios del Sitio.
                  </p>

                  <h3 className="text-lg font-semibold mt-4 mb-2">7.2 Administradores de Club</h3>
                  <p>
                    Los administradores de club pueden gestionar información y contenido específico de su club. 
                    Este rol es otorgado por FASGBA y puede ser revocado en cualquier momento.
                  </p>

                  <h3 className="text-lg font-semibold mt-4 mb-2">7.3 Usuarios Registrados</h3>
                  <p>
                    Los usuarios registrados pueden acceder a funcionalidades adicionales como notificaciones 
                    personalizadas y seguimiento de clubes.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>8. Notificaciones y Comunicaciones</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>9. Privacidad</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>
                    El uso de sus datos personales está regido por nuestra{' '}
                    <a href="/politica-privacidad" className="text-terracotta hover:underline">
                      Política de Privacidad
                    </a>, que forma parte integral de estos Términos.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>10. Suspensión y Terminación de Cuentas</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <h3 className="text-lg font-semibold mt-4 mb-2">10.1 Por el Usuario</h3>
                  <p>
                    Puede eliminar su cuenta en cualquier momento contactando a secretaria@fasgba.com. 
                    Algunos datos pueden conservarse según lo requerido por ley.
                  </p>

                  <h3 className="text-lg font-semibold mt-4 mb-2">10.2 Por FASGBA</h3>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>11. Limitación de Responsabilidad</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>12. Indemnización</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>13. Disputas y Apelaciones</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>
                    Las disputas relacionadas con torneos, ranking o sanciones deben ser presentadas formalmente por escrito a:
                  </p>
                  <p>
                    Email: <a href="mailto:secretaria@fasgba.com" className="text-terracotta hover:underline">secretaria@fasgba.com</a>
                  </p>
                  <p>
                    Las decisiones de la comisión directiva de FASGBA son finales y vinculantes.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>14. Modificaciones del Servicio</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>15. Enlaces a Terceros</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>
                    El Sitio puede contener enlaces a sitios web de terceros. FASGBA no controla ni es responsable 
                    del contenido, políticas o prácticas de sitios de terceros. El acceso a estos sitios es bajo 
                    su propio riesgo.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>16. Fuerza Mayor</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>
                    FASGBA no será responsable por incumplimientos debido a circunstancias fuera de su control razonable, 
                    incluyendo desastres naturales, fallas técnicas, pandemias, o decisiones gubernamentales.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>17. Ley Aplicable y Jurisdicción</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>
                    Estos Términos se rigen por las leyes de la República Argentina. Cualquier disputa legal se someterá 
                    a la jurisdicción de los tribunales competentes de la Provincia de Buenos Aires, Argentina.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>18. Divisibilidad</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>
                    Si alguna disposición de estos Términos se considera inválida o inaplicable, las demás disposiciones 
                    permanecerán en pleno vigor y efecto.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>19. Acuerdo Completo</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>
                    Estos Términos, junto con la Política de Privacidad, constituyen el acuerdo completo entre usted y 
                    FASGBA respecto al uso del Sitio, y reemplazan todos los acuerdos previos.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>20. Contacto</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>
                    Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos:
                  </p>
                  <div className="mt-4 space-y-2">
                    <p><strong>Federación de Ajedrez del Sur del Gran Buenos Aires (FASGBA)</strong></p>
                    <p>Email: <a href="mailto:secretaria@fasgba.com" className="text-terracotta hover:underline">secretaria@fasgba.com</a></p>
                    <p>Teléfono: +54 911 4028 2610</p>
                    <p>Sitio web: <a href="https://fasgba.com" className="text-terracotta hover:underline">https://fasgba.com</a></p>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-8 p-6 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  Al usar el Sitio, usted reconoce que ha leído, entendido y acepta estar sujeto a estos Términos y Condiciones.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
