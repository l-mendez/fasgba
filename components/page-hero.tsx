interface PageHeroProps {
  title: string
  subtitle: string
}

// Encabezado estándar para las páginas: título y subtítulo centrados sobre un degradado.
export function PageHero({ title, subtitle }: PageHeroProps) {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-terracotta/10 to-amber/5">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl text-muted-foreground">{title}</h1>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
