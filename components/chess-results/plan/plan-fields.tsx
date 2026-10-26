import type { CrDetails } from "@/lib/chess-results/types"
import type { PlanField } from "@/lib/chess-results/plan"
import { PlanStatusBadge } from "./plan-status"

const ACTION = { set: { status: "new", label: "Se carga" }, fill: { status: "fill", label: "Se completa" }, keep: { status: "exists", label: "Se mantiene" } } as const

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <dt className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</dt>
      <dd className="min-w-0 break-words text-sm">{children}</dd>
    </div>
  )
}

/** Tournament fields the import writes, plus chess-results details shown for reference. */
export function PlanFields({ fields, details }: { fields: PlanField[]; details: CrDetails }) {
  const info: Array<[string, string | null]> = [
    ["Organizador", details.organizer],
    ["Director", details.director],
    ["Árbitro principal", details.chiefArbiter],
    ["Sistema", details.system],
    ["Última actualización", details.lastUpdate],
  ]
  return (
    <div className="space-y-4">
      <dl className="divide-y">
        {fields.map((field) => {
          const differs = field.action === "keep" && field.current !== field.value
          return (
            <Row key={field.label} label={field.label}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="min-w-0">{field.action === "keep" ? field.current : field.value}</span>
                <PlanStatusBadge status={ACTION[field.action].status} label={ACTION[field.action].label} />
              </div>
              {differs && (
                <p className="mt-1 text-xs text-muted-foreground">En chess-results: {field.value}</p>
              )}
            </Row>
          )
        })}
      </dl>
      <div>
        <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Datos de chess-results (no se guardan)</h4>
        <dl className="divide-y">
          {info.filter(([, value]) => value).map(([label, value]) => <Row key={label} label={label}>{value}</Row>)}
        </dl>
      </div>
    </div>
  )
}
