import React from 'react';
import prisma from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const resolvedParams = await searchParams;
  const status = resolvedParams?.status;
  
  async function handleRequestReset(formData: FormData) {
    'use server';
    const email = formData.get('email') as string;
    if (!email) return;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // For security, don't reveal if user exists. Just redirect to success.
      const { redirect } = await import('next/navigation');
      redirect('/forgot-password?status=sent');
    }

    // Generate a secure 1-hour token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExp: expires }
    });

    await sendPasswordResetEmail(email, token);
    
    const { redirect } = await import('next/navigation');
    redirect('/forgot-password?status=sent');
  }

  return (
    <div className="container" style={{ padding: '6rem 0', maxWidth: '450px', margin: '0 auto' }}>
      <div className="feature-card" style={{ padding: '3rem 2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Forgot <span className="text-gradient">Password?</span></h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {status === 'sent' ? (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-success)', padding: '1.5rem', borderRadius: 'var(--radius-md)', color: 'var(--color-success)' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>✅ Check your inbox!</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>If an account exists for that email, we've sent instructions to reset your password.</p>
          </div>
        ) : (
          <form action={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem', display: 'block' }}>Email Address</label>
              <input 
                name="email" 
                type="email" 
                required 
                placeholder="you@example.com" 
                style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid var(--color-border)', color: 'white', fontSize: '1rem' }} 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700 }}>
              Send Reset Link
            </button>
            <a href="/login" style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', textDecoration: 'none' }}>
              Back to Login
            </a>
          </form>
        )}
      </div>
    </div>
  );
}
