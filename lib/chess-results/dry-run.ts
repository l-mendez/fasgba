// Read-only Supabase client for dry runs: reads hit the real database, writes
// (insert/upsert/update/delete) are swallowed and answered with fake rows
// (negative ids), so the sync code runs unchanged and reports what it would do.

import type { SupabaseClient } from '@supabase/supabase-js'

const WRITES = new Set(['insert', 'upsert', 'update', 'delete'])

function fakeWrite(method: string, values: unknown, nextId: () => number) {
  const rows = method === 'insert' || method === 'upsert' ? [values].flat() as Record<string, unknown>[] : []
  const data = rows.map((row) => ({ ...row, id: nextId() }))
  let single = false
  // Any chained builder call (.select(), .eq(), .single(), ...) returns the same thenable.
  const chain: unknown = new Proxy({}, {
    get(_, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
          Promise.resolve({ data: single ? data[0] ?? null : data, error: null }).then(resolve, reject)
      }
      return () => {
        if (prop === 'single' || prop === 'maybeSingle') single = true
        return chain
      }
    },
  })
  return chain
}

export function readOnlyClient(db: SupabaseClient): SupabaseClient {
  let id = 0
  const nextId = () => --id
  return new Proxy(db, {
    get(target, prop, receiver) {
      if (prop !== 'from') return Reflect.get(target, prop, receiver)
      return (table: string) => new Proxy(target.from(table), {
        get(builder, method) {
          if (typeof method === 'string' && WRITES.has(method)) return (values: unknown) => fakeWrite(method, values, nextId)
          const value = Reflect.get(builder, method)
          return typeof value === 'function' ? value.bind(builder) : value
        },
      })
    },
  })
}
