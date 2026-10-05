import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import AdminSidebar from '@/components/AdminSidebar';
import AdminCharts from '@/components/AdminCharts';
import { getNextClassDate, formatDuration, formatTime, splitClassTitle } from '@/lib/schedule';
import { getWhatsAppLink, WhatsAppTemplates } from '@/lib/whatsapp';
import { v2 as cloudinary } from 'cloudinary';
import ExportButton from '@/components/ExportButton';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function AdminPortal({ searchParams }: { searchParams: Promise<{ section?: string; q?: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') redirect('/login');

  const resolvedSearch = await searchParams;
  const section = resolvedSearch.section || 'approvals';
  const searchQuery = (resolvedSearch.q || '').toLowerCase();

  // --- DATA FETCHING ---
  const pendingSlips = await prisma.paymentSlip.findMany({
    where: { status: 'pending' },
    include: { user: true, class: true },
    orderBy: { createdAt: 'desc' }
  });

  const activeClasses = await prisma.class.findMany({
    where: { archived: false },
    include: { subscriptions: true, resources: true },
    orderBy: [{ gradeLevel: 'asc' }, { language: 'asc' }]
  });

  const allUsers = await prisma.user.findMany({
    where: { 
      role: 'student',
      OR: searchQuery ? [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
        { studentId: { contains: searchQuery, mode: 'insensitive' } }
      ] : undefined
    },
    include: { 
      subscriptions: { include: { class: true } },
      paymentSlips: { include: { class: true } }
    }
  });

  const recentAnnouncements = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const paidSubscriptions = await prisma.subscription.findMany({
    where: { paymentStatus: 'paid' },
    include: { user: true, class: true },
    orderBy: { createdAt: 'desc' }
  });

  // --- CALCULATE STATS ---
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRevenue = activeClasses.reduce((acc, cls) => {
    const monthSubs = cls.subscriptions.filter(s => s.paymentStatus === 'paid' && s.createdAt >= startOfMonth);
    return acc + (monthSubs.length * 2500);
  }, 0);

  const totalStudents = allUsers.length;
  const pendingCount = pendingSlips.length;
  const classStats = activeClasses.map(c => ({
    title: c.title,
    count: c.subscriptions.filter(s => s.paymentStatus === 'paid').length
  })).sort((a, b) => b.count - a.count);
  const topClass = classStats[0]?.title || 'None';

  // --- ANALYTICS DATA (Last 6 Months) ---
  const revenueHistory = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString('default', { month: 'short' });
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    
    const revenue = activeClasses.reduce((acc, cls) => {
      const monthSubs = cls.subscriptions.filter(s => s.paymentStatus === 'paid' && s.createdAt >= monthStart && s.createdAt <= monthEnd);
      return acc + (monthSubs.length * 2500);
    }, 0);
    
    return { name: monthName, value: revenue };
  }).reverse();

  const growthHistory = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString('default', { month: 'short' });
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    
    const count = allUsers.filter(u => u.createdAt >= monthStart && u.createdAt <= monthEnd).length;
    return { name: monthName, value: count };
  }).reverse();

  // --- ACTIONS ---
  async function createClass(formData: FormData) {
    'use server';
    const session = await getSession();
    if (!session || session.user.role !== 'admin') return;

    await prisma.class.create({
      data: {
        title: formData.get('title') as string,
        description: (formData.get('description') as string) || 'Live Interactive Mathematics Session',
        gradeLevel: parseInt(formData.get('gradeLevel') as string),
        language: formData.get('language') as string,
        dayOfWeek: formData.get('dayOfWeek') as string,
        startTime: formData.get('startTime') as string,
        duration: parseFloat(formData.get('duration') as string),
        meetingLink: (formData.get('meetingLink') as string) || 'https://youtube.com/live/placeholder',
        scheduleTime: new Date()
      }
    });
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin');
    revalidatePath('/classes');
    revalidatePath('/dashboard');
  }

  async function postAnnouncement(formData: FormData) {
    'use server';
    const session = await getSession();
    if (!session || session.user.role !== 'admin') return;

    await prisma.announcement.create({
      data: {
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        target: formData.get('target') as string,
        isUrgent: formData.get('isUrgent') === 'on',
        active: true
      }
    });
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin');
    revalidatePath('/dashboard');
  }

  async function addResource(formData: FormData) {
    'use server';
    const session = await getSession();
    if (!session || session.user.role !== 'admin') return;

    const classId = formData.get('classId') as string;
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    let url = formData.get('url') as string;

    if (type === 'pdf') {
      const file = formData.get('file') as File;
      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ resource_type: 'raw', folder: 'axiom/materials' }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }).end(buffer);
        });
        url = (uploadResult as any).secure_url;
      }
    }

    await prisma.classResource.create({
      data: { classId, title, type, url }
    });

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin');
    revalidatePath('/dashboard');
    revalidatePath(`/classes/${classId}`);
  }

  async function deleteResource(formData: FormData) {
    'use server';
    const session = await getSession();
    if (!session || session.user.role !== 'admin') return;
    const id = formData.get('id') as string;
    await prisma.classResource.delete({ where: { id } });
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin');
    revalidatePath('/dashboard');
  }

  async function deleteAnnouncement(formData: FormData) {
    'use server';
    const session = await getSession();
    if (!session || session.user.role !== 'admin') return;
    const id = formData.get('id') as string;
    await prisma.announcement.delete({ where: { id } });
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin');
    revalidatePath('/dashboard');
  }

  async function approveSlip(formData: FormData) {
    'use server';
    const session = await getSession();
    if (!session || session.user.role !== 'admin') return;
    const slipId = formData.get('slipId') as string;
    const slip = await prisma.paymentSlip.findUnique({ 
      where: { id: slipId },
      include: { user: true, class: true }
    });
    if (!slip) return;
    await prisma.paymentSlip.update({ where: { id: slipId }, data: { status: 'approved' } });
    
    const existingSub = await prisma.subscription.findUnique({
      where: { userId_classId: { userId: slip.userId, classId: slip.classId } }
    });

    let newValidUntil = new Date();
    if (existingSub && existingSub.validUntil > new Date()) {
      newValidUntil = new Date(existingSub.validUntil);
    }
    newValidUntil.setDate(newValidUntil.getDate() + 28);

    // Call our Microsoft Teams API registration helper (Simulation-enabled)
    const { registerStudentToTeamsWebinar } = await import('@/lib/teams');
    const uniqueMeetingLink = await registerStudentToTeamsWebinar(
      slip.class.meetingLink,
      slip.user.name,
      slip.user.email,
      slip.user.studentId || 'NoID'
    );

    await prisma.subscription.upsert({
      where: { userId_classId: { userId: slip.userId, classId: slip.classId } },
      update: { paymentStatus: 'paid', validUntil: newValidUntil, meetingLink: uniqueMeetingLink },
      create: { userId: slip.userId, classId: slip.classId, paymentStatus: 'paid', validUntil: newValidUntil, meetingLink: uniqueMeetingLink }
    });
    
    const { sendPaymentApprovedEmail } = await import('@/lib/email');
    await sendPaymentApprovedEmail(slip.user.email, slip.user.name, slip.class.title, uniqueMeetingLink);

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin');
  }

  async function rejectSlip(formData: FormData) {
    'use server';
    const session = await getSession();
    if (!session || session.user.role !== 'admin') return;
    const slipId = formData.get('slipId') as string;
    const slip = await prisma.paymentSlip.findUnique({ 
      where: { id: slipId },
      include: { user: true, class: true }
    });
    if (!slip) return;
    
    await prisma.paymentSlip.update({ where: { id: slipId }, data: { status: 'rejected' } });
    const { sendPaymentRejectedEmail } = await import('@/lib/email');
    await sendPaymentRejectedEmail(slip.user.email, slip.user.name, slip.class.title, slip.classId);

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin');
  }

  async function updateMeetingLink(formData: FormData) {
    'use server';
    const session = await getSession();
    if (!session || session.user.role !== 'admin') return;
    const classId = formData.get('classId') as string;
    const link = formData.get('meetingLink') as string;
    await prisma.class.update({ where: { id: classId }, data: { meetingLink: link } });
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin');
    revalidatePath('/dashboard');
  }

  async function updateClassDetails(formData: FormData) {
    'use server';
    const session = await getSession();
    if (!session || session.user.role !== 'admin') return;

    const classId = formData.get('classId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const gradeLevel = parseInt(formData.get('gradeLevel') as string);
    const language = formData.get('language') as string;
    const dayOfWeek = formData.get('dayOfWeek') as string;
    const startTime = formData.get('startTime') as string;
    const duration = parseFloat(formData.get('duration') as string);
    const meetingLink = formData.get('meetingLink') as string;

    await prisma.class.update({
      where: { id: classId },
      data: { title, description, gradeLevel, language, dayOfWeek, startTime, duration, meetingLink }
    });

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin');
    revalidatePath('/classes');
    revalidatePath('/dashboard');
  }

  async function archiveClass(formData: FormData) {
    'use server';
    const session = await getSession();
    if (!session || session.user.role !== 'admin') return;
    const classId = formData.get('classId') as string;
    await prisma.class.update({ where: { id: classId }, data: { archived: true } });
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin');
  }

  async function seedStandardClasses() {
    'use server';
    const session = await getSession();
    if (!session || session.user.role !== 'admin') return;

    const schedule = [
      { g: 6, day: 'Monday', s: '16:00', d: 2.0 },
      { g: 7, day: 'Tuesday', s: '16:00', d: 2.0 },
      { g: 8, day: 'Wednesday', s: '16:00', d: 2.0 },
      { g: 9, day: 'Thursday', s: '15:30', d: 2.5 },
      { g: 10, day: 'Friday', s: '15:30', d: 2.5 },
      { g: 11, day: 'Saturday', s: '09:00', d: 2.5 },
    ];

    for (const item of schedule) {
      await prisma.class.create({
        data: {
          title: `Grade ${item.g} Mathematics - Sinhala Medium`,
          gradeLevel: item.g, language: 'Sinhala',
          dayOfWeek: item.day, startTime: item.s, duration: item.d,
          meetingLink: 'https://youtube.com/live/placeholder', scheduleTime: new Date()
        }
      });
      await prisma.class.create({
        data: {
          title: `Grade ${item.g} Mathematics - English Medium`,
          gradeLevel: item.g, language: 'English',
          dayOfWeek: item.day,
          startTime: item.g <= 8 ? '18:00' : (item.g === 11 ? '13:00' : '18:00'),
          duration: item.d,
          meetingLink: 'https://youtube.com/live/placeholder', scheduleTime: new Date()
        }
      });
    }

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin');
    revalidatePath('/classes');
    revalidatePath('/dashboard');
  }

  const sidebarItems = [
    { key: 'approvals', label: 'Payment Slips', icon: '💸', badge: pendingSlips.length },
    { key: 'classes', label: 'Class Manager', icon: '📚' },
    { key: 'materials', label: 'Study Materials', icon: '📄' },
    { key: 'students', label: 'Students', icon: '👥', badge: allUsers.length },
    { key: 'announcements', label: 'Announcements', icon: '📢', badge: recentAnnouncements.length },
  ];

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '2rem',
    overflow: 'hidden'
  };

  const statCardStyle: React.CSSProperties = {
    ...cardStyle,
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  };

  const inputStyle = {
    border: '1px solid var(--color-border)',
    padding: '0.75rem',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'rgba(15,23,42,0.6)',
    color: 'var(--color-text)',
    width: '100%',
    fontSize: '1rem',
    fontFamily: 'inherit'
  };

  return (
    <div className="container" style={{ padding: '2rem 0 4rem' }}>
      
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '2rem', fontWeight: 800 }}>Admin <span className="text-gradient">Portal</span></h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Management Dashboard for Axiom Institute</p>
      </div>

      {/* STATS OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={statCardStyle}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Monthly Revenue</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Rs. {monthlyRevenue.toLocaleString()}</h2>
        </div>
        <div style={statCardStyle}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-secondary)', textTransform: 'uppercase' }}>Pending Slips</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{pendingCount}</h2>
        </div>
        <div style={statCardStyle}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase' }}>Active Students</span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{totalStudents}</h2>
        </div>
        <div style={statCardStyle}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Top Class</span>
          <div style={{ marginTop: '0.5rem', lineHeight: 1.3 }}>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>{splitClassTitle(topClass).main}</div>
            <div className="text-gradient" style={{ fontSize: '0.8rem', fontWeight: 600 }}>{splitClassTitle(topClass).sub}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <React.Suspense fallback={<div style={{ width: '260px' }}>Loading...</div>}>
          <AdminSidebar items={sidebarItems} />
        </React.Suspense>

        <div style={{ flex: 1, minWidth: 0 }}>
          
          {/* SLIP APPROVALS */}
          {section === 'approvals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* --- ANALYTICS ROW --- */}
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <AdminCharts data={revenueHistory} title="REVENUE GROWTH (LKR)" color="#3b82f6" prefix="Rs. " />
                <AdminCharts data={growthHistory} title="ENROLLMENT GROWTH" color="#8b5cf6" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-muted)', margin: 0 }}>Pending Verifications</h2>
                <ExportButton 
                  data={paidSubscriptions} 
                  filename="revenue" 
                  label="📥 Export Revenue CSV" 
                  type="revenue" 
                />
              </div>
              <div style={cardStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                      {['Student', 'Class', 'Slip', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSlips.map(slip => {
                      const approveLink = slip.user.whatsapp ? getWhatsAppLink(slip.user.whatsapp, WhatsAppTemplates.slipApprovedStudent(slip.user.name, slip.class.title)) : null;
                      const rejectLink = slip.user.whatsapp ? getWhatsAppLink(slip.user.whatsapp, WhatsAppTemplates.slipRejectedStudent(slip.user.name, slip.class.title)) : null;

                      return (
                        <tr key={slip.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <div style={{ fontWeight: 600 }}>{slip.user.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>{slip.user.studentId || 'No ID'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{slip.user.email}</div>
                            {slip.user.whatsapp && (
                              <a href={`https://wa.me/${slip.user.whatsapp.replace(/\D/g, '')}`} target="_blank" style={{ fontSize: '0.7rem', color: '#25D366', fontWeight: 600, display: 'block', marginTop: '0.2rem' }}>
                                {slip.user.whatsapp}
                              </a>
                            )}
                          </td>
                          <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', lineHeight: 1.3 }}>
                            <div style={{ color: 'white', fontWeight: 600 }}>{splitClassTitle(slip.class.title).main}</div>
                            <div className="text-gradient" style={{ fontSize: '0.75rem' }}>{splitClassTitle(slip.class.title).sub}</div>
                          </td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <a href={slip.fileUrl || '#'} target="_blank" style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>View ↗</a>
                          </td>
                          <td style={{ padding: '1rem 0.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <form action={approveSlip} style={{ flex: 1 }}><input type="hidden" name="slipId" value={slip.id} /><button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', width: '100%' }}>Approve</button></form>
                                <form action={rejectSlip} style={{ flex: 1 }}>
                                  <input type="hidden" name="slipId" value={slip.id} />
                                  <button type="submit" className="btn" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', width: '100%', backgroundColor: 'var(--color-danger)', color: 'white', fontWeight: 700, border: 'none' }}>Reject</button>
                                </form>
                              </div>
                              {slip.user.whatsapp && (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <a href={approveLink!} target="_blank" className="btn btn-outline" style={{ flex: 1, padding: '0.3rem', fontSize: '0.65rem', borderColor: '#25D366', color: '#25D366', textAlign: 'center' }}>Notify Appr.</a>
                                  <a href={rejectLink!} target="_blank" className="btn btn-outline" style={{ flex: 1, padding: '0.3rem', fontSize: '0.65rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)', textAlign: 'center' }}>Notify Rej.</a>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {pendingSlips.length === 0 && (
                      <tr><td colSpan={4} style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>No pending slips.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CLASS MANAGER */}
          {section === 'classes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={cardStyle}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Create Module</h2>
                <form action={createClass} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ gridColumn: 'span 2' }}><input name="title" placeholder="Class Title" required style={inputStyle} /></div>
                  <div style={{ gridColumn: 'span 2' }}><input name="description" placeholder="Description (Optional)" style={inputStyle} /></div>
                  <input name="gradeLevel" type="number" placeholder="Grade" required style={inputStyle} />
                  <select name="language" style={inputStyle}><option value="Sinhala">Sinhala</option><option value="English">English</option></select>
                  <select name="dayOfWeek" style={inputStyle}>{['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d=><option key={d} value={d}>{d}</option>)}</select>
                  <input name="startTime" type="time" required style={inputStyle} />
                  <input name="duration" type="number" step="0.5" placeholder="Hours" required style={inputStyle} />
                  <input name="meetingLink" placeholder="Meeting Link (Zoom/Teams/YouTube) (Optional)" style={inputStyle} />
                  <div style={{ gridColumn: 'span 2' }}><button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Class</button></div>
                </form>
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                  <form action={seedStandardClasses}>
                    <button type="submit" className="btn btn-outline" style={{ width: '100%', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>⚡ Seed Standard 12 Classes</button>
                  </form>
                </div>
              </div>
              <div style={cardStyle}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Active Classes</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>CLASS MANAGEMENT & SETTINGS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeClasses.map(cls => {
                      const { main, sub } = splitClassTitle(cls.title);
                      return (
                        <tr key={cls.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td colSpan={3} style={{ padding: '1rem 0' }}>
                            <details style={{ width: '100%' }}>
                              <summary style={{ cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ textAlign: 'left' }}>
                                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{main}</span>
                                  {sub && <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }} className="text-gradient">{sub}</span>}
                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '1rem' }}>Grade {cls.gradeLevel} · {cls.dayOfWeek} · {cls.startTime}</span>
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)' }}>Click to Edit Details ▼</span>
                              </summary>
                              
                              <div style={{ padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', marginTop: '0.5rem' }}>
                                <form action={updateClassDetails} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                  <input type="hidden" name="classId" value={cls.id} />
                                  <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Class Title</label>
                                    <input name="title" defaultValue={cls.title} style={inputStyle} />
                                  </div>
                                  <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Description</label>
                                    <textarea name="description" defaultValue={cls.description || ''} style={{ ...inputStyle, resize: 'none' }} rows={2}></textarea>
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Grade</label>
                                    <input name="gradeLevel" type="number" defaultValue={cls.gradeLevel} style={inputStyle} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Medium</label>
                                    <select name="language" defaultValue={cls.language} style={inputStyle}>
                                      <option value="Sinhala">Sinhala</option>
                                      <option value="English">English</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Day</label>
                                    <select name="dayOfWeek" defaultValue={cls.dayOfWeek || ''} style={inputStyle}>
                                      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d=><option key={d} value={d}>{d}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Start Time</label>
                                    <input name="startTime" type="time" defaultValue={cls.startTime || ''} style={inputStyle} />
                                  </div>
                                  <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Live Meeting Link (Zoom/Teams)</label>
                                    <input name="meetingLink" defaultValue={cls.meetingLink} style={inputStyle} />
                                  </div>
                                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                                  </div>
                                </form>
                                <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '1.5rem', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                   <form action={archiveClass}><input type="hidden" name="classId" value={cls.id} /><button type="submit" className="btn btn-outline" style={{ fontSize: '0.7rem', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>Archive Class</button></form>
                                </div>
                              </div>
                            </details>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MATERIALS MANAGER */}
          {section === 'materials' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={cardStyle}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Upload Study Materials</h2>
                <form action={addResource} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <select name="classId" required style={inputStyle}>
                    <option value="">Select Class...</option>
                    {activeClasses.map(cls => <option key={cls.id} value={cls.id}>{cls.title}</option>)}
                  </select>
                  <input name="title" placeholder="Material Title (e.g. Unit 5 PDF)" required style={inputStyle} />
                  <select name="type" required style={inputStyle}>
                    <option value="video">Video Replay (YouTube Link)</option>
                    <option value="pdf">Study Pack (PDF Upload)</option>
                  </select>
                  <div style={{ border: '1px dashed var(--color-border)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>For Videos: Paste URL below. For PDFs: Select file below.</p>
                    <input name="url" placeholder="YouTube URL (if video)" style={inputStyle} />
                    <input name="file" type="file" accept=".pdf" style={{ ...inputStyle, marginTop: '0.5rem' }} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '1rem' }}>Add Material</button>
                </form>
              </div>

              <div style={cardStyle}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Existing Materials</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {activeClasses.flatMap(c => c.resources.map(r => ({ ...r, classTitle: c.title }))).map(res => (
                    <div key={res.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase' }}>{res.type}</span>
                        <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>{res.title}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Class: {res.classTitle}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <a href={res.url} target="_blank" style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>View ↗</a>
                        <form action={deleteResource}>
                          <input type="hidden" name="id" value={res.id} />
                          <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '0.75rem', cursor: 'pointer' }}>Delete</button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ANNOUNCEMENTS */}
          {section === 'announcements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={cardStyle}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Post New Notice</h2>
                <form action={postAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input name="title" placeholder="Notice Title" required style={inputStyle} />
                  <textarea name="content" placeholder="Write your announcement here..." rows={4} required style={{ ...inputStyle, resize: 'none' }}></textarea>
                  <select name="target" style={inputStyle}>
                    <option value="all">Target: All Students</option>
                    {[6,7,8,9,10,11].map(g => <option key={g} value={`Grade ${g}`}>Target: Grade {g} Only</option>)}
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input type="checkbox" name="isUrgent" style={{ width: '1.25rem', height: '1.25rem' }} />
                    <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>⚠️ Mark as Urgent Broadcast</span>
                  </label>
                  <button type="submit" className="btn btn-primary">Post Announcement</button>
                </form>
              </div>

              <div style={cardStyle}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Recent History</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {recentAnnouncements.map(ann => (
                    <div key={ann.id} style={{ padding: '1.25rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontWeight: 700 }}>{ann.title}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Target: {ann.target}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>{ann.content}</p>
                      <form action={deleteAnnouncement}>
                        <input type="hidden" name="id" value={ann.id} />
                        <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--color-danger)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>Delete Permanentely</button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STUDENTS LIST */}
          {section === 'students' && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Registered Students</h2>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, justifyContent: 'flex-end', minWidth: '300px' }}>
                  <form method="GET" style={{ display: 'flex', flex: 1, maxWidth: '400px' }}>
                    <input type="hidden" name="section" value="students" />
                    <input 
                      name="q" 
                      placeholder="Search name, email or ID..." 
                      defaultValue={searchQuery}
                      style={{ ...inputStyle, margin: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }} 
                    />
                    <button type="submit" className="btn btn-primary" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '0 1.25rem', display: 'flex', alignItems: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </button>
                  </form>
                  <ExportButton 
                    data={allUsers} 
                    filename="students" 
                    label="📥 Export" 
                    type="students" 
                  />
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem' }}>Name</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem' }}>Student ID</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem' }}>Email</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem' }}>Grade</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem' }}>WhatsApp</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td colSpan={6} style={{ padding: 0 }}>
                        <details style={{ width: '100%' }}>
                          <summary style={{ listStyle: 'none', cursor: 'pointer', padding: '1rem 0.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) 100px', alignItems: 'center' }}>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{u.name}</div>
                              <div style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 700 }}>{u.studentId || '-'}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{u.email}</div>
                              <div style={{ fontSize: '0.9rem' }}>G{u.gradeLevel} · {u.language}</div>
                              <div style={{ fontSize: '0.9rem' }}>{u.whatsapp || '-'}</div>
                              <div style={{ textAlign: 'right', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary)' }}>DETAILS ▾</div>
                            </div>
                          </summary>
                          <div style={{ padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)', borderTop: '1px dashed var(--color-border)', cursor: 'default' }}>
                            <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                              <div style={{ flex: '1 1 300px' }}>
                                <h4 style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>Active Enrollments</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                  {u.subscriptions.length > 0 ? u.subscriptions.map(s => (
                                    <div key={s.id} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                      ✅ {s.class.title} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}> (Exp: {new Date(s.validUntil).toLocaleDateString()})</span>
                                    </div>
                                  )) : <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No active classes.</p>}
                                </div>
                              </div>
                              <div style={{ flex: '1 1 250px' }}>
                                <h4 style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>Recent Payments</h4>
                                {u.paymentSlips.length > 0 ? u.paymentSlips.slice(0, 3).map(p => (
                                  <div key={p.id} style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ color: 'var(--color-text-muted)' }}>{p.class.title.split(' - ')[0]}</span>
                                    <span style={{ color: p.status === 'approved' ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700 }}>{p.status.toUpperCase()}</span>
                                  </div>
                                )) : <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No history.</p>}
                                <div style={{ marginTop: '1rem', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                              </div>
                              <div style={{ flex: '0 0 200px', borderLeft: '1px solid var(--color-border)', paddingLeft: '2rem' }}>
                                 <h4 style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Contact Student</h4>
                                 <a href={getWhatsAppLink(u.whatsapp || '', WhatsAppTemplates.support(u.name))} target="_blank" style={{ display: 'block', backgroundColor: '#25D366', color: 'white', padding: '0.6rem', borderRadius: '4px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, textDecoration: 'none' }}>WhatsApp Chat 💬</a>
                              </div>
                            </div>
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
