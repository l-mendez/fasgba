import { ChevronDown } from "lucide-react"

import type { CrDetails } from "@/lib/chess-results/types"
import type { PlanField } from "@/lib/chess-results/plan"
import { PlanStatusBadge } from "./plan-status"

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <dt className="text-sm font-medium">{label}</dt>
      <dd className="min-w-0 break-words text-sm">{children}</dd>
    </div>
  )
}

/**
 * Tournament fields a sync writes into an existing tournament: what gets filled
 * in, and where the site and chess-results disagree (the site value is kept).
 */
export function PlanFields({ fields, details }: { fields: PlanField[]; details: CrDetails }) {
  const changes = fields.filter((f) => f.action !== "keep")
  const differences = fields.filter((f) => f.action === "keep" && f.current !== f.value)
  const info: Array<[string, string | null]> = [
    ["Organizador", details.organizer],
    ["Director", details.director],
    ["Árbitro principal", details.chiefArbiter],
    ["Sistema", details.system],
    ["Ritmo", details.timeControl],
    ["Última actualización", details.lastUpdate],
  ]
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-terracotta">Se completa en el torneo</h3>
        {changes.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nada: los datos del torneo ya están cargados.</p>
        ) : (
          <dl className="mt-2 divide-y">
            {changes.map((f) => (
              <Row key={f.label} label={f.label}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="min-w-0">{f.value}</span>
                  <PlanStatusBadge status={f.action === "set" ? "new" : "fill"} label={f.action === "set" ? "Se carga" : "Se completa"} />
                </div>
              </Row>
            ))}
          </dl>
        )}
      </section>

      {differences.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-terracotta">Distinto en chess-results</h3>
          <p className="mt-1 text-sm text-muted-foreground">Se mantiene lo del sitio; editalo en el torneo si chess-results tiene razón.</p>
          <dl className="mt-2 divide-y">
            {differences.map((f) => (
              <Row key={f.label} label={f.label}>
                <p>{f.current}</p>
                <p className="text-xs text-muted-foreground">chess-results: {f.value}</p>
              </Row>
            ))}
          </dl>
        </section>
      )}

      <details className="group rounded-lg border px-4">
        <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-sm font-medium">
          Más datos de chess-results
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <dl className="divide-y border-t">
          {info.filter(([, value]) => value).map(([label, value]) => <Row key={label} label={label}>{value}</Row>)}
        </dl>
      </details>
    </div>
  )
}
