'use client';
import { useState } from 'react';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', username: '', whatsapp: '', password: '', gradeLevel: '', language: '' });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.gradeLevel || !formData.language) {
      alert("Please select both Grade and Medium");
      return;
    }
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      window.location.href = '/dashboard';
    } else {
      const data = await res.json();
      alert(data.error || "Registration failed");
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 0', maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="heading-xl text-center" style={{ textAlign: 'center' }}>Join <span className="text-gradient">Axiom</span></h1>
      <form onSubmit={handleSubmit} className="register-form" style={{ marginTop: '2rem' }}>
        <div className="form-grid">
          <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <input type="text" placeholder="Username" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
          <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input type="text" placeholder="WhatsApp Number" required value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} />
          <div style={{ gridColumn: 'span 2' }}>
            <input type="password" placeholder="Password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ width: '100%' }} />
          </div>
          <select value={formData.gradeLevel} onChange={e => setFormData({...formData, gradeLevel: e.target.value})} required>
            <option value="" disabled>Select Grade</option>
            {[6,7,8,9,10,11].map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
          <select value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} required>
            <option value="" disabled>Select Medium</option>
            <option value="Sinhala">Sinhala Medium</option>
            <option value="English">English Medium</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: '2rem', width: '100%' }}>Create Account</button>
        <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>Already have an account? <a href="/login" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Log In</a></p>
      </form>
    </div>
  );
}
