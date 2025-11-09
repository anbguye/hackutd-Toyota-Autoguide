import { sendEmailHtml, Attachment } from "./resend";
import { generateIcsBuffer, generateIcsFilename, IcsEventDetails } from "@/lib/calendar/ics-generator";

interface BookingDetails {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  preferredLocation: string;
  bookingDateTime: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleTrim: string;
}

const LOCATION_MAP: Record<string, string> = {
  downtown: "Downtown Toyota — 123 Main St, Dallas, TX",
  north: "North Dallas Toyota — 456 North Rd, Dallas, TX",
  south: "South Toyota Center — 789 South Ave, Dallas, TX",
};

/**
 * Format a date for display in emails
 */
function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Generate HTML content for booking confirmation email
 */
function generateBookingConfirmationHtml(details: BookingDetails): string {
  const locationDisplay = LOCATION_MAP[details.preferredLocation] || details.preferredLocation;
  const formattedDate = formatDateForDisplay(details.bookingDateTime);
  const vehicleDisplay = `${details.vehicleYear} ${details.vehicleMake} ${details.vehicleModel} ${details.vehicleTrim}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      padding: 0;
      margin: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1a56db 0%, #1e40af 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      margin-bottom: 20px;
    }
    .booking-details {
      background-color: #f8f9fa;
      border-left: 4px solid #1a56db;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .detail-row {
      display: block;
      margin: 12px 0;
      padding: 0;
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      color: #555;
      display: block;
      margin-bottom: 4px;
    }
    .detail-value {
      color: #333;
      display: block;
      margin-left: 0;
    }
    .calendar-note {
      background-color: #e3f2fd;
      border: 1px solid #1a56db;
      padding: 12px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 14px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
      color: #999;
    }
    .cta-button {
      display: inline-block;
      background-color: #1a56db;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      margin: 15px 0;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Test Drive Scheduled</h1>
    </div>

    <div class="content">
      <div class="greeting">
        <p>Hi ${details.contactName},</p>
        <p>Great! We've confirmed your test drive appointment. Here are the details:</p>
      </div>

      <div class="booking-details">
        <div class="detail-row">
          <span class="detail-label">Vehicle</span>
          <span class="detail-value">${vehicleDisplay}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date & Time</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Location</span>
          <span class="detail-value">${locationDisplay}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Your Contact</span>
          <span class="detail-value">${details.contactPhone}</span>
        </div>
      </div>

      <div class="calendar-note">
        <strong>📅 Calendar Invite:</strong> We've attached a calendar file (.ics) to this email. Open it to add this appointment to Google Calendar, Outlook, Apple Calendar, or any other calendar app.
      </div>

      <p>If you need to reschedule or cancel your appointment, please reply to this email or contact us directly.</p>

      <p style="margin-top: 30px; margin-bottom: 10px;"><strong>See you soon! 🚗</strong></p>
      <p style="color: #666; font-size: 14px;">The Toyotron Team</p>
    </div>

    <div class="footer">
      <p>This is an automated message. Please do not reply directly to this email if you need assistance.</p>
      <p>&copy; 2025 Toyotron. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send booking confirmation email with calendar invite
 */
export async function sendBookingConfirmationEmail(details: BookingDetails): Promise<void> {
  try {
    // Generate ICS calendar file
    const bookingDate = new Date(details.bookingDateTime);
    const endTime = new Date(bookingDate.getTime() + 45 * 60000); // 45 minute test drive
    const locationDisplay = LOCATION_MAP[details.preferredLocation] || details.preferredLocation;
    const vehicleDisplay = `${details.vehicleYear} ${details.vehicleMake} ${details.vehicleModel} ${details.vehicleTrim}`;

    const icsDetails: IcsEventDetails = {
      eventTitle: `Test Drive: ${vehicleDisplay}`,
      eventDescription: `Test drive appointment for ${vehicleDisplay}. Please arrive 10 minutes early.`,
      startDateTime: bookingDate,
      endDateTime: endTime,
      location: locationDisplay,
      attendeeEmail: details.contactEmail,
      attendeeName: details.contactName,
      organizerEmail: "bookings@toyotron.local",
      organizerName: "Toyotron Test Drive",
    };

    const icsBuffer = generateIcsBuffer(icsDetails);
    const icsFilename = generateIcsFilename(
      `${details.vehicleMake}-${details.vehicleModel}`,
      bookingDate
    );

    const attachments: Attachment[] = [
      {
        filename: icsFilename,
        content: icsBuffer,
        contentType: "text/calendar",
      },
    ];

    // Generate email HTML
    const htmlContent = generateBookingConfirmationHtml(details);

    // Send email with calendar attachment
    await sendEmailHtml({
      to: details.contactEmail,
      subject: `Test Drive Confirmed: ${vehicleDisplay}`,
      html: htmlContent,
      attachments,
    });

    console.log(`[Booking Confirmation] Email sent to ${details.contactEmail} with calendar invite`);
  } catch (error) {
    console.error("[Booking Confirmation] Failed to send confirmation email:", error);
    throw error;
  }
}
