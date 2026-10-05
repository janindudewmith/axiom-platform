import prisma from '@/lib/db';
import { getNextClassDate, formatDuration, formatTime, splitClassTitle } from '@/lib/schedule';

export default async function Home() {
  // Dynamically fetch the 3 most recently created active classes
  const latestClasses = await prisma.class.findMany({
    where: { archived: false },
    orderBy: { createdAt: 'desc' },
    take: 3
  });

  return (
    <div className="container">
      <section className="hero-section animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <span className="badge" style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            Sri Lanka's Premier Online Mathematics Institute
          </span>
        </div>
        <h1 className="heading-xl">
          Where <span className="text-gradient">Math</span> Begins
          <span style={{ fontSize: '1.75rem', display: 'block', marginTop: '0.25rem', fontWeight: 800, opacity: 0.7, letterSpacing: '0.35em', textTransform: 'lowercase', textAlign: 'center' }}>
            elevate your genius
          </span>
        </h1>
        <p className="hero-subtitle" style={{ maxWidth: '850px' }}>
          Unlock your math potential with Sri Lanka's premier mathematics institute. 
          Expert guidance for Grades 6–11 in Sinhala & English mediums.
        </p>
        <div className="hero-buttons">
          <a href="/register" className="btn btn-primary" style={{ padding: '1rem 2rem' }}>Enroll Now</a>
          <a href="https://wa.me/94702446778" target="_blank" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Contact Support</span>
          </a>
        </div>
      </section>

      <section style={{ padding: '6rem 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div style={{ width: '100%', aspectRatio: '16/9', background: 'linear-gradient(45deg, #0f172a, #1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <span style={{ fontSize: '6rem' }}>📐</span>
          </div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80px', height: '80px', backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 30px rgba(255,255,255,0.3)', transition: 'transform 0.2s' }}>
            <span style={{ fontSize: '2rem', color: 'var(--color-bg)', marginLeft: '5px' }}>▶</span>
          </div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', lineHeight: '1.2' }}>
            Sri Lanka's Most <span className="text-gradient">Result-Oriented</span> Online Mathematics Class
          </h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '1.1rem', lineHeight: '1.8' }}>
            Axiom is the most popular online Mathematics class with the highest student participation. Whether you study in Sinhala or English Medium, our lessons are designed to make you a master of the subject.
          </p>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontSize: '1.1rem' }}>
            All previous lesson recordings and study packs are available to watch anytime through our official portal.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="https://wa.me/94702446778" target="_blank" className="btn btn-primary" style={{ backgroundColor: '#25D366', padding: '1rem 2rem', fontWeight: 700 }}>WhatsApp</a>
            <a href="tel:+94702446778" className="btn btn-outline" style={{ padding: '1rem 2rem', fontWeight: 700 }}>Call Now</a>
          </div>
        </div>
      </section>

      <section style={{ padding: '4rem 0', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '2.5rem' }}>Active <span className="text-gradient">Modules</span></h2>
          <a href="/classes" className="btn btn-primary">Browse All Classes →</a>
        </div>
        <div className="feature-grid">
          {latestClasses.map(cls => {
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
              <div key={cls.id} className={`feature-card animate-fade-in ${isSinhala ? 'sinhala-font' : ''}`} style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
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
                    <>
                      <p style={{ color: 'var(--color-text)', fontSize: '0.95rem', fontWeight: 600 }}>
                        🗓 {isSinhala ? `සෑම ${localizedDay} දිනකම` : `Every ${cls.dayOfWeek}`}
                      </p>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                        🕒 {localizedTime} ({localizedDuration})
                      </p>
                    </>
                  ) : (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      ⏱ {isSinhala ? `මීළඟ පන්තිය: ${new Date(cls.scheduleTime).toLocaleDateString('en-GB')}` : `Next: ${new Date(cls.scheduleTime).toLocaleString()}`}
                    </p>
                  )}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.75rem' }}>
                  <a href={`/classes/${cls.id}`} className="btn btn-outline" style={{ flex: 1, padding: '0.65rem 0', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600 }}>
                    {isSinhala ? 'තව විස්තර →' : 'Learn More'}
                  </a>
                  <a href={`/checkout/${cls.id}`} className="btn btn-primary" style={{ flex: 1, padding: '0.65rem 0', fontSize: '0.85rem', textAlign: 'center', fontWeight: 700 }}>
                    {isSinhala ? 'ඇතුළත් වන්න' : 'Enroll'}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ padding: '6rem 0 4rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Quick Access by Grade</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', maxWidth: '800px', margin: '0 auto' }}>
          {[6, 7, 8, 9, 10, 11].map(grade => (
            <a key={grade} href={`/classes?grade=${grade}`} className="btn btn-outline" style={{ fontSize: '1.1rem', padding: '1rem 0', fontWeight: 600 }}>
              Grade {grade}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
