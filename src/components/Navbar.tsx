'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Avatar from '@/components/Avatar';

export default function Navbar({ session }: { session: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const getLinkStyle = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
      ? { color: 'var(--color-primary)', fontWeight: 'bold' }
      : {};
  };

  return (
    <nav className="navbar animate-fade-in">
      <div className="logo">
        <a href="/">AXIOM<span style={{ color: 'var(--color-primary)' }}>.</span></a>
      </div>
      
      <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '☰'}
      </button>

      <div className={`nav-links ${isOpen ? 'mobile-open' : ''}`}>
        <a href="/classes" className="nav-link" style={getLinkStyle('/classes')} onClick={() => setIsOpen(false)}>Classes</a>
        <a href="/support" className="nav-link" style={getLinkStyle('/support')} onClick={() => setIsOpen(false)}>Support</a>
        {session?.user?.role === 'admin' ? (
          <a href="/admin" className="nav-link" style={getLinkStyle('/admin')} onClick={() => setIsOpen(false)}>Admin Portal</a>
        ) : session ? (
          <a href="/dashboard" className="nav-link" style={getLinkStyle('/dashboard')} onClick={() => setIsOpen(false)}>Dashboard</a>
        ) : null}
        
        {session ? (
          <>
            <a href="/profile" className="nav-link" style={getLinkStyle('/profile')} onClick={() => setIsOpen(false)}>My Profile</a>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }}>Log Out</button>
            </form>
          </>
        ) : (
          <>
            <a href="/login" className="nav-link" style={getLinkStyle('/login')} onClick={() => setIsOpen(false)}>Log In</a>
            <a href="/register" className="btn btn-primary" onClick={() => setIsOpen(false)}>Get Started</a>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .nav-links.mobile-open {
            display: flex !important;
            flex-direction: column;
            position: fixed;
            top: 70px;
            left: 0;
            right: 0;
            background: rgba(11, 17, 32, 0.98);
            backdrop-filter: blur(10px);
            padding: 2rem;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            z-index: 1000;
            animation: slideDown 0.25s ease-out;
          }
        }
        @keyframes slideDown {
          from { transform: translateY(-8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
