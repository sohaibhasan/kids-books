import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Storybook Studio — Personalized illustrated storybooks for kids'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px 96px',
          background:
            'linear-gradient(135deg, #FBF7F2 0%, #FFE9E5 55%, #FFF3D9 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 9999,
              background: '#E85D4E',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            S
          </div>
          <div style={{ fontSize: 32, color: '#1F1B16', fontWeight: 600 }}>
            Storybook<span style={{ color: '#E85D4E' }}>.</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              fontSize: 88,
              lineHeight: 1.04,
              color: '#1F1B16',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              maxWidth: 920,
            }}
          >
            Personalized storybooks, illustrated just for your child.
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#5C544A',
              lineHeight: 1.3,
              maxWidth: 880,
            }}
          >
            Pick a name, a theme, an art style. We write and illustrate the
            book in minutes.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#9A9088',
            fontSize: 24,
          }}
        >
          <span>storybookstudio.org</span>
          <span>One free story · no signup</span>
        </div>
      </div>
    ),
    { ...size },
  )
}
