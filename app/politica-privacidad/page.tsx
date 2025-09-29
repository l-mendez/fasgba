import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad de la Federación de Ajedrez del Sur del Gran Buenos Aires',
}

export default function PoliticaPrivacidadPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader pathname="/politica-privacidad" />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-muted-foreground">
                  Política de Privacidad
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
                  <CardTitle>1. Introducción</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>
                    La Federación de Ajedrez del Sur del Gran Buenos Aires (en adelante, "FASGBA", "nosotros" o "nuestro") 
                    se compromete a proteger la privacidad de los usuarios de nuestro sitio web fasgba.com (el "Sitio"). 
                    Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos su información personal.
                  </p>
                  <p>
                    Esta política cumple con la Ley N° 25.326 de Protección de Datos Personales de la República Argentina 
                    y normativas aplicables.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. Información que Recopilamos</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>Recopilamos los siguientes tipos de información:</p>
                  
                  <h3 className="text-lg font-semibold mt-4 mb-2">2.1 Información que Usted nos Proporciona:</h3>
                  <ul>
                    <li><strong>Datos de registro:</strong> Nombre, apellido, correo electrónico, contraseña</li>
                    <li><strong>Datos de perfil:</strong> Información adicional que elija compartir</li>
                    <li><strong>Datos de contacto:</strong> Cuando nos contacta o participa en eventos</li>
                    <li><strong>Afiliación:</strong> Club al que pertenece, si aplica</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-4 mb-2">2.2 Información Recopilada Automáticamente:</h3>
                  <ul>
                    <li><strong>Datos de navegación:</strong> Dirección IP, tipo de navegador, páginas visitadas</li>
                    <li><strong>Cookies:</strong> Información almacenada en su dispositivo para mejorar la experiencia</li>
                    <li><strong>Datos de sesión:</strong> Información sobre su uso del Sitio</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. Cómo Usamos su Información</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>4. Compartir Información</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>No vendemos ni alquilamos su información personal. Podemos compartir su información con:</p>
                  
                  <h3 className="text-lg font-semibold mt-4 mb-2">4.1 Proveedores de Servicios:</h3>
                  <ul>
                    <li><strong>Supabase:</strong> Para autenticación y almacenamiento de datos</li>
                    <li><strong>Servicios de email:</strong> Para envío de notificaciones</li>
                    <li><strong>Servicios de hosting:</strong> Para alojar el Sitio</li>
                  </ul>

                  <h3 className="text-lg font-semibold mt-4 mb-2">4.2 Información Pública:</h3>
                  <p>
                    El ranking de jugadores y resultados de torneos son información pública visible para todos los usuarios del Sitio.
                  </p>

                  <h3 className="text-lg font-semibold mt-4 mb-2">4.3 Requisitos Legales:</h3>
                  <p>
                    Podemos divulgar su información cuando sea requerido por ley o para proteger nuestros derechos legales.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>5. Seguridad de los Datos</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>6. Cookies y Tecnologías Similares</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>7. Sus Derechos</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
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
                    Para ejercer estos derechos, contáctenos en: <a href="mailto:secretaria@fasgba.com" className="text-terracotta hover:underline">secretaria@fasgba.com</a>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>8. Notificaciones por Email</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>9. Retención de Datos</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>
                    Conservamos su información personal durante el tiempo necesario para cumplir con los propósitos descritos 
                    en esta política, a menos que la ley requiera o permita un período de retención más largo.
                  </p>
                  <p>
                    Los datos del ranking y resultados de torneos se conservan de forma permanente como registro histórico 
                    de la federación.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>10. Menores de Edad</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>
                    Nuestro Sitio no está dirigido a menores de 13 años. No recopilamos intencionalmente información de menores. 
                    Si es padre o tutor y cree que su hijo nos ha proporcionado información personal, contáctenos para que podamos 
                    eliminarla.
                  </p>
                  <p>
                    Los menores entre 13 y 18 años deben contar con la autorización de sus padres o tutores para registrarse.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>11. Enlaces a Terceros</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>
                    Nuestro Sitio puede contener enlaces a sitios web de terceros. No somos responsables de las prácticas de 
                    privacidad de estos sitios. Le recomendamos leer las políticas de privacidad de cada sitio que visite.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>12. Cambios a esta Política</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>
                    Podemos actualizar esta Política de Privacidad ocasionalmente. Le notificaremos sobre cambios significativos 
                    mediante un aviso destacado en el Sitio o por correo electrónico. La fecha de "Última actualización" al inicio 
                    de esta política indica cuándo fue revisada por última vez.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>13. Contacto</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>
                    Si tiene preguntas, inquietudes o solicitudes relacionadas con esta Política de Privacidad o el tratamiento 
                    de sus datos personales, puede contactarnos:
                  </p>
                  <div className="mt-4 space-y-2">
                    <p><strong>Federación de Ajedrez del Sur del Gran Buenos Aires (FASGBA)</strong></p>
                    <p>Email: <a href="mailto:secretaria@fasgba.com" className="text-terracotta hover:underline">secretaria@fasgba.com</a></p>
                    <p>Teléfono: +54 911 4028 2610</p>
                    <p>Sitio web: <a href="https://fasgba.com" className="text-terracotta hover:underline">https://fasgba.com</a></p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>14. Autoridad de Aplicación</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-gray dark:prose-invert max-w-none">
                  <p>
                    La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la Ley N° 25.326, 
                    tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento 
                    de las normas sobre protección de datos personales.
                  </p>
                  <p>
                    Sitio web: <a href="https://www.argentina.gob.ar/aaip" target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">
                      www.argentina.gob.ar/aaip
                    </a>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
