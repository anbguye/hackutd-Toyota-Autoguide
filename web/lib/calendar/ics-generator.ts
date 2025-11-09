/**
 * Generates an iCalendar (.ics) file for a test drive booking
 * The ICS format is compatible with Google Calendar, Outlook, Apple Calendar, etc.
 */

export interface IcsEventDetails {
  eventTitle: string;
  eventDescription: string;
  startDateTime: Date;
  endDateTime: Date;
  location: string;
  attendeeEmail: string;
  attendeeName: string;
  organizerEmail?: string;
  organizerName?: string;
  eventId?: string;
}

/**
 * Escape special characters in ICS format
 */
function escapeIcsString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Convert Date to ICS format (YYYYMMDDTHHMMSSZ)
 */
function dateToIcsFormat(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generates an iCalendar (.ics) file content as a string
 */
export function generateIcsContent(details: IcsEventDetails): string {
  const {
    eventTitle,
    eventDescription,
    startDateTime,
    endDateTime,
    location,
    attendeeEmail,
    attendeeName,
    organizerEmail = "noreply@onboarding.briceduke.dev",
    organizerName = "Toyotron",
    eventId = `test-drive-${Date.now()}@toyotron.local`,
  } = details;

  const dtStart = dateToIcsFormat(startDateTime);
  const dtEnd = dateToIcsFormat(endDateTime);
  const now = dateToIcsFormat(new Date());

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Toyotron//Test Drive Scheduler//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Toyotron Test Drive
X-WR-TIMEZONE:America/Chicago
BEGIN:VEVENT
UID:${eventId}
DTSTAMP:${now}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${escapeIcsString(eventTitle)}
DESCRIPTION:${escapeIcsString(eventDescription)}
LOCATION:${escapeIcsString(location)}
ATTENDEE;CN="${attendeeName}";RSVP=TRUE;PARTSTAT=NEEDS-ACTION:mailto:${attendeeEmail}
ORGANIZER;CN="${organizerName}":mailto:${organizerEmail}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Test Drive Reminder
END:VALARM
END:VEVENT
END:VCALENDAR`;

  return icsContent;
}

/**
 * Generates an ICS file Buffer for email attachment
 */
export function generateIcsBuffer(details: IcsEventDetails): Buffer {
  const icsContent = generateIcsContent(details);
  return Buffer.from(icsContent, "utf-8");
}

/**
 * Generates filename for the ICS file
 */
export function generateIcsFilename(vehicleModel: string, bookingDate: Date): string {
  const dateStr = bookingDate.toISOString().split("T")[0];
  const model = vehicleModel.replace(/\s+/g, "-").toLowerCase();
  return `test-drive-${model}-${dateStr}.ics`;
}
