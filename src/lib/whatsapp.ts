/**
 * WhatsApp Notification Service
 * This service handles sending automated messages to students and admins.
 * Note: Requires a WhatsApp Business API (like Twilio, WATI, or Interakt) to be fully automated.
 * For now, this provides the structure and uses the direct link pattern for fallback.
 */

const SUPPORT_NUMBER = "94702446778"; // Axiom Support

export async function sendWhatsAppMessage(to: string, message: string) {
  // Normalize number (remove +, spaces, etc.)
  const cleanNumber = to.replace(/\D/g, '');
  
  // LOGIC: In a production environment with an API key, you would call your provider here:
  /*
  await fetch('https://api.yourprovider.com/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}` },
    body: JSON.stringify({ to: cleanNumber, message })
  });
  */

  console.log(`[WhatsApp Simulation] To: ${cleanNumber}, Message: ${message}`);
  return true;
}

/**
 * Generates a WhatsApp direct message link
 */
export function getWhatsAppLink(phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Message Templates
 */
export const WhatsAppTemplates = {
  slipUploadedAdmin: (studentName: string, className: string) => 
    `🔔 *New Payment Slip Uploaded*\n\nStudent: ${studentName}\nClass: ${className}\n\nPlease visit the admin portal to verify.`,
  
  slipApprovedStudent: (studentName: string, className: string) => 
    `✅ *Payment Verified!*\n\nHi ${studentName}, your payment for *${className}* has been approved. You can now access the class materials and live links in your dashboard.\n\nHappy Learning!\n- Axiom Education`,
    
  slipRejectedStudent: (studentName: string, className: string) => 
    `❌ *Payment Issue*\n\nHi ${studentName}, we couldn't verify your payment slip for *${className}*. Please log in to your dashboard to re-upload a clear image of the slip or contact support.\n\n- Axiom Education`,

  support: (studentName: string) =>
    `Hello ${studentName}, this is Axiom Education Support. How can we assist you today?`
};
