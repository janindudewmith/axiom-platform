import React from 'react';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getNextClassDate, formatTime, splitClassTitle } from '@/lib/schedule';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ classId: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const cls = await prisma.class.findUnique({ where: { id: resolvedParams.classId } });
  if (!cls) return { title: "Class Not Found" };
  return {
    title: cls.title,
    description: `Enroll in ${cls.title} at Axiom Education. Expert mathematics lessons for Grade ${cls.gradeLevel}.`,
  };
}

export default async function ClassDetailsPage({ params }: { params: Promise<{ classId: string }> }) {
  const resolvedParams = await params;
  const classId = resolvedParams.classId;

  const session = await getSession();
  let isSubscribed = false;

  if (session) {
    const sub = await prisma.subscription.findUnique({
      where: { userId_classId: { userId: session.user.id, classId: classId } }
    });
    if (sub && sub.paymentStatus === 'paid') {
      isSubscribed = true;
    }
  }

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: { 
      _count: { select: { subscriptions: true } },
      resources: true // Always load resources to show the curriculum
    }
  });

  if (!cls) {
    notFound();
  }

  const nextDate = getNextClassDate(cls.dayOfWeek, cls.startTime) || new Date(cls.scheduleTime);
  const videoResources = cls.resources?.filter(r => r.type === 'video') || [];
  const pdfResources = cls.resources?.filter(r => r.type === 'pdf') || [];
  const { main, sub } = splitClassTitle(cls.title);

  const isSinhala = cls.language === 'Sinhala';

  // Translate titles dynamically for Sinhala-medium classes
  const mainTitle = isSinhala 
    ? `${cls.gradeLevel} ශ්‍රේණිය ගණිතය` 
    : main;
  const subTitle = isSinhala 
    ? 'සිංහල මාධ්‍ය' 
    : sub;

  let localizedDescription = cls.description;
  if (isSinhala && cls.description.includes('Complete syllabus coverage')) {
    localizedDescription = 'සම්පූර්ණ විෂය නිර්දේශය සජීවී දේශන සහ නිබන්ධන සමඟින් ආවරණය කරනු ලැබේ.';
  }

  // Sinhala Time indicators
  const timeStr = formatTime(cls.startTime);
  let localizedTime = timeStr;
  if (isSinhala) {
    localizedTime = timeStr
      .replace('AM', 'පෙ.ව.')
      .replace('PM', 'සවස');
  }

  return (
    <div className={`container animate-fade-in ${isSinhala ? 'sinhala-font' : ''}`} style={{ padding: '2rem 0 4rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: '2rem' }}>
          <span style={{ display: 'inline-block', padding: '0.4rem 1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-full)', fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: '700', marginBottom: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            {isSinhala ? `${cls.gradeLevel} ශ්‍රේණිය • සිංහල මාධ්‍ය` : `Grade ${cls.gradeLevel} • ${cls.language} Medium`}
          </span>
          <h1 className={isSinhala ? 'sinhala-heading' : ''} style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            <span style={{ color: 'white' }}>{mainTitle}</span>
            {subTitle && <span style={{ display: 'block', marginTop: '0.5rem' }} className="text-gradient">{subTitle}</span>}
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            ⏱ {isSinhala ? 'මීළඟ සජීවී දේශනය:' : 'Next Live:'} <span style={{ color: 'var(--color-text)' }}>{nextDate.toLocaleDateString('en-GB')} {isSinhala ? 'දින' : 'at'} {isSinhala ? localizedTime : formatTime(cls.startTime)}</span>
          </p>
        </div>

        <div className="class-details-grid">
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Curriculum / Resources Section */}
            <div className="feature-card" style={{ padding: '2.5rem' }}>
              <h2 className={isSinhala ? 'sinhala-heading' : ''} style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {isSinhala ? '📚 පන්ති විෂය නිර්දේශය' : '📚 Class Curriculum'}
                {!isSubscribed && (
                  <span className={isSinhala ? 'sinhala-text' : ''} style={{ fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 400, color: 'var(--color-text-muted)' }}>
                    {isSinhala ? 'අගුළු දමා ඇත' : 'Locked'}
                  </span>
                )}
              </h2>
              
              <h3 className={isSinhala ? 'sinhala-heading' : ''} style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text)' }}>
                {isSinhala ? 'පටිගත කරන ලද දේශන' : 'Recorded Lessons'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
                {videoResources.map(v => (
                  isSubscribed ? (
                    <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', padding: '1.25rem', justifyContent: 'flex-start' }}>
                      <span style={{ fontSize: '1.25rem' }}>🎥</span> {v.title}
                    </a>
                  ) : (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--color-text-muted)', cursor: 'not-allowed', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.25rem', filter: 'grayscale(1)' }}>🎥</span> {v.title}
                      </div>
                      <span style={{ fontSize: '0.9rem' }}>🔒</span>
                    </div>
                  )
                ))}
                {videoResources.length === 0 && <p className={isSinhala ? 'sinhala-text' : ''} style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>{isSinhala ? 'තවමත් වීඩියෝ කිසිවක් එක් කර නැත.' : 'No videos uploaded yet.'}</p>}
              </div>

              <h3 className={isSinhala ? 'sinhala-heading' : ''} style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-text)' }}>
                {isSinhala ? 'නිබන්ධන සහ සටහන් (PDF)' : 'Study Materials (PDFs)'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pdfResources.map(p => (
                  isSubscribed ? (
                    <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', padding: '1.25rem', justifyContent: 'flex-start' }}>
                      <span style={{ fontSize: '1.25rem' }}>📄</span> {p.title}
                    </a>
                  ) : (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--color-text-muted)', cursor: 'not-allowed', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.25rem', filter: 'grayscale(1)' }}>📄</span> {p.title}
                      </div>
                      <span style={{ fontSize: '0.9rem' }}>🔒</span>
                    </div>
                  )
                ))}
                {pdfResources.length === 0 && <p className={isSinhala ? 'sinhala-text' : ''} style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>{isSinhala ? 'තවමත් නිබන්ධන කිසිවක් එක් කර නැත.' : 'No study materials uploaded yet.'}</p>}
              </div>
            </div>

            <div className="feature-card" style={{ padding: '2.5rem' }}>
              <h2 className={isSinhala ? 'sinhala-heading' : ''} style={{ fontSize: '1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', fontWeight: 800 }}>
                {isSinhala ? 'පන්තිය පිළිබඳ විස්තර' : 'About this Class'}
              </h2>
              <p className={isSinhala ? 'sinhala-text' : ''} style={{ color: 'var(--color-text-muted)', lineHeight: '1.85', whiteSpace: 'pre-wrap', fontSize: '1.05rem' }}>
                {localizedDescription}
              </p>

              <h3 className={isSinhala ? 'sinhala-heading' : ''} style={{ fontSize: '1.1rem', marginTop: '2.5rem', marginBottom: '1.25rem', fontWeight: 700 }}>
                {isSinhala ? 'ඇතුළත් දේවල්:' : "What's Included:"}
              </h3>
              <ul className={isSinhala ? 'sinhala-text' : ''} style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--color-text-muted)' }}>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>✓</span> {isSinhala ? 'මයික්‍රොසොෆ්ට් ටීම්ස් (Microsoft Teams) ඔස්සේ සජීවී දේශන' : 'Live Interactive Sessions via Microsoft Teams'}
                </li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>✓</span> {isSinhala ? 'දේශන පටිගත කිරීම් සහ සටහන් සඳහා සෘජු ප්‍රවේශය' : 'Direct Access to Class Recordings & Notes'}
                </li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>✓</span> {isSinhala ? 'ගුරුතුමාගෙන් සෘජු සහාය' : 'Direct Support from Instructor'}
                </li>
                <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>✓</span> {isSinhala ? 'එක් ගෙවීමක් සඳහා දින 28ක සම්පූර්ණ ප්‍රවේශය' : '4 Weeks Full Access per Payment'}
                </li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="class-details-sidebar">
            <div className="feature-card" style={{ padding: '2.5rem', textAlign: 'center', borderColor: 'var(--color-primary)', position: 'sticky', top: '100px' }}>
              <h3 className={isSinhala ? 'sinhala-heading' : ''} style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                {isSinhala ? 'රු. 2,500' : 'Rs. 2,500'}
              </h3>
              <p className={isSinhala ? 'sinhala-text' : ''} style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
                {isSinhala ? 'දින 28ක ප්‍රවේශ කාලය සඳහා' : 'Per 4-week access period'}
              </p>
              
              {!isSubscribed ? (
                <a href={`/checkout/${cls.id}`} className={`btn btn-primary ${isSinhala ? 'sinhala-text' : ''}`} style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', marginBottom: '1.25rem', fontWeight: 700 }}>
                  {isSinhala ? 'ඇතුළත් වන්න' : 'Enroll Now'}
                </a>
              ) : (
                <a href="/dashboard" className={`btn btn-primary ${isSinhala ? 'sinhala-text' : ''}`} style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', marginBottom: '1.25rem', fontWeight: 700, backgroundColor: 'var(--color-success)' }}>
                  {isSinhala ? 'ප්‍රවේශ වන්න' : 'Go to Learning Portal'}
                </a>
              )}
              
              <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                <h4 className={isSinhala ? 'sinhala-heading' : ''} style={{ marginBottom: '0.75rem', fontSize: '1.1rem', fontWeight: 700 }}>
                  {isSinhala ? 'සහාය අවශ්‍යද?' : 'Need Help?'}
                </h4>
                <p className={isSinhala ? 'sinhala-text' : ''} style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
                  {isSinhala ? 'ඉක්මන් සහාය සඳහා WhatsApp මගින් අපගේ කණ්ඩායම සමඟ සම්බන්ධ වන්න.' : 'Chat with our support team on WhatsApp for quick help.'}
                </p>
                <a href="https://wa.me/94702446778" target="_blank" rel="noopener noreferrer" className={`btn btn-outline ${isSinhala ? 'sinhala-text' : ''}`} style={{ width: '100%', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600 }}>
                  {isSinhala ? 'WhatsApp සහාය' : 'Chat on WhatsApp'}
                </a>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      <style>{`
        .class-details-grid {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 2rem;
          align-items: start;
        }

        @media (max-width: 900px) {
          .class-details-grid {
            grid-template-columns: 1fr;
          }
          .class-details-sidebar {
            order: -1;
          }
          .class-details-sidebar .feature-card {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}
