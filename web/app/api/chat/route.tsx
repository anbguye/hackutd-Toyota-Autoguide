import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { convertToModelMessages, stepCountIs, streamText, type UIDataTypes, type UIMessage } from "ai";
import { createSsrClient } from "@/lib/supabase/server";
import { tools, type ChatTools } from "./tools";
import { use } from "react";

export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

async function getUserPreferences(userId: string) {
  try {
    const supabase = await createSsrClient();
    const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single();

    if (error || !data) {
      return null;
    }

    return {
      budget_min: data.budget_min,
      budget_max: data.budget_max,
      car_types: data.car_types || [],
      seats: data.seats,
      mpg_priority: data.mpg_priority,
      use_case: data.use_case,
    };
  } catch (error) {
    console.error("[chat/route] Failed to load user preferences:", error);
    return null;
  }
}

function buildSystemPrompt(preferences: Awaited<ReturnType<typeof getUserPreferences>>) {
  let systemPrompt =
    "You are a helpful Toyota shopping assistant. Provide accurate, concise answers about Toyota models, pricing, financing, and ownership. If you are unsure, encourage the user to check with a Toyota dealer.\n\n";
  systemPrompt += "Respond to the user in Markdown format. Use formatting like **bold**, *italic*, lists, and other Markdown features to make your responses clear and well-structured.\n\n";

  if (preferences) {
    // Format preferences for better readability (convert cents to dollars for display)
    const budgetMin = preferences.budget_min ? preferences.budget_min / 100 : null;
    const budgetMax = preferences.budget_max ? preferences.budget_max / 100 : null;
    const carTypes = preferences.car_types && preferences.car_types.length > 0 
      ? preferences.car_types.join(", ") 
      : "any type";
    const useCase = preferences.use_case || "not specified";
    const seats = preferences.seats || "not specified";
    const mpgPriority = preferences.mpg_priority || "not specified";
    
    systemPrompt += "=== USER PREFERENCES FROM QUIZ ===\n";
    systemPrompt += `Budget Range: $${budgetMin || 0} - $${budgetMax || 0}\n`;
    systemPrompt += `Preferred Vehicle Type: ${carTypes}\n`;
    systemPrompt += `Seating Needed: ${seats} seats\n`;
    systemPrompt += `Primary Use Case: ${useCase}\n`;
    systemPrompt += `MPG Priority: ${mpgPriority}\n`;
    systemPrompt += "\n";
    systemPrompt += "Raw JSON (for API calls - budget values are in cents):\n";
    systemPrompt += JSON.stringify(preferences, null, 2);
    systemPrompt += "\n\n";
    systemPrompt +=
      "CRITICAL INSTRUCTIONS:\n";
    systemPrompt +=
      "- When talking to the user, ALWAYS use dollar amounts (e.g., $35,000), NEVER mention cents or 'converted from cents'\n";
    systemPrompt +=
      "- When calling searchToyotaTrims, use the budget_min and budget_max values from the Raw JSON (they are in cents)\n";
    systemPrompt +=
      "- Use these preferences as defaults when searching for cars. When searching, prefer filtering by msrp price, but fallback to invoice if msrp is unavailable.\n";
    systemPrompt +=
      "- Reference these preferences naturally in your responses - mention the user's budget range, preferred vehicle type, use case, etc.\n\n";
    systemPrompt +=
      "IMPORTANT WORKFLOW FOR SHOWING CARS:\n";
    systemPrompt +=
      "1. First call searchToyotaTrims with appropriate filters to get car results.\n";
    systemPrompt +=
      "2. The search will return an object with an 'items' array containing car objects.\n";
    systemPrompt +=
      "3. Select 1-3 best matching cars from the 'items' array.\n";
    systemPrompt +=
      "4. Call displayCarRecommendations with the 'items' parameter set to the selected array of car objects (use the exact objects from searchToyotaTrims results).\n";
    systemPrompt +=
      "5. Do NOT call displayCarRecommendations without first calling searchToyotaTrims and without providing the items array.\n\n";
    systemPrompt +=
      "WHEN DISPLAYING CAR RECOMMENDATIONS:\n";
    systemPrompt +=
      "- Keep your text response concise (2-3 sentences maximum).\n";
    systemPrompt +=
      "- Say something like 'Here's what I found, and here's why they might be a good fit for you:' followed by a brief explanation of why these cars match their needs.\n";
    systemPrompt +=
      "- Do NOT mention specific models, years, trims, prices, or any car details in your text response.\n";
    systemPrompt +=
      "- Do NOT enumerate or list the cars - the visual car cards will show all that information.\n";
    systemPrompt +=
      "- Focus ONLY on explaining the 'why' in general terms - why these types of cars are good matches based on their preferences, use case, or search criteria.\n";
    systemPrompt +=
      "- CRITICAL: Only provide ONE text response per car recommendation display. Do NOT repeat the same text multiple times.\n";
    systemPrompt +=
      "- After calling displayCarRecommendations, provide your text explanation ONCE and then stop. Do NOT generate additional text responses.\n";
    systemPrompt +=
      "- Example good response: 'Here's what I found, and here's why they might be a good fit for you: These options match your budget range and offer the features you're looking for. The visual cards below show the specific models and details.'";
  } else {
    systemPrompt +=
      "IMPORTANT WORKFLOW FOR SHOWING CARS:\n";
    systemPrompt +=
      "1. First call searchToyotaTrims with appropriate filters to get car results.\n";
    systemPrompt +=
      "2. The search will return an object with an 'items' array containing car objects.\n";
    systemPrompt +=
      "3. Select 1-3 best matching cars from the 'items' array.\n";
    systemPrompt +=
      "4. Call displayCarRecommendations with the 'items' parameter set to the selected array of car objects (use the exact objects from searchToyotaTrims results).\n";
    systemPrompt +=
      "5. Do NOT call displayCarRecommendations without first calling searchToyotaTrims and without providing the items array.\n\n";
    systemPrompt +=
      "WHEN DISPLAYING CAR RECOMMENDATIONS:\n";
    systemPrompt +=
      "- Keep your text response concise (2-3 sentences maximum).\n";
    systemPrompt +=
      "- Say something like 'Here's what I found, and here's why they might be a good fit for you:' followed by a brief explanation of why these cars match their needs.\n";
    systemPrompt +=
      "- Do NOT mention specific models, years, trims, prices, or any car details in your text response.\n";
    systemPrompt +=
      "- Do NOT enumerate or list the cars - the visual car cards will show all that information.\n";
    systemPrompt +=
      "- Focus ONLY on explaining the 'why' in general terms - why these types of cars are good matches based on their preferences, use case, or search criteria.\n";
    systemPrompt +=
      "- CRITICAL: Only provide ONE text response per car recommendation display. Do NOT repeat the same text multiple times.\n";
    systemPrompt +=
      "- After calling displayCarRecommendations, provide your text explanation ONCE and then stop. Do NOT generate additional text responses.\n";
    systemPrompt +=
      "- Example good response: 'Here's what I found, and here's why they might be a good fit for you: These options match your budget range and offer the features you're looking for. The visual cards below show the specific models and details.'";
  }

  return systemPrompt;
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return new Response("OPENROUTER_API_KEY is not configured.", { status: 500 });
  }

  let body: { messages?: UIMessage[] } = {};

  try {
    body = await req.json();
  } catch {
    return new Response("Invalid request body.", { status: 400 });
  }

  if (!body.messages) {
    return new Response("Missing messages in request body.", { status: 400 });
  }

  // Load user preferences
  let preferences = null;
  try {
    const supabase = await createSsrClient();
    const {
      data: { user: cookieUser },
      error: cookieUserError,
    } = await supabase.auth.getUser();

    let user = cookieUser;

    // If no user from cookies, try Authorization header
    if (!user) {
      const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

      if (token) {
        const {
          data: { user: headerUser },
        } = await supabase.auth.getUser(token);

        if (headerUser) {
          user = headerUser;
        }
      }
    }

    if (user) {
      preferences = await getUserPreferences(user.id);
    }
  } catch (error) {
    console.error("[chat/route] Failed to get user:", error);
  }

  const openrouter = createOpenRouter({
    apiKey,
    headers: {
      ...(process.env.OPENROUTER_SITE_URL ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL } : {}),
      ...(process.env.OPENROUTER_APP_NAME ? { "X-Title": process.env.OPENROUTER_APP_NAME } : {}),
    },
  });

  try {
    const result = streamText({
      model: openrouter.chat("nvidia/llama-3.3-nemotron-super-49b-v1.5"),
      system: buildSystemPrompt(preferences),
      messages: convertToModelMessages(body.messages),
      stopWhen: stepCountIs(10),
      tools,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat generation failed", error);
    return new Response("Failed to generate response.", { status: 500 });
  }
}