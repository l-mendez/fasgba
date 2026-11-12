import { ImageResponse } from 'next/og'
import { join } from 'node:path'
import { readFile } from 'node:fs/promises'

import { FEDERATION_FULL_NAME } from '@/lib/seo'

// Default social preview for every page without its own image.
export const alt = FEDERATION_FULL_NAME
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const logoSrc = `data:image/png;base64,${await readFile(join(process.cwd(), 'public/favicon.png'), 'base64')}`
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 56,
          padding: 80,
          background: '#ffffff',
          borderBottom: '24px solid #daa056',
        }}
      >
        <img src={logoSrc} width={300} height={300} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 96, fontWeight: 700, color: '#8f3f12' }}>FASGBA</div>
          <div style={{ fontSize: 44, color: '#3f3f46', lineHeight: 1.2 }}>{FEDERATION_FULL_NAME}</div>
        </div>
      </div>
    ),
    size,
  )
}
