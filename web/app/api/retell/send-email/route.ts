import { NextResponse } from "next/server";
import { Retell } from "retell-sdk";
import { sendEmailHtmlInputSchema } from "@/lib/email/schemas";
import { sendEmailHtml } from "@/lib/email/resend";

export async function POST(req: Request) {
  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-retell-signature") || "";

    // Verify signature
    const retellApiKey = process.env.RETELL_API_KEY;
    if (!retellApiKey) {
      console.error("[retell/send-email] RETELL_API_KEY not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!Retell.verify(rawBody, retellApiKey, signature)) {
      console.error("[retell/send-email] Invalid signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    let body: { name?: string; call?: unknown; args?: unknown };
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      console.error("[retell/send-email] Invalid JSON:", error);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Extract args from Retell format (body.args) or use body directly as fallback
    const args = body.args || body;

    // Validate input using zod schema
    const validationResult = sendEmailHtmlInputSchema.safeParse(args);
    if (!validationResult.success) {
      console.error(
        "[retell/send-email] Validation error:",
        validationResult.error
      );
      return NextResponse.json(
        { error: "Invalid parameters", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Send email
    const data = await sendEmailHtml(validationResult.data);

    // Return result (Retell expects 200-299 status codes)
    return NextResponse.json(
      {
        id: data?.id,
        to: validationResult.data.to,
        subject: validationResult.data.subject,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[retell/send-email] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

