
import { ImageResponse } from 'next/og';
 
export const runtime = 'edge';
 
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Noble Language Academy';
  const name = searchParams.get('name') || 'Student';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          fontSize: 60,
          color: 'black',
          background: 'white',
          width: '100%',
          height: '100%',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          border: '20px solid #2563eb', // Blue-600 border
        }}
      >
        <div style={{ fontSize: 40, color: '#475569' }}>Certificate of Completion</div>
        <div style={{ fontWeight: 'bold', marginTop: 20 }}>{name}</div>
        <div style={{ fontSize: 30, color: '#2563eb', marginTop: 10 }}>{title}</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
