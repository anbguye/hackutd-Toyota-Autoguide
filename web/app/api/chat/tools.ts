import { tool, type ToolSet, type InferUITools } from "ai";
import { searchToyotaTrims } from "@/lib/cars/searchToyotaTrims";
import {
  searchToyotaTrimsInputSchema,
  displayCarRecommendationsInputSchema,
} from "@/lib/cars/schemas";
import type { CarCard } from "@/lib/cars/types";

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

export const tools = {
  searchToyotaTrims: searchToyotaTrimsTool,
  displayCarRecommendations: displayCarRecommendationsTool,
} satisfies ToolSet;

export type ChatTools = InferUITools<typeof tools>;

// Re-export CarCard type for backward compatibility
export type { CarCard } from "@/lib/cars/types";

