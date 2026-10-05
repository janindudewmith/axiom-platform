import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcrypt';
import { setSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { name, email, username, whatsapp, password, gradeLevel, language } = await req.json();
    
    if (!name || !email || !username || !whatsapp || !password || !gradeLevel || !language) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || '' },
          { username: username || '' },
          { whatsapp: whatsapp || '' }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Email, Username, or WhatsApp already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate official Student ID
    const userCount = await prisma.user.count();
    const studentId = `AXM-${1000 + userCount + 1}`;

    // Generate a fresh session token for single active session enforcement
    const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        studentId,
        whatsapp,
        passwordHash,
        gradeLevel: parseInt(gradeLevel),
        language,
        sessionToken
      }
    });

    await setSession(user, sessionToken);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
