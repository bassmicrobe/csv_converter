import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = {
    width: 180,
    height: 180,
}
export const contentType = 'image/png'

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 100,
                    background: '#f59e0b', // amber-500
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '18%', // Standard apple icon rounded corners
                    fontWeight: 800,
                    fontFamily: 'sans-serif',
                    letterSpacing: '-0.05em',
                }}
            >
                ez
            </div>
        ),
        {
            ...size,
        }
    )
}
