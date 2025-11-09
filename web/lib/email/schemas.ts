import z from "zod";

export const sendEmailHtmlInputSchema = z.object({
  to: z
    .union([z.string().email(), z.array(z.string().email()).min(1)])
    .describe("Recipient email address(es)"),
  subject: z.string().min(1).describe("Email subject line"),
  html: z.string().min(1).describe("Raw HTML content for the email body"),
  cc: z.array(z.string().email()).optional().describe("CC recipient email addresses"),
  bcc: z.array(z.string().email()).optional().describe("BCC recipient email addresses"),
  replyTo: z.string().email().optional().describe("Reply-to email address"),
});

export const sendEmailHtmlJsonSchema = {
  type: "object",
  properties: {
    to: {
      oneOf: [
        { type: "string", format: "email", description: "Recipient email address" },
        {
          type: "array",
          items: { type: "string", format: "email" },
          minItems: 1,
          description: "Recipient email addresses",
        },
      ],
      description: "Recipient email address(es)",
    },
    subject: {
      type: "string",
      minLength: 1,
      description: "Email subject line",
    },
    html: {
      type: "string",
      minLength: 1,
      description: "Raw HTML content for the email body",
    },
    cc: {
      type: "array",
      items: { type: "string", format: "email" },
      description: "CC recipient email addresses",
    },
    bcc: {
      type: "array",
      items: { type: "string", format: "email" },
      description: "BCC recipient email addresses",
    },
    replyTo: {
      type: "string",
      format: "email",
      description: "Reply-to email address",
    },
  },
  required: ["to", "subject", "html"],
} as const;

