import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import bcrypt from 'bcrypt';

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) redirect('/login');

  const resolvedSearch = await searchParams;
  const status = resolvedSearch.status;

  async function updateProfile(formData: FormData) {
    'use server';
    const session = await getSession();
    if (!session) return;

    const name = formData.get('name') as string;
    const whatsapp = formData.get('whatsapp') as string;
    const updateData: any = { name, whatsapp };

    // Only update student-specific fields for students
    const gradeLevel = formData.get('gradeLevel');
    const language = formData.get('language');
    if (gradeLevel) updateData.gradeLevel = parseInt(gradeLevel as string);
    if (language) updateData.language = language as string;

    await prisma.user.update({ where: { id: session.user.id }, data: updateData });

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/profile');
    revalidatePath('/dashboard');
    const { redirect } = await import('next/navigation');
    redirect('/profile?status=updated');
  }

  async function changePassword(formData: FormData) {
    'use server';
    const session = await getSession();
    if (!session) return;

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    if (newPassword !== confirmPassword) return;

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return;

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return;

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash: hashedPassword } });

    const { redirect } = await import('next/navigation');
    redirect('/profile?status=password_updated');
  }

  const cardStyle = {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '2.5rem',
  };

  const inputStyle = {
    width: '100%',
    padding: '0.85rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(15,23,42,0.6)',
    border: '1px solid var(--color-border)',
    color: 'white',
    fontSize: '0.95rem',
    marginTop: '0.5rem'
  };

  const labelStyle = {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--color-text-muted)'
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="container" style={{ padding: '4rem 0 6rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Account <span className="text-gradient">Profile</span></h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
          {isAdmin ? 'Administrator account settings' : 'Manage your personal information and account settings'}
        </p>
        {isAdmin && (
          <div style={{ display: 'inline-block', marginTop: '0.75rem', padding: '0.3rem 1rem', backgroundColor: 'rgba(59,130,246,0.1)', border: '1px solid var(--color-primary)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700 }}>
            🔑 Admin Account
          </div>
        )}
      </div>
 
      {/* STUDENT ID CARD */}
      {!isAdmin && (
        <div style={{ ...cardStyle, marginBottom: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.1) 100%)', border: '1px solid var(--color-primary)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Official Student Identity</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', letterSpacing: '0.05em' }}>{user.studentId || 'ID PENDING'}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.75rem', borderRadius: 'var(--radius-full)' }}>{user.name}</span>
            <span style={{ fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.75rem', borderRadius: 'var(--radius-full)' }}>Grade {user.gradeLevel}</span>
          </div>
        </div>
      )}

      {status === 'updated' && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', color: 'var(--color-success)', textAlign: 'center', marginBottom: '2rem' }}>
          ✅ Profile updated successfully!
        </div>
      )}
      {status === 'password_updated' && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', color: 'var(--color-success)', textAlign: 'center', marginBottom: '2rem' }}>
          ✅ Password changed successfully!
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

        {/* Personal Info Form */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem' }}>
            👤 Personal Information
          </h2>
          <form action={updateProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>Full Name</label>
              <input name="name" defaultValue={user.name} required style={inputStyle} />
            </div>
            <div style={{ gridColumn: isAdmin ? 'span 2' : 'span 1' }}>
              <label style={labelStyle}>WhatsApp Number</label>
              <input name="whatsapp" defaultValue={user.whatsapp || ''} placeholder="07XXXXXXXX" style={inputStyle} />
            </div>

            {/* Only show these for students */}
            {!isAdmin && (
              <>
                <div>
                  <label style={labelStyle}>Grade Level</label>
                  <select name="gradeLevel" defaultValue={user.gradeLevel || 10} style={inputStyle}>
                    {[6,7,8,9,10,11].map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Preferred Medium</label>
                  <select name="language" defaultValue={user.language} style={inputStyle}>
                    <option value="Sinhala">Sinhala Medium</option>
                    <option value="English">English Medium</option>
                  </select>
                </div>
              </>
            )}

            <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontWeight: 700 }}>
                Update Profile
              </button>
            </div>
          </form>
        </div>

        {/* Password Change Form */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem' }}>
            🔐 Security
          </h2>
          <form action={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={labelStyle}>Current Password</label>
              <input name="currentPassword" type="password" required placeholder="••••••••" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>New Password</label>
                <input name="newPassword" type="password" required placeholder="••••••••" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Confirm New Password</label>
                <input name="confirmPassword" type="password" required placeholder="••••••••" style={inputStyle} />
              </div>
            </div>
            <button type="submit" className="btn btn-outline" style={{ width: '100%', padding: '1rem', fontWeight: 700 }}>
              Change Password
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
