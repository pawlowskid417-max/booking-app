import { ImageResponse } from 'next/og';
import { db } from '@/lib/db';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default async function Icon() {
  let initial = "S";
  try {
    const settings = await db.bookingSettings.findUnique({
      where: { id: "singleton" }
    });
    if (settings && settings.salonName) {
      initial = settings.salonName.charAt(0).toUpperCase();
    }
  } catch (e) {
    // fallback
  }

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#ff92ff',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '20%',
        }}
      >
        {initial}
      </div>
    ),
    { ...size }
  );
}
