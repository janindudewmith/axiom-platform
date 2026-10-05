import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcrypt';
import { setSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();
    
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
          { whatsapp: identifier }
        ]
      }
    });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate a fresh session token for single active session enforcement
    const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await prisma.user.update({
      where: { id: user.id },
      data: { sessionToken }
    });

    await setSession(user, sessionToken);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}
