import { Booking, HostelSettings, NotificationTemplate, Room, SurfAddOn } from '../types';
import { formatDisplayDate } from './date';

export interface EmailReceiptDraft {
  id: string;
  bookingId: string;
  bookingRef: string;
  from: string;
  to: string;
  guestName: string;
  subject: string;
  generatedAt: string;
  plainText: string;
  htmlContent: string;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  nights: number;
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  addOnsCount: number;
}

export function formatSurfLevelLabel(level: string): string {
  switch (level) {
    case 'beginner':
      return 'Beginner (Whitewater & Pop-up)';
    case 'intermediate':
      return 'Intermediate (Green waves & trimming)';
    case 'advanced':
      return 'Advanced (Reef breaks & tube riding)';
    case 'non_surfer':
      return 'Non-Surfer (Beach & Yoga enthusiast)';
    default:
      return level;
  }
}

export function getDefaultEmailReceiptContent(settings?: HostelSettings): string {
  const hostelName = settings?.name || 'WaveHaven Surf House';
  return `🏄‍♂️ *${hostelName.toUpperCase()} - OFFICIAL BOOKING RECEIPT* 🤙

Aloha {guestName}!
Your reservation at ${hostelName} is confirmed. Here is your automated booking receipt and check-in voucher.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 RESERVATION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Booking Reference: #{bookingRef}
• Lead Guest: {guestName}
• Contact Email: {email}
• WhatsApp / Mobile: {phone}
• Country of Origin: {country}
• Surf Skill Level: {surfLevel}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛏️ STAY & ACCOMMODATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Room / Dorm: {roomName}
• Check-in Date: {checkInDate} (Open from {checkInTime})
• Check-out Date: {checkOutDate} (Check-out by {checkOutTime})
• Duration of Stay: {nights} night(s) | {guestsCount} guest(s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 SURF & HOSPITALITY ADD-ONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{addOnsList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 PAYMENT & FINANCIAL BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Total Stay Amount: {totalAmount} {currency}
• Payment Status: {paymentStatus}
• Balance Due at Arrival: {balanceDue} {currency}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 LOCATION & ACCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Address: {address}
• Google Maps: {googleMapsUrl}
• Hostel Reception WhatsApp: +{hostelPhone}
• Front Desk Hours: 08:00 - 22:00
{notes}

🏄 Arrival Tip: If arriving after 22:00, reply to this email or send a quick WhatsApp to reception for late-arrival surf gate digital keypad instructions.

See you on the waves soon! 🌊
🤙 ${hostelName} Front Desk Team`;
}

export function formatEmailReceiptDraft(
  booking: Booking,
  settings: HostelSettings,
  allAddOns: SurfAddOn[] = [],
  customTemplate?: NotificationTemplate,
  room?: Room
): EmailReceiptDraft {
  const hostelName = settings.name || 'WaveHaven Surf House';
  const currency = settings.currencySymbol || '€';
  const roomName = room ? room.name : booking.roomName;
  const guestFullName = `${booking.guest.firstName} ${booking.guest.lastName}`.trim();
  const guestEmail = booking.guest.email || 'guest@example.com';
  const senderEmail = settings.email || 'hello@wavehavensurf.com';

  // Calculate balance due
  let balanceDue = 0;
  if (booking.paymentStatus === 'pending') {
    balanceDue = booking.totalAmount;
  } else if (booking.paymentStatus === 'deposit') {
    const depositPercent = settings.depositRequirementPercent || 30;
    const depositPaid = (booking.totalAmount * depositPercent) / 100;
    balanceDue = Math.max(0, booking.totalAmount - depositPaid);
  }

  // Format add-ons list mimicking WhatsApp style
  let addOnsText = '  • None selected';
  if (booking.addOns && booking.addOns.length > 0) {
    const lines = booking.addOns.map((selected) => {
      const def = allAddOns.find((a) => a.id === selected.addOnId);
      const name = def ? def.name : selected.addOnId;
      const daysStr = selected.days ? ` (${selected.days} day${selected.days > 1 ? 's' : ''})` : '';
      const priceStr = def ? ` - ${currency}${(def.price * selected.quantity * (selected.days || 1)).toFixed(2)}` : '';
      return `  • ${selected.quantity}x ${name}${daysStr}${priceStr}`;
    });
    addOnsText = lines.join('\n');
  }

  let notesText = '';
  if (booking.guest.arrivalEstimatedTime) {
    notesText += `\n⏰ Est. Arrival Time: ${booking.guest.arrivalEstimatedTime}`;
  }
  if (booking.guest.specialRequests) {
    notesText += `\n📝 Guest Notes: ${booking.guest.specialRequests}`;
  }

  // Prepare replacements map
  const replacements: Record<string, string> = {
    '{guestName}': guestFullName,
    '{guestFirstName}': booking.guest.firstName,
    '{bookingRef}': booking.referenceNumber,
    '{roomName}': roomName,
    '{checkInDate}': formatDisplayDate(booking.checkInDate),
    '{checkOutDate}': formatDisplayDate(booking.checkOutDate),
    '{checkInTime}': settings.checkInTime || '14:00',
    '{checkOutTime}': settings.checkOutTime || '11:00',
    '{nights}': String(booking.nights),
    '{guestsCount}': String(booking.guestsCount),
    '{surfLevel}': formatSurfLevelLabel(booking.guest.surfLevel),
    '{addOnsList}': addOnsText,
    '{totalAmount}': booking.totalAmount.toFixed(2),
    '{currency}': currency,
    '{paymentStatus}': booking.paymentStatus.toUpperCase(),
    '{balanceDue}': balanceDue.toFixed(2),
    '{address}': settings.address || 'Ericeira, Portugal',
    '{googleMapsUrl}': settings.googleMapsUrl || 'https://maps.google.com',
    '{hostelPhone}': settings.phone || '351912345678',
    '{hostelEmail}': settings.email || 'hello@wavehavensurf.com',
    '{hostelName}': hostelName,
    '{email}': guestEmail,
    '{phone}': booking.guest.phone || 'Not provided',
    '{country}': booking.guest.country || 'Global Nomad',
    '{notes}': notesText,
  };

  // Compile Subject
  let rawSubject = customTemplate?.subject || customTemplate?.emailSubject || 
    `🏄‍♂️ Booking Receipt & Wave Voucher - #{bookingRef} | ${hostelName}`;
  for (const [key, val] of Object.entries(replacements)) {
    rawSubject = rawSubject.split(key).join(val);
  }

  // Compile Plain Text Body
  let rawBody = customTemplate?.content || getDefaultEmailReceiptContent(settings);
  for (const [key, val] of Object.entries(replacements)) {
    rawBody = rawBody.split(key).join(val);
  }

  // Generate Styled HTML Email Layout matching the WhatsApp receipt format
  const brandColor = settings.primaryBrandColor || '#0d9488';
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; color: #1e293b;">
      <!-- Header Banner with Surf House Branding -->
      <div style="background-color: ${brandColor}; padding: 28px 24px; color: #ffffff; text-align: center;">
        <div style="font-size: 28px; line-height: 1; margin-bottom: 8px;">🏄‍♂️ 🌊</div>
        <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; text-transform: uppercase;">
          ${hostelName}
        </h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; font-weight: 500;">
          Official Booking Receipt & Check-in Voucher
        </p>
      </div>

      <!-- Main Receipt Body -->
      <div style="padding: 24px;">
        <!-- Greeting & Reference Callout -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 14px; font-weight: 700; color: #0f172a;">Aloha ${booking.guest.firstName}! 🤙</span>
            <span style="background-color: #ecfdf5; color: #065f46; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; border: 1px solid #a7f3d0; text-transform: uppercase;">
              ${booking.paymentStatus}
            </span>
          </div>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">
            Your booking reference is <strong style="color: #0f172a; font-family: monospace; font-size: 13px;">#${booking.referenceNumber}</strong>. We have reserved your spot and look forward to welcoming you!
          </p>
        </div>

        <!-- Reservation Metadata Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b; width: 38%;">🛏️ Accommodation</td>
            <td style="padding: 10px 0; font-weight: 700; color: #0f172a; text-align: right;">${roomName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">📅 Check-in</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a; text-align: right;">
              ${formatDisplayDate(booking.checkInDate)} <span style="color: #64748b; font-size: 11px;">(from ${settings.checkInTime || '14:00'})</span>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">📅 Check-out</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a; text-align: right;">
              ${formatDisplayDate(booking.checkOutDate)} <span style="color: #64748b; font-size: 11px;">(by ${settings.checkOutTime || '11:00'})</span>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">🌙 Duration & Party</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a; text-align: right;">
              ${booking.nights} night${booking.nights > 1 ? 's' : ''} • ${booking.guestsCount} guest${booking.guestsCount > 1 ? 's' : ''}
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; color: #64748b;">🏄 Surf Skill Level</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0f172a; text-align: right;">
              ${formatSurfLevelLabel(booking.guest.surfLevel)}
            </td>
          </tr>
        </table>

        <!-- Surf & Stay Add-ons Breakdown -->
        <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #f1f5f9;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px;">
            📦 Surf & Hospitality Add-ons
          </div>
          <div style="font-size: 12px; color: #334155; line-height: 1.6; white-space: pre-line;">
            ${addOnsText}
          </div>
        </div>

        <!-- Total & Payment Highlight Box -->
        <div style="background: linear-gradient(135deg, #f0fdfa, #ecfeff); border: 1px solid #99f6e4; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <div>
              <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0d9488; letter-spacing: 0.05em; display: block;">
                Total Stay Amount
              </span>
              <span style="font-size: 24px; font-weight: 900; color: #0f172a; line-height: 1.2;">
                ${currency}${booking.totalAmount.toFixed(2)}
              </span>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 11px; font-weight: 700; color: #64748b; display: block;">Payment Status</span>
              <span style="font-size: 12px; font-weight: 800; color: #0d9488; text-transform: uppercase;">
                ${booking.paymentStatus}
              </span>
            </div>
          </div>
          ${balanceDue > 0 ? `
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #99f6e4; font-size: 12px; color: #0f766e; font-weight: 600;">
              💳 Remaining Balance at Check-in: ${currency}${balanceDue.toFixed(2)}
            </div>
          ` : ''}
        </div>

        <!-- Location & Contact Info -->
        <div style="font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid #e2e8f0; padding-top: 16px;">
          <p style="margin: 0 0 6px 0;">📍 <strong>Hostel Location:</strong> ${settings.address || 'Ericeira, Portugal'}</p>
          <p style="margin: 0 0 6px 0;">📲 <strong>WhatsApp Reception:</strong> +${settings.phone || '351912345678'}</p>
          <p style="margin: 0 0 6px 0;">🗺️ <strong>Directions / Map:</strong> <a href="${settings.googleMapsUrl}" style="color: ${brandColor}; font-weight: 600;">Open in Google Maps</a></p>
          <p style="margin: 12px 0 0 0; font-size: 11px; color: #94a3b8; font-style: italic;">
            Automated email receipt draft mimicking WhatsApp confirmation layout • Generated by WaveHaven Booking System
          </p>
        </div>
      </div>
    </div>
  `;

  return {
    id: `draft-${booking.id}`,
    bookingId: booking.id,
    bookingRef: booking.referenceNumber,
    from: `${hostelName} <${senderEmail}>`,
    to: `${guestFullName} <${guestEmail}>`,
    guestName: guestFullName,
    subject: rawSubject,
    generatedAt: new Date().toISOString(),
    plainText: rawBody,
    htmlContent,
    totalAmount: booking.totalAmount,
    currency,
    paymentStatus: booking.paymentStatus,
    nights: booking.nights,
    roomName,
    checkInDate: booking.checkInDate,
    checkOutDate: booking.checkOutDate,
    addOnsCount: booking.addOns?.length || 0,
  };
}

export function createMailtoUrl(to: string, subject: string, body: string): string {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  const cleanTo = to.includes('<') ? to.replace(/.*<([^>]+)>.*/, '$1') : to;
  return `mailto:${encodeURIComponent(cleanTo)}?subject=${encodedSubject}&body=${encodedBody}`;
}
