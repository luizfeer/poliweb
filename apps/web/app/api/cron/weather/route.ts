import { NextResponse } from 'next/server';
import { refreshWeatherForAllCities } from '@/lib/weather';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET is required' }, { status: 500 });
  }
  if (secret) {
    const authorization = request.headers.get('authorization');
    if (authorization !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }
  }

  const result = await refreshWeatherForAllCities();
  return NextResponse.json({
    ok: result.errors.length === 0,
    ...result,
  });
}
