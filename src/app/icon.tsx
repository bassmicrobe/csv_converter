import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = {
    width: 32,
    height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 18,
                    background: '#f59e0b', // amber-500
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '20%', // Slightly rounded square
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
