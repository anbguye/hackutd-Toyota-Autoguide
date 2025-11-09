import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

