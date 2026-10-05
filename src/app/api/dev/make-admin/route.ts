import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession, setSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'You must be logged in first to use this shortcut.' }, { status: 401 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'admin' }
    });

    await setSession(updatedUser, updatedUser.sessionToken || '');

    return NextResponse.redirect(new URL('/admin', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to upgrade role' }, { status: 500 });
  }
}
