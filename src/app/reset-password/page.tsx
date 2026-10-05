import React from 'react';
import prisma from '@/lib/db';
import { redirect } from 'next/navigation';
import bcrypt from 'bcrypt';

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const resolvedParams = await searchParams;
  const token = resolvedParams.token;

  if (!token) {
    redirect('/login');
  }

  // Verify token
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExp: { gt: new Date() } // Check if not expired
    }
  });

  if (!user) {
    return (
      <div className="container" style={{ padding: '6rem 0', maxWidth: '450px', margin: '0 auto', textAlign: 'center' }}>
        <div className="feature-card" style={{ padding: '3rem 2.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--color-danger)' }}>Invalid Link</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>This password reset link is invalid or has expired. Please request a new one.</p>
          <a href="/forgot-password" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Request New Link →</a>
        </div>
      </div>
    );
  }

  async function handleReset(formData: FormData) {
    'use server';
    const password = formData.get('password') as string;
    const confirm = formData.get('confirmPassword') as string;
    const token = formData.get('token') as string;

    if (password !== confirm) return;

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.updateMany({
      where: { resetToken: token },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExp: null
      }
    });

    const { redirect } = await import('next/navigation');
    redirect('/login?status=password_reset_success');
  }

  return (
    <div className="container" style={{ padding: '6rem 0', maxWidth: '450px', margin: '0 auto' }}>
      <div className="feature-card" style={{ padding: '3rem 2.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Set New <span className="text-gradient">Password</span></h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>Choose a strong password for your Axiom account.</p>

        <form action={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <input type="hidden" name="token" value={token} />
          
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem', display: 'block' }}>New Password</label>
            <input 
              name="password" 
              type="password" 
              required 
              minLength={6}
              placeholder="••••••••" 
              style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid var(--color-border)', color: 'white' }} 
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem', display: 'block' }}>Confirm New Password</label>
            <input 
              name="confirmPassword" 
              type="password" 
              required 
              placeholder="••••••••" 
              style={{ width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(15,23,42,0.6)', border: '1px solid var(--color-border)', color: 'white' }} 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700 }}>
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}
