import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResendClient(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set. Email functionality is disabled.");
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export interface Attachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailHtmlParams {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  attachments?: Attachment[];
}

export async function sendEmailHtml({ to, subject, html, cc, bcc, replyTo, attachments }: SendEmailHtmlParams) {
  const resend = getResendClient();
  const toList = Array.isArray(to) ? to : [to];

  const { data, error } = await resend.emails.send({
    from: "Toyotron <noreply@onboarding.briceduke.dev>",
    to: toList,
    subject,
    html,
    cc,
    bcc,
    replyTo,
    attachments,
  });

  if (error) {
    throw error;
  }

  return data;
}

