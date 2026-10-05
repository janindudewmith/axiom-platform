import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ classId: string }>, searchParams: Promise<{ method?: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const resolvedParams = await params;
  const classId = resolvedParams.classId;
  
  const resolvedSearch = await searchParams;
  const method = resolvedSearch.method || 'online';

  const classData = await prisma.class.findUnique({ where: { id: classId } });
  if (!classData) return <div>Class not found</div>;

  async function processBankTransfer(formData: FormData) {
    'use server';
    if (!classData) return;
    const session = await getSession();
    if (!session) return;
    
    const file = formData.get('slip') as File;
    if (!file || file.size === 0) return;

    // Upload to Cloudinary instead of storing base64 in DB
    const { uploadPaymentSlip } = await import('@/lib/cloudinary');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileUrl = await uploadPaymentSlip(buffer, file.type);

    await prisma.paymentSlip.create({
      data: {
        userId: session.user.id,
        classId: classId,
        fileUrl: fileUrl,
        status: 'pending'
      }
    });

    // Send notification emails
    const { sendSlipUploadedStudentEmail, sendSlipUploadedAdminEmail } = await import('@/lib/email');
    await sendSlipUploadedStudentEmail(session.user.email, session.user.name, classData.title);
    await sendSlipUploadedAdminEmail(session.user.name, classData.title);

    redirect('/dashboard?status=slip_uploaded');
  }

  async function processInstantPayment() {
    'use server';
    if (!classData) return;
    const existingSub = await prisma.subscription.findUnique({
      where: { userId_classId: { userId: session.user.id, classId: classId } }
    });

    let newValidUntil = new Date();
    // Smart Renewal: Extension if already active
    if (existingSub && existingSub.validUntil > new Date()) {
      newValidUntil = new Date(existingSub.validUntil);
    }
    newValidUntil.setDate(newValidUntil.getDate() + 28);

    await prisma.subscription.upsert({
      where: { userId_classId: { userId: session.user.id, classId: classId } },
      update: { paymentStatus: 'paid', validUntil: newValidUntil },
      create: { userId: session.user.id, classId: classId, paymentStatus: 'paid', validUntil: newValidUntil }
    });
    redirect('/dashboard');
  }

  const isSinhala = classData.language === 'Sinhala';

  // Translate classData.title dynamically for Sinhala-medium classes
  const mainTitle = isSinhala 
    ? `${classData.gradeLevel} ශ්‍රේණිය ගණිතය` 
    : classData.title.split(' - ')[0];

  return (
    <div className={`container animate-fade-in ${isSinhala ? 'sinhala-font' : ''}`} style={{ padding: '4rem 0', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h1 className={`heading-xl ${isSinhala ? 'sinhala-heading' : ''}`}>
        {isSinhala ? <span>ආරක්ෂිත <span className="text-gradient">ගෙවීම්</span></span> : <span>Secure <span className="text-gradient">Checkout</span></span>}
      </h1>
      <p className="hero-subtitle">
        {isSinhala ? <span>ඔබ පහත පන්තිය සඳහා දින 28ක ප්‍රවේශයක් මිලදී ගනී:</span> : <span>You are purchasing 4 weeks of access for:</span>}
        <br/>
        <b className={isSinhala ? 'sinhala-heading' : ''} style={{ fontSize: '1.2rem', color: 'white', display: 'block', marginTop: '0.5rem' }}>{mainTitle}</b>
      </p>
      
      <div className="feature-card" style={{ padding: '3rem 2rem', marginBottom: '2rem' }}>
        <h3 className={`feature-title ${isSinhala ? 'sinhala-heading' : ''}`} style={{ fontSize: '2rem', marginBottom: '2rem' }}>
          {isSinhala ? 'රු. 2,500' : 'Rs. 2,500'}{' '}
          <span className={isSinhala ? 'sinhala-text' : ''} style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
            {isSinhala ? '/ දින 28ක් සඳහා' : '/ 4 weeks'}
          </span>
        </h3>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <a href={`/checkout/${classId}?method=online`} className={`btn ${method === 'online' ? 'btn-primary' : 'btn-outline'} ${isSinhala ? 'sinhala-text' : ''}`} style={{flex: 1, padding: '0.75rem 0', fontSize: '0.9rem', textAlign: 'center'}}>
            {isSinhala ? 'ඔන්ලයින් ගෙවන්න' : 'Pay Online'}
          </a>
          <a href={`/checkout/${classId}?method=bank`} className={`btn ${method === 'bank' ? 'btn-primary' : 'btn-outline'} ${isSinhala ? 'sinhala-text' : ''}`} style={{flex: 1, padding: '0.75rem 0', fontSize: '0.9rem', textAlign: 'center'}}>
            {isSinhala ? 'බැංකු තැන්පතු' : 'Bank Transfer'}
          </a>
        </div>

        {method === 'bank' ? (
          <>
            <p className={isSinhala ? 'sinhala-text' : ''} style={{ marginBottom: '2rem', color: 'var(--color-text-muted)', lineHeight: '1.85', fontSize: '0.95rem' }}>
              {isSinhala ? 'කරුණාකර පහත සඳහන් බැංකු ගිණුමට අදාළ මුදල තැන්පත් කර එහි රිසිට්පත (Slip) මෙතැනට එක් කරන්න.' : 'Please deposit the amount to the following bank account and upload your deposit slip.'}
              <br/><br/>
              <span className={isSinhala ? 'sinhala-text' : ''} style={{ display: 'inline-block', textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-md)', width: '100%', border: '1px solid var(--color-border)' }}>
                <b>{isSinhala ? 'බැංකුව:' : 'Bank:'}</b> Commercial Bank<br/>
                <b>{isSinhala ? 'ගිණුමේ නම:' : 'Acc Name:'}</b> Axiom Education<br/>
                <b>{isSinhala ? 'ගිණුම් අංකය:' : 'Acc No:'}</b> 1234567890
              </span>
            </p>
            
            <form action={processBankTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="file" name="slip" accept="image/*,.pdf" required style={{ border: '1px solid var(--color-border)', padding: '1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'rgba(255,255,255,0.01)', color: 'var(--color-text)' }} />
              <button type="submit" className={`btn btn-primary ${isSinhala ? 'sinhala-text' : ''}`} style={{ width: '100%', fontSize: '1.1rem', padding: '1rem', fontWeight: 700 }}>
                {isSinhala ? 'රිසිට්පත එක් කර ප්‍රවේශය ලබාගන්න' : 'Upload Slip & Request Access'}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className={isSinhala ? 'sinhala-text' : ''} style={{ marginBottom: '2rem', color: 'var(--color-text-muted)', lineHeight: '1.8', fontSize: '0.95rem' }}>
              {isSinhala ? 'PayHere ඔස්සේ ක්‍රෙඩිට් කාඩ්, ඩෙබිට් කාඩ් හෝ මොබයිල් පසුම්බි භාවිතයෙන් ආරක්ෂිතව ගෙවන්න.' : 'Pay securely via credit card, debit card, or mobile wallets using PayHere.'}
            </p>
            <form action={processInstantPayment}>
              <button type="submit" className={`btn btn-primary ${isSinhala ? 'sinhala-text' : ''}`} style={{ width: '100%', fontSize: '1.1rem', padding: '1rem', fontWeight: 700 }}>
                {isSinhala ? 'PayHere ගෙවීම් ද්වාරය වෙත යන්න' : 'Proceed to PayHere Gateway'}
              </button>
            </form>
            <p className={isSinhala ? 'sinhala-text' : ''} style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {isSinhala ? '*සටහන: මෙය ක්ලික් කිරීමෙන් පරීක්ෂණ කටයුතු සඳහා සාර්ථක ගෙවීමක් සිමියුලේට් කරනු ලබයි.' : '*Note: Clicking this currently simulates a successful payment for testing purposes.'}
            </p>
          </>
        )}

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
          <p className={isSinhala ? 'sinhala-text' : ''} style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            {isSinhala ? 'ගෙවීම් කිරීමේදී ගැටලුවක් මතු වූවාද?' : 'Having trouble with the payment?'}
          </p>
          <a href="https://wa.me/94702446778" target="_blank" className={isSinhala ? 'sinhala-text' : ''} style={{ color: '#25D366', fontSize: '0.95rem', fontWeight: 'bold' }}>
            {isSinhala ? 'Axiom සහාය කණ්ඩායම සමඟ WhatsApp මගින් සම්බන්ධ වන්න' : 'Chat with Axiom Support on WhatsApp'}
          </a>
        </div>
      </div>
    </div>
  );
}
