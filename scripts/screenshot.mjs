// Full-page headless screenshots of the running dev server, via Chrome DevTools
// Protocol (headless --window-size can't go below 500px, so 390px needs emulation).
// Usage: pnpm shot <path> [--mobile] [--dark] [--all]
//   pnpm shot /clubes --mobile --dark -> .context/shots/clubes-390-dark.png
//   pnpm shot /clubes --all           -> desktop + mobile, light + dark
// Base URL: $SHOT_BASE_URL or http://localhost:${CONDUCTOR_PORT:-3000}. Logged out only.
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const args = process.argv.slice(2)
const path = args.find((a) => !a.startsWith('--')) ?? '/'
const has = (flag) => args.includes(flag)
const widths = has('--all') ? [1400, 390] : [has('--mobile') ? 390 : 1400]
const themes = has('--all') ? ['light', 'dark'] : [has('--dark') ? 'dark' : 'light']
const base = process.env.SHOT_BASE_URL ?? `http://localhost:${process.env.CONDUCTOR_PORT ?? 3000}`
const chromeBin = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const outDir = resolve(import.meta.dirname, '../.context/shots')
const slug = path.replace(/^\//, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/-$/, '') || 'home'

const profile = mkdtempSync(join(tmpdir(), 'shot-'))
const chrome = spawn(chromeBin, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
])

// Chrome prints its DevTools WebSocket URL on stderr once it's ready
const browserWs = await new Promise((ok, fail) => {
  chrome.stderr.on('data', (d) => {
    const m = String(d).match(/ws:\/\/\S+/)
    if (m) ok(m[0])
  })
  chrome.on('exit', () => fail(new Error('Chrome exited before starting')))
})

const ws = new WebSocket(browserWs)
await new Promise((ok) => ws.addEventListener('open', ok))
let nextId = 0
const pending = new Map()
const waiters = []
ws.addEventListener('message', ({ data }) => {
  const msg = JSON.parse(data)
  if (msg.id) pending.get(msg.id)?.(msg)
  else waiters.filter((w) => w.method === msg.method).forEach((w) => w.resolve())
})
const send = (method, params = {}, sessionId) =>
  new Promise((ok, fail) => {
    const id = ++nextId
    pending.set(id, (m) => (m.error ? fail(new Error(`${method}: ${m.error.message}`)) : ok(m.result)))
    ws.send(JSON.stringify({ id, method, params, sessionId }))
  })
const once = (method) => new Promise((resolve) => waiters.push({ method, resolve }))

try {
  mkdirSync(outDir, { recursive: true })
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  const s = (method, params) => send(method, params, sessionId)
  await s('Page.enable')

  for (const width of widths) {
    for (const theme of themes) {
      const mobile = width < 768
      await s('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: mobile ? 2 : 1, mobile })
      await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] })
      const loaded = once('Page.loadEventFired')
      await s('Page.navigate', { url: base + path })
      await loaded
      await new Promise((r) => setTimeout(r, 1500)) // let client data and images settle
      const { data } = await s('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
      const file = join(outDir, `${slug}-${width}-${theme}.png`)
      writeFileSync(file, Buffer.from(data, 'base64'))
      console.log(file)
    }
  }
} finally {
  ws.close()
  const exited = new Promise((r) => chrome.once('exit', r))
  chrome.kill()
  await exited
  rmSync(profile, { recursive: true, force: true, maxRetries: 3 })
}
