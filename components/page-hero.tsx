interface PageHeroProps {
  title: string
  subtitle?: string
}

// Encabezado estándar para las páginas: título compacto alineado con el contenido.
export function PageHero({ title, subtitle }: PageHeroProps) {
  return (
    <section className="w-full pt-8 md:pt-12">
      <div className="container px-4 md:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-terracotta md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </section>
  )
}
