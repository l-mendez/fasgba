import { HelpCircle } from "lucide-react"

import { FaqAccordion } from "@/components/faq-section"
import { ScrollReveal } from "@/components/scroll-reveal"

export function HomeFaqSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <ScrollReveal>
        <div className="container px-4 md:px-6">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
          />
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/15 dark:bg-amber/10">
                  <HelpCircle className="h-5 w-5 text-amber" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  Preguntas Frecuentes
                </h2>
              </div>
              <p className="text-muted-foreground ml-[52px]">
                Respuestas a las consultas más comunes
              </p>
            </div>
          </div>
          <div className="mx-auto max-w-3xl">
            <FaqAccordion items={faqs} />
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}

const faqs = [
  {
    question: "¿Cómo puedo afiliar mi club a FASGBA?",
    answer: "Para afiliar tu club, debés completar el formulario de afiliación disponible en la sección de Clubes y enviarlo junto con la documentación requerida. También podés contactarnos por email o acercarte a cualquiera de nuestros clubes afiliados para más información.",
  },
  {
    question: "¿Cómo me inscribo en un torneo?",
    answer: "Podés inscribirte directamente desde la página del torneo que te interese, donde encontrarás los detalles de inscripción, costos y requisitos. Algunos torneos también permiten inscripción presencial el día del evento.",
  },
  {
    question: "¿Necesito tener rating para participar en torneos?",
    answer: "No es necesario tener rating para participar en la mayoría de nuestros torneos. Contamos con categorías para todos los niveles, desde principiantes hasta jugadores avanzados. Al participar, comenzarás a obtener tu rating FASGBA.",
  },
  {
    question: "¿Cómo puedo consultar mi rating o el de otro jugador?",
    answer: "Podés consultar los ratings en la sección de Rankings de nuestro sitio. Ahí encontrarás el listado completo de jugadores con su rating actualizado, con opciones de búsqueda por nombre o club.",
  },
  {
    question: "¿Qué beneficios tiene ser parte de un club afiliado?",
    answer: "Los jugadores de clubes afiliados pueden participar en todos los torneos oficiales de FASGBA, acceder al sistema de rankings, representar a su club en competencias interclub y formar parte de una comunidad activa de ajedrecistas en la región sur del Gran Buenos Aires.",
  },
  {
    question: "¿Cómo puedo contactar a FASGBA?",
    answer: "Podés escribirnos a través de nuestras redes sociales o por email. También podés acercarte a cualquiera de nuestros clubes afiliados, donde te podrán orientar y poner en contacto con la federación.",
  },
]

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(faq => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
}
