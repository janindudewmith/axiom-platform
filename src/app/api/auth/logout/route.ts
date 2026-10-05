import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

export async function POST(req: Request) {
  await clearSession();
  const origin = new URL(req.url).origin;
  return NextResponse.redirect(`${origin}/`, { status: 302 });
}
