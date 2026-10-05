'use client';
import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface SidebarItem {
  key: string;
  label: string;
  icon: string;
  badge?: number;
}

interface AdminSidebarProps {
  items: SidebarItem[];
}

export default function AdminSidebar({ items }: AdminSidebarProps) {
  const searchParams = useSearchParams();
  const currentSection = searchParams.get('section') || 'approvals';

  return (
    <aside style={{ width: '260px', flexShrink: 0, position: 'sticky', top: '100px' }}>
      <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-primary)' }}>
            Admin Menu
          </h3>
        </div>
        
        <nav style={{ padding: '0.75rem' }}>
          {items.map((item) => {
            const isActive = currentSection === item.key;
            return (
              <Link 
                key={item.key} 
                href={`/admin?section=${item.key}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  textDecoration: 'none',
                  color: isActive ? 'white' : 'var(--color-text-muted)',
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
                  marginBottom: '0.25rem',
                  transition: 'all 0.2s ease',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.95rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.1rem', opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                  {item.label}
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span style={{ 
                    backgroundColor: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)', 
                    color: 'white', 
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: 'var(--radius-full)',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div style={{ marginTop: '1.5rem', padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
        Axiom v2.0 • Admin Control
      </div>
    </aside>
  );
}
