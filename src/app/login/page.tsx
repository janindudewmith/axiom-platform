'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function LoginContent() {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get('status') === 'password_reset_success';

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      window.location.href = '/dashboard';
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 0', maxWidth: '500px', margin: '0 auto' }}>
      <h1 className="heading-xl text-center" style={{ textAlign: 'center' }}>Welcome <span className="text-gradient">Back</span></h1>
      
      {resetSuccess && (
        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', color: 'var(--color-success)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          ✅ Password reset successfully! You can now log in.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <input type="text" placeholder="Email, Username, or WhatsApp Number" required value={formData.identifier} onChange={e => setFormData({...formData, identifier: e.target.value})} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
        <input type="password" placeholder="Password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <a href="/forgot-password" style={{ color: 'var(--color-primary)', fontSize: '0.85rem' }}>Forgot Password?</a>
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Log In</button>
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>Don't have an account? <a href="/register" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Register</a></p>
      </form>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
