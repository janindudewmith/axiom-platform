import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const secretKey = process.env.JWT_SECRET || 'axiom-super-secret-key-for-dev';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

export async function setSession(user: any, sessionToken: string) {
  const sessionData = { 
    user: { 
      id: user.id, 
      name: user.name, 
      role: user.role, 
      email: user.email, 
      gradeLevel: user.gradeLevel, 
      language: user.language,
      sessionToken
    } 
  };
  const encryptedSession = await encrypt(sessionData);
  
  const cookieStore = await cookies();
  cookieStore.set('session', encryptedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  try {
    const decrypted = await decrypt(session);
    if (!decrypted || !decrypted.user || !decrypted.user.id) return null;

    // Enforce single-session logic: check if the sessionToken matches the database
    const dbUser = await prisma.user.findUnique({
      where: { id: decrypted.user.id },
      select: { sessionToken: true }
    });

    // If the token in cookie does not match the token in db, kick the user
    if (!dbUser || dbUser.sessionToken !== decrypted.user.sessionToken) {
      return null;
    }

    return decrypted;
  } catch (error) {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
