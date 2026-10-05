import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Live Classes & Modules",
  description: "Browse our comprehensive Mathematics curriculum for Grades 6–11. High-quality live sessions and study materials for every student.",
};

import prisma from '@/lib/db';
import { getNextClassDate, formatDuration, formatTime, splitClassTitle } from '@/lib/schedule';
import { getSession } from '@/lib/auth';

export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ grade?: string }> }) {
  const resolvedParams = await searchParams;
  const session = await getSession();

  // Determine user's role and grade
  const isAdmin = session?.user?.role === 'admin';
  const userGrade = session?.user?.gradeLevel;

  // If student and no grade param is specified, default to their grade
  // If admin or not logged in, default to 'all'
  let gradeParam = resolvedParams.grade;
  if (!gradeParam && userGrade && !isAdmin) {
    gradeParam = String(userGrade);
  }

  let filterGrade: number | undefined;
  if (gradeParam && gradeParam !== 'all') {
    filterGrade = parseInt(gradeParam);
  }

  const classes = await prisma.class.findMany({
    where: filterGrade ? { gradeLevel: filterGrade, archived: false } : { archived: false },
    orderBy: [{ gradeLevel: 'asc' }, { language: 'asc' }]
  });

  return (
    <div className="container" style={{ padding: '4rem 0' }}>
      <h1 className="heading-xl text-center" style={{ textAlign: 'center' }}>Available <span className="text-gradient">Classes</span></h1>
      <p className="hero-subtitle text-center" style={{ margin: '1rem auto 3rem', maxWidth: '800px', textAlign: 'center' }}>
        Browse our comprehensive mathematics modules. Select your grade to find the right class.
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3rem', flexWrap: 'wrap' }}>
        <a href="/classes?grade=all" className={`btn ${!filterGrade ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.5rem 1rem' }}>All</a>
        {[6, 7, 8, 9, 10, 11].map(grade => (
          <a key={grade} href={`/classes?grade=${grade}`} className={`btn ${filterGrade === grade ? 'btn-primary' : 'btn-outline'}`} style={{ padding: '0.5rem 1rem' }}>
            Grade {grade}
          </a>
        ))}
      </div>

      <div className="feature-grid">
        {classes.map(cls => {
          const nextDate = getNextClassDate(cls.dayOfWeek, cls.startTime);
          const timeStr = formatTime(cls.startTime);
          const { main, sub } = splitClassTitle(cls.title);
          const isSinhala = cls.language === 'Sinhala';

          // Sinhala Day translations
          const sinhalaDays: Record<string, string> = {
            'Sunday': 'ඉරිදා',
            'Monday': 'සඳුදා',
            'Tuesday': 'අඟහරුවාදා',
            'Wednesday': 'බදාදා',
            'Thursday': 'බ්‍රහස්පතින්දා',
            'Friday': 'සිකුරාදා',
            'Saturday': 'සෙනසුරාදා'
          };
          const localizedDay = (isSinhala && cls.dayOfWeek) ? (sinhalaDays[cls.dayOfWeek] || cls.dayOfWeek) : cls.dayOfWeek;

          // Sinhala Time indicators
          let localizedTime = timeStr;
          if (isSinhala) {
            localizedTime = timeStr
              .replace('AM', 'පෙ.ව.')
              .replace('PM', 'සවස');
          }

          // Sinhala duration translations
          const durationVal = cls.duration || 0;
          const hours = Math.floor(durationVal);
          const mins = Math.round((durationVal - hours) * 60);
          const localizedDuration = isSinhala
            ? `${hours} ${hours === 1 ? 'පැය' : 'පැය'}${mins > 0 ? ` විනාඩි ${mins}` : ''}`
            : formatDuration(durationVal);

          // Translate the main title and sub-title dynamically for Sinhala-medium classes
          const mainTitle = isSinhala 
            ? `${cls.gradeLevel} ශ්‍රේණිය ගණිතය` 
            : main;
          const subTitle = isSinhala 
            ? 'සිංහල මාධ්‍ය' 
            : sub;
          
          return (
            <div key={cls.id} className={`feature-card animate-fade-in ${isSinhala ? 'sinhala-font' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 className={`feature-title ${isSinhala ? 'sinhala-heading' : ''}`} style={{ fontSize: '1.25rem', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                <span style={{ color: 'white' }}>{mainTitle}</span>
                {subTitle && <span style={{ display: 'block', fontSize: '0.9rem', marginTop: '0.25rem' }} className="text-gradient">{subTitle}</span>}
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '0.25rem 0.6rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  {isSinhala ? `${cls.gradeLevel} ශ්‍රේණිය` : `Grade ${cls.gradeLevel}`}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '0.25rem 0.6rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderRadius: 'var(--radius-full)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  {isSinhala ? 'සිංහල මාධ්‍ය' : 'English Medium'}
                </span>
              </div>
              
              <div style={{ marginBottom: '1.5rem', flex: 1 }}>
                {cls.dayOfWeek ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <p style={{ color: 'var(--color-text)', fontSize: '1rem', fontWeight: 600 }}>
                      🗓 {isSinhala ? `සෑම ${localizedDay} දිනකම` : `Every ${cls.dayOfWeek}`}
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                      🕒 {localizedTime} ({localizedDuration})
                    </p>
                    {nextDate && (
                      <p style={{ color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700, marginTop: '0.5rem', textTransform: 'uppercase' }}>
                        {isSinhala ? `මීළඟ පන්තිය: ${nextDate.toLocaleDateString('en-GB')}` : `Next: ${nextDate.toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                ) : (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    ⏱ {isSinhala ? `මීළඟ පන්තිය: ${new Date(cls.scheduleTime).toLocaleDateString('en-GB')}` : `Next: ${new Date(cls.scheduleTime).toLocaleString()}`}
                  </p>
                )}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.75rem' }}>
                <a href={`/classes/${cls.id}`} className="btn btn-outline" style={{ flex: 1, padding: '0.6rem 0', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600 }}>
                  {isSinhala ? 'තව විස්තර →' : 'Learn More'}
                </a>
                <a href={`/checkout/${cls.id}`} className="btn btn-primary" style={{ flex: 1, padding: '0.6rem 0', fontSize: '0.85rem', textAlign: 'center', fontWeight: 700 }}>
                  {isSinhala ? 'ඇතුළත් වන්න' : 'Enroll Now'}
                </a>
              </div>
            </div>
          );
        })}
        {classes.length === 0 && (
          <p style={{ textAlign: 'center', gridColumn: '1 / -1', color: 'var(--color-text-muted)' }}>No classes available for this selection.</p>
        )}
      </div>
    </div>
  );
}
