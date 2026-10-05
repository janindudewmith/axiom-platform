import React from 'react';

export default function NotFound() {
  return (
    <div style={{ 
      minHeight: '80vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ 
        fontSize: '8rem', 
        fontWeight: 900, 
        lineHeight: 1,
        background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '1rem'
      }}>
        404
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem', color: 'white' }}>
        You've wandered off the <span style={{ color: 'var(--color-primary)' }}>Axiom</span> path...
      </h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px', marginBottom: '3rem', fontSize: '1.1rem', lineHeight: 1.6 }}>
        The module or page you are looking for doesn't exist. It might have been moved, archived, or was never part of the curriculum.
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <a href="/" className="btn btn-outline" style={{ padding: '0.8rem 2rem' }}>Back to Home</a>
        <a href="/dashboard" className="btn btn-primary" style={{ padding: '0.8rem 2rem' }}>Go to Dashboard</a>
      </div>

      {/* Decorative Space Elements */}
      <div style={{ 
        position: 'absolute', 
        top: '20%', 
        left: '10%', 
        width: '100px', 
        height: '100px', 
        borderRadius: '50%', 
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
        zIndex: -1 
      }}></div>
      <div style={{ 
        position: 'absolute', 
        bottom: '20%', 
        right: '10%', 
        width: '150px', 
        height: '150px', 
        borderRadius: '50%', 
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
        zIndex: -1 
      }}></div>
    </div>
  );
}
