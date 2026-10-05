'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Suspense } from 'react';

interface SidebarItem {
  key: string;
  label: string;
  icon: string;
  badge?: number;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  title: string;
  subtitle: string;
}

function SidebarInner({ items, title, subtitle }: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get('section') || items[0]?.key;

  const navigate = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', key);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <aside style={{
      width: '240px',
      minWidth: '240px',
      background: 'linear-gradient(180deg, var(--color-surface) 0%, #0f172a 100%)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
      position: 'sticky',
      top: '5rem',
      alignSelf: 'flex-start',
      height: 'fit-content',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.25rem' }}>
          {title}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>{subtitle}</p>
      </div>

      {/* Nav Items */}
      {items.map(item => {
        const isActive = activeSection === item.key;
        return (
          <button
            key={item.key}
            onClick={() => navigate(item.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.65rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'white' : 'var(--color-text-muted)',
              background: isActive
                ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.06))'
                : 'transparent',
              borderLeft: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
              transition: 'all 0.15s ease',
              width: '100%',
            }}
          >
            <span style={{ fontSize: '1rem', minWidth: '18px' }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span style={{
                background: 'var(--color-danger)',
                color: 'white',
                borderRadius: '50px',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.1rem 0.45rem',
                minWidth: '18px',
                textAlign: 'center',
              }}>
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </aside>
  );
}

export default function DashboardSidebar(props: DashboardSidebarProps) {
  return (
    <Suspense fallback={
      <aside style={{ width: '240px', minWidth: '240px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem 1rem', height: '200px' }} />
    }>
      <SidebarInner {...props} />
    </Suspense>
  );
}
