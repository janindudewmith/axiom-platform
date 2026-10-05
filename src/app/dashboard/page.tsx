import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import DashboardSidebar from '@/components/DashboardSidebar';
import { getNextClassDate, formatDuration, formatTime, splitClassTitle } from '@/lib/schedule';
import Avatar from '@/components/Avatar';

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ status?: string; section?: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const resolvedSearch = await searchParams;
  const status = resolvedSearch.status;
  const section = resolvedSearch.section || 'classes';

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscriptions: { include: { class: true }, orderBy: { createdAt: 'desc' } },
      paymentSlips: { include: { class: true }, orderBy: { createdAt: 'desc' } }
    }
  });

  if (!user) redirect('/login');
  if (user.role === 'admin') redirect('/admin');

  const activeSubscriptions = user.subscriptions.filter(s => s.paymentStatus === 'paid' && s.validUntil > new Date());
  const subscribedClasses = activeSubscriptions.map(s => s.class).filter(c => !c.archived);
  const subscribedClassIds = subscribedClasses.map(c => c.id);
  
  const pendingSlips = user.paymentSlips.filter(p => p.status === 'pending');
  const pendingClasses = pendingSlips.map(p => p.class).filter(c => !c.archived);
  const pendingClassIds = pendingClasses.map(c => c.id);

  const availableClasses = await prisma.class.findMany({
    where: { gradeLevel: user.gradeLevel || 10, language: user.language || 'English', archived: false }
  });

  // Combine classes to show: Subscribed first, then Pending, then Available
  const dashboardClasses = [...subscribedClasses];
  
  // Add pending classes if not already in subscribed
  for (const pCls of pendingClasses) {
    if (!subscribedClassIds.includes(pCls.id)) {
      dashboardClasses.push(pCls);
    }
  }

  // Add suggested classes from profile if not already shown
  for (const cls of availableClasses) {
    if (!subscribedClassIds.includes(cls.id) && !pendingClassIds.includes(cls.id)) {
      dashboardClasses.push(cls);
    }
  }

  const announcements = await prisma.announcement.findMany({
    where: {
      active: true,
      OR: [{ target: 'all' }, { target: `Grade ${user.gradeLevel}` }]
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  const classResources = subscribedClassIds.length > 0 ? await prisma.classResource.findMany({
    where: { classId: { in: subscribedClassIds } },
    include: { class: true },
    orderBy: { createdAt: 'desc' }
  }) : [];

  const videoResources = classResources.filter(r => r.type === 'video');
  const pdfResources = classResources.filter(r => r.type === 'pdf');

  const userProgress = await prisma.userResourceProgress.findMany({
    where: { userId: user.id }
  });
  const completedResourceIds = userProgress.map(p => p.resourceId);

  async function toggleProgress(formData: FormData) {
    'use server';
    const session = await getSession();
    if (!session) return;
    const resourceId = formData.get('resourceId') as string;
    const userId = session.user.id;

    const existing = await prisma.userResourceProgress.findUnique({
      where: { userId_resourceId: { userId, resourceId } }
    });

    if (existing) {
      await prisma.userResourceProgress.delete({
        where: { id: existing.id }
      });
    } else {
      await prisma.userResourceProgress.create({
        data: { userId, resourceId }
      });
    }
    const { revalidatePath } = await import('next/cache');
    revalidatePath('/dashboard');
  }

  const sidebarItems = [
    { key: 'classes', label: 'My Classes', icon: '📚' },
    { key: 'videos', label: 'Video Replays', icon: '🎬', badge: videoResources.length },
    { key: 'materials', label: 'Study Packs', icon: '📄', badge: pdfResources.length },
    { key: 'announcements', label: 'Notices', icon: '🔔', badge: announcements.length },
    { key: 'payments', label: 'Payment History', icon: '💳' },
  ];

  const cardStyle = {
    backgroundColor: 'var(--color-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
  };

  return (
    <div className="container" style={{ padding: '2rem 0 4rem' }}>
      
      {/* ── HEADER ── */}
      <div style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <Avatar name={user.name} size={60} fontSize="1.5rem" />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '2rem', fontWeight: 800 }}>
            Student <span className="text-gradient">Dashboard</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Welcome back, <strong style={{ color: 'white' }}>{user.name}</strong>. Grade {user.gradeLevel} · {user.language} Medium · <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{user.studentId || 'ID Pending'}</span>
          </p>
        </div>
      </div>

      {/* ── URGENT BROADCASTS ── */}
      {announcements.filter(a => a.isUrgent).map(ann => (
        <div key={ann.id} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontWeight: 600, display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <span style={{ color: 'white' }}>{ann.title}</span>
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>{ann.content}</p>
          </div>
        </div>
      ))}

      {/* ── SUBSCRIPTION EXPIRY ALERTS ── */}
      {user.subscriptions.filter(s => s.paymentStatus === 'paid').map(sub => {
        const daysLeft = Math.ceil((new Date(sub.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 7) return null; // Only show if less than 7 days left
        
        return (
          <div key={sub.id} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: daysLeft <= 3 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.05)', border: `1px solid ${daysLeft <= 3 ? 'var(--color-secondary)' : 'var(--color-success)'}`, borderRadius: 'var(--radius-md)', color: daysLeft <= 3 ? 'var(--color-secondary)' : 'var(--color-success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem' }}>{daysLeft <= 3 ? '⏳' : '✅'}</span>
              <span style={{ fontSize: '0.9rem' }}>
                Your access to <strong style={{ color: 'white' }}>{sub.class.title}</strong> {daysLeft <= 0 ? 'has expired' : `expires in ${daysLeft} days`}.
              </span>
            </div>
            {daysLeft <= 3 && (
              <a href={`/checkout/${sub.classId}`} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Renew Now</a>
            )}
          </div>
        );
      })}

      {status === 'slip_uploaded' && (
        <div style={{ ...cardStyle, marginBottom: '2rem', borderColor: 'var(--color-success)', background: 'rgba(16, 185, 129, 0.05)', textAlign: 'center', padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--color-success)', marginBottom: '0.5rem' }}>✅ Slip Uploaded Successfully!</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>Our team is reviewing your payment. Notify us on WhatsApp to speed it up.</p>
          <a href={`https://wa.me/94702446778?text=${encodeURIComponent(`Hi Axiom, I am ${user.name} and I just uploaded my payment slip. Please check!`)}`} target="_blank" className="btn btn-primary" style={{ backgroundColor: '#25D366' }}>
            Notify via WhatsApp
          </a>
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <DashboardSidebar
          items={sidebarItems}
          title="Student Portal"
          subtitle={`Grade ${user.gradeLevel} · ${user.language}`}
        />

        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── MY CLASSES ── */}
          {section === 'classes' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
                Your Grade {user.gradeLevel} Curriculum
              </h2>
              <div className="feature-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {dashboardClasses.map(cls => {
                  const sub = activeSubscriptions.find(s => s.classId === cls.id);
                  const isActive = !!sub;
                  const expiresInDays = sub ? Math.ceil((new Date(sub.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                  
                  const nextDate = getNextClassDate(cls.dayOfWeek, cls.startTime) || new Date(cls.scheduleTime);
                  const isLive = nextDate && Math.abs(new Date().getTime() - nextDate.getTime()) < (cls.duration || 2) * 60 * 60 * 1000;
                  const timeStr = formatTime(cls.startTime);

                  const { main, sub: medium } = splitClassTitle(cls.title);
                  return (
                    <div key={cls.id} className="feature-card animate-fade-in" style={{ padding: '0', border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-border)' }}>
                      <div style={{ height: '140px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                         <span style={{ fontSize: '3.5rem', opacity: 0.1 }}>{cls.gradeLevel}</span>
                         {isLive && isActive && (
                          <div style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.4rem 0.75rem', border: '1px solid #10b981', borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16,185,129,0.1)', animation: 'pulse 2s infinite' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                            <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.7rem' }}>LIVE NOW</span>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '1.75rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', lineHeight: 1.3 }}>
                          <span style={{ color: 'white' }}>{main}</span>
                          {medium && <span style={{ display: 'block', fontSize: '0.8rem', marginTop: '0.2rem' }} className="text-gradient">{medium}</span>}
                        </h3>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                          {cls.dayOfWeek ? (
                            <>
                              <p style={{ color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 600 }}>
                                🗓 Every {cls.dayOfWeek}
                              </p>
                              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                                🕒 {timeStr} ({formatDuration(cls.duration)})
                              </p>
                            </>
                          ) : (
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                              ⏱ Next: {new Date(cls.scheduleTime).toLocaleString()}
                            </p>
                          )}
                        </div>
                        
                        {expiresInDays !== null && expiresInDays <= 3 && (
                          <div style={{ marginBottom: '1.25rem', padding: '0.5rem', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--color-danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>⚠️ Expires in {expiresInDays} day{expiresInDays !== 1 ? 's' : ''}</span>
                            <a href={`/checkout/${cls.id}`} style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Renew</a>
                          </div>
                        )}

                        <div style={{ paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                          {isActive ? (
                             <a href={(sub.meetingLink || cls.meetingLink).startsWith('http') ? (sub.meetingLink || cls.meetingLink) : `https://${sub.meetingLink || cls.meetingLink}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ width: '100%', backgroundColor: isLive ? '#10b981' : undefined }}>
                                {isLive ? '▶ Join Live Session' : '🔗 Class Session Link'}
                             </a>
                          ) : pendingClassIds.includes(cls.id) ? (
                            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid var(--color-secondary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                              <p style={{ color: 'var(--color-secondary)', fontSize: '0.85rem', fontWeight: 700 }}>⏳ Verification Pending</p>
                            </div>
                          ) : (
                            <a href={`/checkout/${cls.id}`} className="btn btn-outline" style={{ width: '100%' }}>
                              Enroll Now
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── VIDEO REPLAYS ── */}
          {section === 'videos' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
                {videoResources.length} video replay{videoResources.length !== 1 ? 's' : ''} available
              </h2>
              {videoResources.length > 0 ? (
                <div className="feature-grid">
                  {videoResources.map(resource => {
                    const isYoutube = resource.url.includes('youtube.com') || resource.url.includes('youtu.be');
                    const videoId = isYoutube ? (resource.url.split('v=')[1]?.split('&')[0] || resource.url.split('/').pop()) : null;
                    const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
                    return (
                      <a key={resource.id} href={resource.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <div className="feature-card" style={{ padding: '0', overflow: 'hidden', cursor: 'pointer' }}>
                          <div style={{ position: 'relative', height: '165px', background: thumbUrl ? `url(${thumbUrl}) center/cover` : 'linear-gradient(135deg,#1e293b,#0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.4)' }}>
                              <span style={{ color: '#0f172a', fontSize: '1.2rem', marginLeft: '3px' }}>▶</span>
                            </div>
                            <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                              {splitClassTitle(resource.class.title).main}
                            </div>
                          </div>
                          <div style={{ padding: '1.25rem' }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)' }}>{resource.title}</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Recorded Session</p>
                              <form action={toggleProgress}>
                                <input type="hidden" name="resourceId" value={resource.id} />
                                <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.75rem', fontWeight: 600, color: completedResourceIds.includes(resource.id) ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                                  {completedResourceIds.includes(resource.id) ? '✅ Done' : '⭕ Mark Done'}
                                </button>
                              </form>
                            </div>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div style={{ ...cardStyle, textAlign: 'center', padding: '4rem' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🎬</span>
                  <p style={{ color: 'var(--color-text-muted)' }}>No video replays uploaded for your classes yet.</p>
                </div>
              )}
            </div>
          )}

          {/* ── STUDY PACKS ── */}
          {section === 'materials' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
                {pdfResources.length} study pack{pdfResources.length !== 1 ? 's' : ''} available
              </h2>
              {pdfResources.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  {pdfResources.map(resource => {
                    const { main, sub } = splitClassTitle(resource.class.title);
                    return (
                      <div key={resource.id} style={{ ...cardStyle, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: '45px', height: '45px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📄</div>
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>{resource.title}</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              <span style={{ color: 'var(--color-text-muted)' }}>{main}</span>
                              {sub && <span className="text-gradient" style={{ fontWeight: 600, marginLeft: '0.4rem' }}>{sub}</span>}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <form action={toggleProgress}>
                             <input type="hidden" name="resourceId" value={resource.id} />
                             <button type="submit" style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: completedResourceIds.includes(resource.id) ? 'var(--color-success)' : 'rgba(255,255,255,0.05)', border: `1px solid ${completedResourceIds.includes(resource.id) ? 'var(--color-success)' : 'var(--color-border)'}`, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                               {completedResourceIds.includes(resource.id) ? '✓' : ''}
                             </button>
                          </form>
                          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
                            Download PDF
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ ...cardStyle, textAlign: 'center', padding: '4rem' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📄</span>
                  <p style={{ color: 'var(--color-text-muted)' }}>No study materials available yet.</p>
                </div>
              )}
            </div>
          )}

          {/* ── NOTICES ── */}
          {section === 'announcements' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
                Latest Announcements
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {announcements.map(ann => (
                  <div key={ann.id} style={{ ...cardStyle, padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-primary)' }}>{ann.title}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{ann.content}</p>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div style={{ ...cardStyle, textAlign: 'center', padding: '4rem' }}>
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔔</span>
                    <p style={{ color: 'var(--color-text-muted)' }}>No new announcements at this time.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PAYMENT HISTORY ── */}
          {section === 'payments' && (
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
                Your Transaction History
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {user.paymentSlips.map(slip => {
                  const { main, sub: medium } = splitClassTitle(slip.class.title);
                  return (
                    <div key={slip.id} style={{ ...cardStyle, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '45px', height: '45px', borderRadius: '10px', backgroundColor: slip.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : slip.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                          {slip.status === 'approved' ? '✅' : slip.status === 'rejected' ? '❌' : '⏳'}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.3 }}>
                            <span style={{ color: 'white' }}>{main}</span>
                            {medium && <span className="text-gradient" style={{ display: 'block', fontSize: '0.8rem', marginTop: '0.2rem' }}>{medium}</span>}
                          </h4>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.35rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            <span><strong>Cycle:</strong> {new Date(slip.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
                            <span><strong>Submitted:</strong> {new Date(slip.createdAt).toLocaleDateString('en-GB')} at {new Date(slip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
                            <span><strong>Amount:</strong> Rs. 2,500 (Bank Transfer)</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          padding: '0.25rem 0.6rem', 
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: slip.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : slip.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: slip.status === 'approved' ? 'var(--color-success)' : slip.status === 'rejected' ? 'var(--color-danger)' : 'var(--color-secondary)',
                          textTransform: 'uppercase'
                        }}>
                          {slip.status}
                        </span>
                        {slip.status === 'approved' && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <a href={`/receipt/${slip.id}`} target="_blank" style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }}>View Receipt</a>
                          </div>
                        )}
                        {slip.status === 'rejected' && (
                          <p style={{ fontSize: '0.7rem', color: 'var(--color-danger)', marginTop: '0.25rem' }}>Please contact support</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {user.paymentSlips.length === 0 && (
                  <div style={{ ...cardStyle, textAlign: 'center', padding: '4rem' }}>
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>💳</span>
                    <p style={{ color: 'var(--color-text-muted)' }}>No payment history found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
