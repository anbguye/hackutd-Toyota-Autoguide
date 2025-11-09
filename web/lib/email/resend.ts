import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailHtmlParams {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
}

export async function sendEmailHtml({ to, subject, html, cc, bcc, replyTo }: SendEmailHtmlParams) {
  const toList = Array.isArray(to) ? to : [to];

  const { data, error } = await resend.emails.send({
    from: "Toyotron <noreply@briceduke.dev>",
    to: toList,
    subject,
    html,
    cc,
    bcc,
    reply_to: replyTo,
  });

  if (error) {
    throw error;
  }

  return data;
}

