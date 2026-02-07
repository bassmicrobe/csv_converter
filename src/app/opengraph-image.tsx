import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'ezcsv - Free Online CSV Editor'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          backgroundImage: 'linear-gradient(to bottom right, #1c1917, #0c0a09)',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Decorative background elements */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            left: '-150px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0) 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            right: '-150px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0) 70%)',
          }}
        />
        
        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <div
             style={{
               fontSize: 140,
               fontWeight: 'bold',
               background: 'linear-gradient(to bottom right, #f59e0b, #fbbf24)',
               backgroundClip: 'text',
               color: 'transparent',
               letterSpacing: '-0.05em',
               lineHeight: 1,
             }}
          >
            ezcsv
          </div>
        </div>
        
        <div
          style={{
            fontSize: 36,
            color: '#a8a29e', // stone-400
            textAlign: 'center',
            maxWidth: '900px',
            marginBottom: '40px',
          }}
        >
          Secure, Client-side CSV/Excel Editor & Converter
        </div>
        
        {/* Features badges */}
         <div
          style={{
            display: 'flex',
            gap: '24px',
          }}
        >
          {[
            'No Uploads',
            'Secure',
            'PDF/QR Export',
            'Free'
          ].map((text) => (
            <div
              key={text}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 24px',
                borderRadius: '9999px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e7e5e4', // stone-200
                fontSize: 20,
              }}
            >
              {text}
            </div>
          ))}
        </div>

      </div>
    ),
    {
      ...size,
    }
  )
}
