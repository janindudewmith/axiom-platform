import React from 'react';

export default function SupportPage() {
  const steps = [
    { num: "01", title: "Create Account", desc: "Sign up with your name, grade, and WhatsApp number to get started." },
    { num: "02", title: "Select Class", desc: "Browse our modules and pick the class that matches your grade and medium." },
    { num: "03", title: "Upload Receipt", desc: "Pay via Bank Transfer and upload a clear photo of your slip in the checkout." },
    { num: "04", title: "Start Learning", desc: "Once our team approves your slip (usually within 1-2 hours), you're in!" }
  ];

  const faqs = [
    { q: "Where is my Zoom link?", a: "Once enrolled, click 'Join Live Now' on your dashboard. Links appear 15 mins before class starts." },
    { q: "Can I watch missed lessons?", a: "Yes! All sessions are recorded and available in your 'Video Replays' section within 24 hours." },
    { q: "How do I renew?", a: "Simply click 'Enroll' again on your dashboard when your 4-week access expires." }
  ];

  const cardStyle = {
    backgroundColor: 'var(--color-surface)',
    padding: '2rem',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    transition: 'transform 0.2s, border-color 0.2s',
  };

  return (
    <div className="container" style={{ padding: '4rem 0' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* HERO */}
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h1 className="heading-xl">Student <span className="text-gradient">Guide</span></h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '1rem auto 0' }}>
            Everything you need to know about joining Axiom and mastering Mathematics.
          </p>
        </div>

        {/* ROADMAP */}
        <section style={{ marginBottom: '6rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '2.5rem', textAlign: 'center' }}>How to Enroll</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {steps.map((s, i) => (
              <div key={i} className="feature-card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'rgba(59, 130, 246, 0.2)', marginBottom: '0.5rem' }}>{s.num}</div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* JOINING SESSIONS */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '6rem' }}>
          <div style={cardStyle}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎥</div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Joining Live Sessions</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: '1.7' }}>
              All live sessions are conducted via <strong>Zoom</strong> or <strong>Microsoft Teams</strong>. 
              Once your enrollment is approved, a "Join Session" button will appear on your Student Dashboard 
              on the day of your class.
            </p>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Accessing Materials</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: '1.7' }}>
              Study packs (PDFs) and video replays are located in the <strong>Learning Portal</strong>. 
              Simply click on your class name in the dashboard to see all uploaded materials for the month.
            </p>
          </div>
        </section>

        {/* BANK DETAILS */}
        <section style={{ ...cardStyle, border: '1px solid var(--color-primary)', backgroundColor: 'rgba(59, 130, 246, 0.05)', marginBottom: '6rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Bank Transfer Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bank</p>
              <p style={{ fontWeight: 600 }}>Commercial Bank</p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Name</p>
              <p style={{ fontWeight: 600 }}>Axiom Education (Pvt) Ltd</p>
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Number</p>
              <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>800 123 4567</p>
            </div>
          </div>
          <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            * Please mention your Name and Grade in the transfer description.
          </p>
        </section>

        {/* FAQS */}
        <section style={{ marginBottom: '6rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '2.5rem', textAlign: 'center' }}>Common Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((f, i) => (
              <div key={i} style={{ ...cardStyle, padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>{f.q}</h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CONTACT */}
        <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Still Have Questions?</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Our student support team is ready to help you on WhatsApp.</p>
          <a href="https://wa.me/94702446778" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ backgroundColor: '#25D366', padding: '1rem 2.5rem' }}>
            Chat with Support
          </a>
        </div>

      </div>
    </div>
  );
}

