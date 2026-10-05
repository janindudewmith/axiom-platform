import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Use the Resend testing email until you verify your own domain
const FROM_EMAIL = 'Axiom Education <onboarding@resend.dev>';
const ADMIN_EMAIL = 'janindudewmith@gmail.com'; // UPDATE THIS to your actual admin email
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function sendPaymentApprovedEmail(to: string, name: string, className: string, meetingLink?: string) {
  if (!process.env.RESEND_API_KEY) return;
  
  const joinButton = meetingLink 
    ? `<div style="text-align: center; margin: 20px 0;">
         <a href="${meetingLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Join Live Class Session</a>
       </div>`
    : '';

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Payment Approved: ${className} 🚀`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #10b981;">Payment Approved! 🎉</h2>
          <p>Hi ${name},</p>
          <p>Great news! Your payment for <strong>${className}</strong> has been successfully verified and approved.</p>
          <p>Your subscription is now active. You can instantly access all live sessions and study packs from your dashboard.</p>
          ${joinButton}
          <div style="text-align: center; margin: 20px 0;">
            <a href="${BASE_URL}/dashboard" style="background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
          </div>
          <p>Happy learning,<br>The Axiom Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send approval email:', error);
  }
}

export async function sendSlipUploadedStudentEmail(to: string, name: string, className: string) {
  if (!process.env.RESEND_API_KEY) return;
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Slip Received: ${className} ⏳`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #3b82f6;">We've Received Your Slip!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for uploading your payment slip for <strong>${className}</strong>.</p>
          <p>Our team is currently verifying the transfer. Once approved, you will receive another email and gain full access to the class.</p>
          <p>Verification usually takes 1-2 hours during business hours.</p>
          <p>Thank you for your patience,<br>The Axiom Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send slip upload email:', error);
  }
}

export async function sendSlipUploadedAdminEmail(studentName: string, className: string) {
  if (!process.env.RESEND_API_KEY) return;
  
  try {
    // Note: If using Resend test mode, this recipient MUST be your Resend account email
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL, 
      subject: `NEW SLIP UPLOADED: ${studentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #3b82f6;">New Payment Slip Pending</h2>
          <p>A new payment slip has been uploaded by <strong>${studentName}</strong> for the class <strong>${className}</strong>.</p>
          <p>Please log in to the Admin Portal to review and approve/reject the slip.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${BASE_URL}/admin?section=approvals" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Open Admin Portal</a>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send admin notification email:', error);
  }
}

export async function sendPaymentRejectedEmail(to: string, name: string, className: string, classId: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Payment Update: ${className} ⚠️`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #ef4444;">Verification Failed</h2>
          <p>Hi ${name},</p>
          <p>We encountered an issue verifying your slip for <strong>${className}</strong>.</p>
          <p>Please re-upload a clear image of your slip in the portal.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${BASE_URL}/checkout/${classId}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Re-upload Slip</a>
          </div>
          <p>If you need help, <a href="https://wa.me/94702446778">chat with us on WhatsApp</a>.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send rejection email:', error);
  }
}

export async function sendPasswordResetEmail(to: string, resetToken: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Axiom - Reset Your Password 🔒',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2>Password Reset Request</h2>
          <p>Click the button below to set a new password. This link is valid for 1 hour.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${BASE_URL}/reset-password?token=${resetToken}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }
}
