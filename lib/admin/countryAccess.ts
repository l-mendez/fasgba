import "server-only"

import {
  ALL_COUNTRY_CODES,
  CONTINENT_OF,
  COUNTRY_TOGGLE_COOLDOWN_MS,
  PROTECTED_COUNTRY,
  compareCountryNames,
  countryFlag,
  countryName,
  type Continent,
} from "@/lib/countries"
import type { createAdminClient } from "@/lib/supabase/admin"

export const COUNTRY_TRAFFIC_WINDOW_DAYS = 7
export const COUNTRY_LOGS_PAGE_SIZE = 20

export interface CountryAccessOverviewItem {
  code: string
  name: string
  flag: string
  continent: Continent | null
  enabled: boolean
  updatedAt: string | null
  updatedByEmail: string | null
  /** ISO date until which the country cannot be toggled again, if any. */
  cooldownUntil: string | null
  allowed7d: number
  blocked7d: number
}

export interface CountriesOverview {
  countries: CountryAccessOverviewItem[]
  enabledCount: number
  totalCount: number
  blocked7dTotal: number
}

export interface CountryAccessLogItem {
  id: number
  code: string
  name: string
  flag: string
  action: "enabled" | "disabled"
  changedByEmail: string | null
  createdAt: string
}

type AdminSupabase = ReturnType<typeof createAdminClient>

function windowStartDate(): string {
  const start = new Date()
  start.setUTCDate(start.getUTCDate() - (COUNTRY_TRAFFIC_WINDOW_DAYS - 1))
  return start.toISOString().slice(0, 10)
}

/** Latest change per country within the cooldown window, keyed by country code. */
export async function getActiveCooldowns(supabase: AdminSupabase): Promise<Record<string, string>> {
  const since = new Date(Date.now() - COUNTRY_TOGGLE_COOLDOWN_MS).toISOString()

  const { data, error } = await supabase
    .from("country_access_log")
    .select("country_code, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })

  if (error) throw error

  const cooldowns: Record<string, string> = {}
  for (const row of data || []) {
    if (cooldowns[row.country_code]) continue
    cooldowns[row.country_code] = new Date(
      new Date(row.created_at).getTime() + COUNTRY_TOGGLE_COOLDOWN_MS
    ).toISOString()
  }

  return cooldowns
}

/** Audit rows, newest first, optionally filtered by country. */
export async function fetchCountryLogs(
  supabase: AdminSupabase,
  options: { country?: string; limit?: number; offset?: number } = {}
): Promise<CountryAccessLogItem[]> {
  const limit = options.limit ?? COUNTRY_LOGS_PAGE_SIZE
  const offset = options.offset ?? 0

  let query = supabase
    .from("country_access_log")
    .select("id, country_code, action, changed_by_email, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (options.country) query = query.eq("country_code", options.country)

  const { data, error } = await query
  if (error) throw error

  return (data || []).map((row) => ({
    id: row.id,
    code: row.country_code,
    name: countryName(row.country_code),
    flag: countryFlag(row.country_code),
    action: row.action === "disabled" ? "disabled" : "enabled",
    changedByEmail: row.changed_by_email,
    createdAt: row.created_at,
  }))
}

/**
 * Merges the full ISO country list with the allowlist rows, active cooldowns
 * and the 7-day traffic counters. Countries without a row are blocked.
 */
export async function buildCountriesOverview(supabase: AdminSupabase): Promise<CountriesOverview> {
  const [accessResult, trafficResult, cooldowns] = await Promise.all([
    supabase.from("country_access").select("country_code, enabled, updated_at, updated_by_email"),
    supabase
      .from("country_traffic_daily")
      .select("country_code, allowed_count, blocked_count")
      .gte("day", windowStartDate()),
    getActiveCooldowns(supabase),
  ])

  if (accessResult.error) throw accessResult.error
  if (trafficResult.error) throw trafficResult.error

  const accessByCode = new Map((accessResult.data || []).map((row) => [row.country_code, row]))

  const traffic = new Map<string, { allowed: number; blocked: number }>()
  for (const row of trafficResult.data || []) {
    const current = traffic.get(row.country_code) || { allowed: 0, blocked: 0 }
    current.allowed += row.allowed_count
    current.blocked += row.blocked_count
    traffic.set(row.country_code, current)
  }

  // Include codes only known to the DB or to the traffic table so nothing is unmanageable.
  const codes = new Set([...ALL_COUNTRY_CODES, ...accessByCode.keys(), ...traffic.keys()])

  const countries = Array.from(codes)
    .map<CountryAccessOverviewItem>((code) => {
      const access = accessByCode.get(code)
      const counts = traffic.get(code)

      return {
        code,
        name: countryName(code),
        flag: countryFlag(code),
        continent: CONTINENT_OF[code] ?? null,
        enabled: access?.enabled ?? false,
        updatedAt: access?.updated_at ?? null,
        updatedByEmail: access?.updated_by_email ?? null,
        cooldownUntil: cooldowns[code] ?? null,
        allowed7d: counts?.allowed ?? 0,
        blocked7d: counts?.blocked ?? 0,
      }
    })
    .sort((a, b) => compareCountryNames(a.name, b.name))

  return {
    countries,
    enabledCount: countries.filter((country) => country.enabled).length,
    totalCount: countries.length,
    blocked7dTotal: countries.reduce((total, country) => total + country.blocked7d, 0),
  }
}

export type CountrySkipReason = "protected" | "cooldown" | "unchanged" | "invalid"

export interface CountryToggleSkip {
  code: string
  reason: CountrySkipReason
  retryAfterSeconds?: number
}

export interface CountryToggleResult {
  updated: string[]
  skipped: CountryToggleSkip[]
  /** Cooldown expiry per updated country. */
  cooldownUntil: Record<string, string>
}

/**
 * Applies an enable/disable change to a set of countries, skipping (never
 * failing) the ones that are protected, unchanged or still in cooldown.
 */
export async function applyCountryToggles(
  supabase: AdminSupabase,
  codes: string[],
  enabled: boolean,
  changedByEmail: string | null
): Promise<CountryToggleResult> {
  const unique = Array.from(new Set(codes.map((code) => code.trim().toUpperCase())))
  const now = Date.now()

  const [cooldowns, currentResult] = await Promise.all([
    getActiveCooldowns(supabase),
    supabase.from("country_access").select("country_code, enabled").in("country_code", unique),
  ])

  if (currentResult.error) throw currentResult.error

  const currentByCode = new Map(
    (currentResult.data || []).map((row) => [row.country_code, row.enabled])
  )

  const updated: string[] = []
  const skipped: CountryToggleSkip[] = []

  for (const code of unique) {
    if (!/^[A-Z]{2}$/.test(code)) {
      skipped.push({ code, reason: "invalid" })
      continue
    }
    if (code === PROTECTED_COUNTRY && !enabled) {
      skipped.push({ code, reason: "protected" })
      continue
    }
    if ((currentByCode.get(code) ?? false) === enabled) {
      skipped.push({ code, reason: "unchanged" })
      continue
    }

    const cooldownUntil = cooldowns[code]
    if (cooldownUntil && new Date(cooldownUntil).getTime() > now) {
      skipped.push({
        code,
        reason: "cooldown",
        retryAfterSeconds: Math.ceil((new Date(cooldownUntil).getTime() - now) / 1000),
      })
      continue
    }

    updated.push(code)
  }

  if (updated.length > 0) {
    const { error: upsertError } = await supabase.from("country_access").upsert(
      updated.map((code) => ({
        country_code: code,
        enabled,
        updated_at: new Date().toISOString(),
        updated_by_email: changedByEmail,
      })),
      { onConflict: "country_code" }
    )

    if (upsertError) throw upsertError

    // Audit insert is fire-and-forget: a failed log must not undo the change.
    const { error: logError } = await supabase.from("country_access_log").insert(
      updated.map((code) => ({
        country_code: code,
        action: enabled ? "enabled" : "disabled",
        changed_by_email: changedByEmail,
      }))
    )

    if (logError) console.error("Error writing country_access_log:", logError)
  }

  const nextCooldown = new Date(now + COUNTRY_TOGGLE_COOLDOWN_MS).toISOString()

  return {
    updated,
    skipped,
    cooldownUntil: Object.fromEntries(updated.map((code) => [code, nextCooldown])),
  }
}
