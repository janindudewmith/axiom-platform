import React from 'react';

export default function TermsPage() {
  const containerStyle = {
    padding: '6rem 0',
    maxWidth: '800px',
    margin: '0 auto',
    lineHeight: '1.8',
    color: 'var(--color-text-muted)'
  };

  return (
    <div className="container" style={containerStyle}>
      <h1 className="heading-xl" style={{ color: 'white', marginBottom: '2rem' }}>Terms of <span className="text-gradient">Service</span></h1>
      
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>1. Acceptance of Terms</h2>
        <p>By accessing or using the Axiom Education platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>2. Course Enrollment & Access</h2>
        <p>Access to course materials is granted for a specific duration (usually 4 weeks) upon successful payment verification. Account sharing is strictly prohibited and may result in immediate suspension without refund.</p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>3. Payment & Refunds</h2>
        <p>All payments are non-refundable once course access has been granted. It is the student's responsibility to ensure they have selected the correct grade and medium before payment.</p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>4. Intellectual Property</h2>
        <p>All content, including videos, PDFs, and live session recordings, are the intellectual property of Axiom Education. Unauthorized distribution, recording, or commercial use is strictly prohibited.</p>
      </section>

      <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
        Last updated: May 2026 · Axiom Education (Pvt) Ltd.
      </div>
    </div>
  );
}
