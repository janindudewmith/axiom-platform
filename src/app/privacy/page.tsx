import React from 'react';

export default function PrivacyPage() {
  const containerStyle = {
    padding: '6rem 0',
    maxWidth: '800px',
    margin: '0 auto',
    lineHeight: '1.8',
    color: 'var(--color-text-muted)'
  };

  return (
    <div className="container" style={containerStyle}>
      <h1 className="heading-xl" style={{ color: 'white', marginBottom: '2rem' }}>Privacy <span className="text-gradient">Policy</span></h1>
      
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>1. Data Collection</h2>
        <p>We collect basic information including your name, email, WhatsApp number, and grade level to provide educational services and communicate important updates.</p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>2. Use of Information</h2>
        <p>Your data is used solely for account management, payment verification, and course delivery. We do not sell or share your personal data with third-party marketing agencies.</p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>3. Payment Security</h2>
        <p>We do not store credit card information. All bank transfer slips are used only for manual verification of enrollment and are stored securely.</p>
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ color: 'white', fontSize: '1.25rem', marginBottom: '1rem' }}>4. Your Rights</h2>
        <p>You have the right to request access to the data we hold about you or request its deletion by contacting our support team via WhatsApp.</p>
      </section>

      <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
        Last updated: May 2026 · Axiom Education (Pvt) Ltd.
      </div>
    </div>
  );
}
