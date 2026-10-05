import type { Metadata } from "next";
import "./globals.css";
import { getSession } from '@/lib/auth';

import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: {
    default: "Axiom Education | Sri Lanka's Premier Mathematics Institute",
    template: "%s | Axiom Education"
  },
  description: "Sri Lanka's premier online education platform for Mathematics. Expert guidance for Grades 6–11 in Sinhala & English mediums. Experience world-class learning with Axiom.",
  keywords: ["Mathematics", "Online Classes", "Sri Lanka", "Grade 10", "Grade 11", "Sinhala Medium", "English Medium", "Axiom Education", "Math Tuition"],
  metadataBase: new URL('https://axiom.lk'),
  openGraph: {
    title: "Axiom Education | Where Math Begins",
    description: "Sri Lanka's premier online education platform for Mathematics. Join world-class sessions for Grades 6–11.",
    url: "https://axiom.lk",
    siteName: "Axiom Education",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Axiom Education - Sri Lanka's Premier Mathematics Institute"
      },
    ],
    locale: "en_LK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Axiom Education | Sri Lanka's Premier Mathematics Institute",
    description: "Expert Mathematics guidance for Grades 6–11.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Axiom Education",
    startupImage: [
      {
        url: "/favicon.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
      },
      {
        url: "/favicon.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
      },
      {
        url: "/favicon.png",
        media: "(device-width: 621px) and (device-height: 1104px) and (-webkit-device-pixel-ratio: 3)"
      },
      {
        url: "/favicon.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
      }
    ]
  },
  icons: {
    icon: "/favicon.png?v=2",
    shortcut: "/favicon.png?v=2",
    apple: "/favicon.png?v=2",
  },
};

export const viewport = {
  themeColor: "#0B1120",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en">
      <body>
        <header className="container" style={{ position: 'sticky', top: '0', zIndex: 100, paddingTop: '1rem' }}>
          <Navbar session={session} />
        </header>
        <main style={{ paddingBottom: '8rem' }}>{children}</main>
        <footer style={{ padding: '6rem 0 3rem 0', background: 'linear-gradient(to bottom, #0B1120, #070b14)', borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: 'auto' }}>
          <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            <div>
              <div className="logo" style={{ marginBottom: '1rem' }}>
                <a href="/">AXIOM<span>.</span></a>
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Where Math Begins. Comprehensive online mathematics education for Sri Lankan students.
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: '1.5rem' }}>Quick Links</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><a href="/" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Home</a></li>
                <li><a href="/classes" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Classes</a></li>
                <li><a href="/support" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Help & Support</a></li>
                <li><a href="/login" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Student Login</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: '1.5rem' }}>Legal</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><a href="/terms" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Terms of Service</a></li>
                <li><a href="/privacy" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Privacy Policy</a></li>
                <li><a href="/support" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Refund Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: '1.5rem' }}>Connect With Us</h4>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <a href="https://facebook.com/axiom" target="_blank" title="Facebook" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s', color: '#1877F2' }}>
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://youtube.com/axiom" target="_blank" title="YouTube" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s', color: '#FF0000' }}>
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="container" style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} Axiom Education. All Rights Reserved.
          </div>
        </footer>
        <a 
          href="https://wa.me/94702446778" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="whatsapp-float"
          style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(37, 211, 102, 0.4)' }}
          title="Chat with us"
        >
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
        </a>
      </body>
    </html>
  );
}
