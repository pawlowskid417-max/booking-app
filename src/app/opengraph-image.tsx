import { ImageResponse } from 'next/og';
import { db } from '@/lib/db';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  let salonName = "Salon Paznokci";
  let salonPhone = "";
  try {
    const settings = await db.bookingSettings.findUnique({
      where: { id: "singleton" }
    });
    if (settings) {
      salonName = settings.salonName;
      salonPhone = settings.salonPhone || "";
    }
  } catch (e) {}

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #18181b, #09090b)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 800, marginBottom: 20, textAlign: 'center', background: 'linear-gradient(to right, #ff92ff, #ffffff)', backgroundClip: 'text', color: 'transparent' }}>
          {salonName}
        </div>
        <div style={{ fontSize: 42, color: '#a1a1aa', textAlign: 'center' }}>
          Umów wizytę online
        </div>
        {salonPhone && (
          <div style={{ fontSize: 32, color: '#71717a', marginTop: 40, display: 'flex' }}>
            {`Tel: ${salonPhone}`}
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
