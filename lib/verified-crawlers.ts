// Search and AI crawlers crawl from many countries (Bingbot and ChatGPT-User
// use datacenters in the US, UK, Asia...), so the country allowlist in proxy.ts
// would block them. A request is a verified crawler only when its user agent
// names one AND its IP is inside that crawler's officially published ranges, so
// spoofing the user agent from a blocked country doesn't get through.
const GOOGLE = 'https://developers.google.com/static/search/apis/ipranges'

const CRAWLERS: { userAgent: RegExp; rangesUrl: string }[] = [
  { userAgent: /Googlebot|Google-InspectionTool|GoogleOther|Storebot-Google/i, rangesUrl: `${GOOGLE}/googlebot.json` },
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

type Cidr = { v6: boolean; base: bigint; bits: number }
type PublishedRanges = { prefixes?: { ipv4Prefix?: string; ipv6Prefix?: string }[] }

const rangesCache = new Map<string, { cidrs: Cidr[]; fetchedAt: number }>()

function parseIp(ip: string): { v6: boolean; value: bigint } | null {
  if (ip.includes(':')) {
    const [head, tail = ''] = ip.split('::')
    const left = head ? head.split(':') : []
    const right = ip.includes('::') ? (tail ? tail.split(':') : []) : []
    const groups = ip.includes('::') ? [...left, ...Array(8 - left.length - right.length).fill('0'), ...right] : left
    if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/i.test(g))) return null
    return { v6: true, value: groups.reduce((acc, g) => (acc << BigInt(16)) + BigInt(parseInt(g, 16)), BigInt(0)) }
  }
  const octets = ip.split('.').map(Number)
  if (octets.length !== 4 || octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) return null
  return { v6: false, value: octets.reduce((acc, o) => (acc << BigInt(8)) + BigInt(o), BigInt(0)) }
}

function parseCidr(cidr: string): Cidr | null {
  const [ip, bits] = cidr.split('/')
  const parsed = parseIp(ip)
  return parsed ? { v6: parsed.v6, base: parsed.value, bits: Number(bits) } : null
}

function inCidr(ip: { v6: boolean; value: bigint }, cidr: Cidr): boolean {
  if (ip.v6 !== cidr.v6) return false
  const shift = BigInt((ip.v6 ? 128 : 32) - cidr.bits)
  return ip.value >> shift === cidr.base >> shift
}

async function getRanges(url: string): Promise<Cidr[]> {
  const cached = rangesCache.get(url)
  if (cached && Date.now() - cached.fetchedAt < RANGES_TTL_MS) return cached.cidrs
  try {
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) throw new Error(`${url}: ${response.status}`)
    const data: PublishedRanges = await response.json()
    const cidrs = (data.prefixes ?? [])
      .map((p) => p.ipv4Prefix ?? p.ipv6Prefix)
      .flatMap((c) => (c ? [parseCidr(c)] : []))
      .filter((c): c is Cidr => c !== null)
    rangesCache.set(url, { cidrs, fetchedAt: Date.now() })
    return cidrs
  } catch {
    // Keep the last known ranges; retry on the next TTL window.
    const cidrs = cached?.cidrs ?? []
    rangesCache.set(url, { cidrs, fetchedAt: Date.now() })
    return cidrs
  }
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
