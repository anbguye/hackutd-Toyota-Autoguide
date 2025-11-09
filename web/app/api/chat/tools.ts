import { tool, type ToolSet, type InferUITools } from "ai";
import { searchToyotaTrims } from "@/lib/cars/searchToyotaTrims";
import {
  searchToyotaTrimsInputSchema,
  displayCarRecommendationsInputSchema,
} from "@/lib/cars/schemas";
import type { CarCard } from "@/lib/cars/types";
import { sendEmailHtmlInputSchema } from "@/lib/email/schemas";
import { sendEmailHtml } from "@/lib/email/resend";

const searchToyotaTrimsTool = tool({
  description:
    "MANDATORY: Search and filter Toyota trim specifications from the ACTUAL DATABASE. You MUST call this tool BEFORE making any claims about vehicle availability, pricing, or features. Use this to find cars matching user preferences or search criteria. Returns up to 24 results. NEVER claim vehicles are unavailable without calling this tool first.",
  inputSchema: searchToyotaTrimsInputSchema,
  execute: async (input) => {
    console.log("[searchToyotaTrims] Tool called with:", JSON.stringify(input, null, 2));
    const result = await searchToyotaTrims(input);
    console.log("[searchToyotaTrims] Tool returned:", result.count, "items");
    return result;
  },
});

const displayCarRecommendationsTool = tool({
  description:
    "Display up to 3 car recommendations as visual cards in the chat interface. IMPORTANT: You MUST first call searchToyotaTrims to get car results, then select 1-3 items from the 'items' array in the search results, and pass those exact items to this tool. The items parameter is REQUIRED and must be an array of car objects from the searchToyotaTrims results.",
  inputSchema: displayCarRecommendationsInputSchema,
  execute: async (input) => {
    if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
      return {
        error: "Items array is required and must contain at least one car object from searchToyotaTrims results.",
        items: [],
        count: 0,
      };
    }

    const items = input.items.slice(0, 3);
    return {
      items,
      count: items.length,
    };
  },
});

const sendEmailHtmlTool = tool({
  description:
    "Send an email with raw HTML content via Resend. Use this tool when the user requests to send an email. Provide the recipient email address(es), subject line, and HTML content. Use responsibly and only when explicitly requested by the user.",
  inputSchema: sendEmailHtmlInputSchema,
  execute: async (input) => {
    console.log("[sendEmailHtml] Tool called with:", JSON.stringify({ ...input, html: input.html.substring(0, 100) + "..." }, null, 2));
    try {
      const result = await sendEmailHtml(input);
      console.log("[sendEmailHtml] Email sent successfully:", result?.id);
      return {
        success: true,
        id: result?.id,
        to: input.to,
        subject: input.subject,
      };
    } catch (error) {
      console.error("[sendEmailHtml] Error sending email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

export const tools = {
  searchToyotaTrims: searchToyotaTrimsTool,
  displayCarRecommendations: displayCarRecommendationsTool,
  sendEmailHtml: sendEmailHtmlTool,
} satisfies ToolSet;

export type ChatTools = InferUITools<typeof tools>;

// Re-export CarCard type for backward compatibility
export type { CarCard } from "@/lib/cars/types";

