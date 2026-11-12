// Search and AI crawlers crawl from many countries (Bingbot and ChatGPT-User
// use datacenters in the US, UK, Asia...), so the country allowlist in proxy.ts
// would block them. A request is a verified crawler only when its user agent
// names one AND its IP is inside that crawler's officially published ranges, so
// spoofing the user agent from a blocked country doesn't get through.
const GOOGLE = 'https://developers.google.com/static/crawling/ipranges'

const CRAWLERS: { userAgent: RegExp; rangesUrl: string }[] = [
  { userAgent: /Googlebot|Google-InspectionTool|GoogleOther|Storebot-Google/i, rangesUrl: `${GOOGLE}/common-crawlers.json` },
  { userAgent: /Google-Site-Verification|Google-Read-Aloud|FeedFetcher-Google/i, rangesUrl: `${GOOGLE}/user-triggered-fetchers-google.json` },
  { userAgent: /bingbot|BingPreview|adidxbot/i, rangesUrl: 'https://www.bing.com/toolbox/bingbot.json' },
  { userAgent: /OAI-SearchBot/i, rangesUrl: 'https://openai.com/searchbot.json' },
  { userAgent: /GPTBot/i, rangesUrl: 'https://openai.com/gptbot.json' },
  { userAgent: /ChatGPT-User/i, rangesUrl: 'https://openai.com/chatgpt-user.json' },
  { userAgent: /PerplexityBot/i, rangesUrl: 'https://www.perplexity.ai/perplexitybot.json' },
  { userAgent: /Perplexity-User/i, rangesUrl: 'https://www.perplexity.ai/perplexity-user.json' },
  { userAgent: /ClaudeBot|Claude-SearchBot|Claude-User/i, rangesUrl: 'https://claude.com/crawling/bots.json' },
  { userAgent: /Applebot/i, rangesUrl: 'https://search.developer.apple.com/applebot.json' },
]

const RANGES_TTL_MS = 24 * 60 * 60 * 1000
// After a failed download, retry soon instead of waiting a whole TTL.
const RETRY_AFTER_MS = 5 * 60 * 1000
const FETCH_TIMEOUT_MS = 2000

type Ip = { v6: boolean; value: bigint }
type Cidr = { v6: boolean; base: bigint; bits: number }
type PublishedRanges = { prefixes?: { ipv4Prefix?: string; ipv6Prefix?: string }[] }

const rangesCache = new Map<string, { cidrs: Cidr[]; expiresAt: number }>()
// One download per URL at a time, shared by concurrent crawler requests.
const inFlight = new Map<string, Promise<Cidr[]>>()

function parseIpv4(ip: string): bigint | null {
  const octets = ip.split('.')
  if (octets.length !== 4 || octets.some((o) => !/^\d{1,3}$/.test(o) || Number(o) > 255)) return null
  return octets.reduce((acc, o) => (acc << BigInt(8)) + BigInt(o), BigInt(0))
}

function parseIp(raw: string): Ip | null {
  const ip = raw.split('%')[0]
  if (!ip.includes(':')) {
    const value = parseIpv4(ip)
    return value === null ? null : { v6: false, value }
  }
  // IPv4-mapped IPv6 (::ffff:1.2.3.4) is matched as IPv4.
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip)
  if (mapped) {
    const value = parseIpv4(mapped[1])
    return value === null ? null : { v6: false, value }
  }
  const halves = ip.split('::')
  if (halves.length > 2) return null
  const left = halves[0] ? halves[0].split(':') : []
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : []
  const fill = 8 - left.length - right.length
  if (halves.length === 2 ? fill < 1 : fill !== 0) return null
  const groups = [...left, ...Array<string>(fill).fill('0'), ...right]
  if (groups.some((g) => !/^[0-9a-f]{1,4}$/i.test(g))) return null
  return { v6: true, value: groups.reduce((acc, g) => (acc << BigInt(16)) + BigInt(parseInt(g, 16)), BigInt(0)) }
}

function parseCidr(cidr: string): Cidr | null {
  const [ip, bitsText] = cidr.split('/')
  const parsed = parseIp(ip)
  const bits = Number(bitsText)
  if (!parsed || !/^\d+$/.test(bitsText ?? '') || bits > (parsed.v6 ? 128 : 32)) return null
  return { v6: parsed.v6, base: parsed.value, bits }
}

function inCidr(ip: Ip, cidr: Cidr): boolean {
  if (ip.v6 !== cidr.v6) return false
  const shift = BigInt((ip.v6 ? 128 : 32) - cidr.bits)
  return ip.value >> shift === cidr.base >> shift
}

async function downloadRanges(url: string, previous: Cidr[]): Promise<Cidr[]> {
  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!response.ok) throw new Error(`${url}: ${response.status}`)
    const data: PublishedRanges = await response.json()
    const cidrs = (data.prefixes ?? [])
      .map((p) => p.ipv4Prefix ?? p.ipv6Prefix)
      .flatMap((c) => (c ? [parseCidr(c)] : []))
      .filter((c): c is Cidr => c !== null)
    rangesCache.set(url, { cidrs, expiresAt: Date.now() + RANGES_TTL_MS })
    return cidrs
  } catch {
    // Keep the last known ranges and retry soon.
    rangesCache.set(url, { cidrs: previous, expiresAt: Date.now() + RETRY_AFTER_MS })
    return previous
  } finally {
    inFlight.delete(url)
  }
}

function getRanges(url: string): Promise<Cidr[]> {
  const cached = rangesCache.get(url)
  if (cached && Date.now() < cached.expiresAt) return Promise.resolve(cached.cidrs)
  let pending = inFlight.get(url)
  if (!pending) {
    pending = downloadRanges(url, cached?.cidrs ?? [])
    inFlight.set(url, pending)
  }
  return pending
}

/** True when the request comes from a known crawler's published IP ranges. */
export async function isVerifiedCrawler(userAgent: string | null, ip: string | null): Promise<boolean> {
  if (!userAgent || !ip) return false
  const crawler = CRAWLERS.find((c) => c.userAgent.test(userAgent))
  if (!crawler) return false
  const parsed = parseIp(ip.trim())
  if (!parsed) return false
  return (await getRanges(crawler.rangesUrl)).some((cidr) => inCidr(parsed, cidr))
}
