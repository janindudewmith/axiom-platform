import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const { classId } = await params;

    const classData = await prisma.class.findUnique({ where: { id: classId } });
    if (!classData) {
      return NextResponse.redirect(new URL('/dashboard?error=notfound', req.url));
    }

    const subscription = await prisma.subscription.findUnique({
      where: {
        userId_classId: {
          userId: session.user.id,
          classId: classId
        }
      }
    });

    if (subscription && subscription.paymentStatus === 'paid' && subscription.validUntil > new Date()) {
      // Securely redirect to Zoom
      return NextResponse.redirect(classData.meetingLink);
    } else {
      // Unauthorized or expired
      return NextResponse.redirect(new URL(`/checkout/${classId}?error=expired`, req.url));
    }
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL('/dashboard?error=server', req.url));
  }
}
