import React from 'react';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';
import { splitClassTitle } from '@/lib/schedule';

import PrintButton from '@/components/PrintButton';

export default async function ReceiptPage({ params }: { params: Promise<{ slipId: string }> }) {
  const { slipId } = await params;
  const slip = await prisma.paymentSlip.findUnique({
    where: { id: slipId },
    include: { user: true, class: true }
  });

  if (!slip || slip.status !== 'approved') {
    notFound();
  }

  const { main, sub } = splitClassTitle(slip.class.title);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b', padding: '4rem 1rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        
        {/* RECEIPT HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '3rem', borderBottom: '2px solid #f1f5f9', paddingBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#0f172a' }}>AXIOM<span style={{ color: '#3b82f6' }}>EDUCATION</span></h1>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>Online Mathematics Institute</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase' }}>Official Receipt</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>#REC-{slip.id.slice(0, 8).toUpperCase()}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{slip.createdAt ? new Date(slip.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</div>
          </div>
        </div>

        {/* BILLING INFO */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
          <div>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Student Details</p>
            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{slip.user.name}</p>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>ID: {slip.user.studentId}</p>
            <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{slip.user.email}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Payment Status</p>
            <div style={{ display: 'inline-block', backgroundColor: '#dcfce7', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: 'full', fontSize: '0.75rem', fontWeight: 700 }}>✅ PAID</div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '3rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 0', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>ENROLLED CLASS / MODULE</th>
              <th style={{ padding: '0.75rem 0', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textAlign: 'right' }}>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '1.5rem 0' }}>
                <div style={{ fontWeight: 700 }}>{main}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{sub} · Grade {slip.user.gradeLevel}</div>
              </td>
              <td style={{ padding: '1.5rem 0', fontWeight: 700, textAlign: 'right' }}>Rs. 2,500.00</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid #f1f5f9' }}>
              <td style={{ padding: '1.5rem 0', fontWeight: 800, fontSize: '1.1rem' }}>Total Amount Paid</td>
              <td style={{ padding: '1.5rem 0', fontWeight: 800, fontSize: '1.1rem', textAlign: 'right', color: '#3b82f6' }}>Rs. 2,500.00</td>
            </tr>
          </tfoot>
        </table>

        {/* FOOTER */}
        <div style={{ textAlign: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '2rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>Thank you for choosing Axiom Education for your academic journey.</p>
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
             <PrintButton />
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            .no-print, header, footer, .whatsapp-float { display: none !important; }
            body { background-color: white !important; padding: 0 !important; }
            div { box-shadow: none !important; border: none !important; }
            main { padding-bottom: 0 !important; }
          }
        `}} />
      </div>
    </div>
  );
}
