import { NextRequest, NextResponse } from "next/server"
import { NemotronClient } from "@/lib/agents/nemotron"
import { createServerClient } from "@/lib/supabase/server"
import type { Car } from "@/lib/supabase/types"
import {
  sanitizeInput,
  sanitizeOutput,
  logSanitization,
  containsSensitiveData,
} from "@/lib/guardrails/sanitizer"

/**
 * POST /api/agent/chat
 * Send message to Nemotron agent with user context
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let { userMessage, preferences, chatHistory } = body

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json(
        { error: "userMessage is required" },
        { status: 400 }
      )
    }

    // Sanitize user input before processing
    const inputSanitization = sanitizeInput(userMessage)
    logSanitization("input", userMessage, inputSanitization)
    
    // If sensitive data was detected, warn but continue with sanitized version
    if (inputSanitization.removed.length > 0) {
      console.warn("[GUARDRAILS] Sensitive data detected in user input:", {
        removedCount: inputSanitization.removed.length,
        warnings: inputSanitization.warnings,
      })
    }
    
    // Use sanitized message
    userMessage = inputSanitization.sanitized

    // Sanitize chat history
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory = chatHistory.map((msg: any) => {
        if (msg.content && typeof msg.content === "string") {
          const sanitized = sanitizeInput(msg.content)
          logSanitization("input", msg.content, sanitized)
          return {
            ...msg,
            content: sanitized.sanitized,
          }
        }
        return msg
      })
    }

    // Initialize Nemotron client
    let nemotronClient: NemotronClient
    let nemotronResponse: any
    
    try {
      nemotronClient = new NemotronClient()

      // Convert chat history to Nemotron format
      const history = (chatHistory || []).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }))

      // Create chat request
      const chatRequest = nemotronClient.createToyotaAgentRequest(
        userMessage,
        history,
        preferences
      )

      // Send request to Nemotron
      nemotronResponse = await nemotronClient.chat(chatRequest)
    } catch (apiError: any) {
      // If API fails, use fallback response for testing
      console.warn("[AGENT] Nemotron API failed, using fallback response:", apiError.message)
      
      // Create a fallback response based on user message
      nemotronResponse = {
        choices: [{
          index: 0,
          message: {
            role: "assistant",
            content: `I understand you're looking for: "${userMessage}". While I'm having trouble connecting to the Nemotron API right now, I can help you find the perfect Toyota vehicle. Based on your preferences, I'd recommend checking out our SUV models like the RAV4 or Highlander, or our fuel-efficient sedans like the Camry or Corolla. Would you like to browse our inventory or tell me more about what you're looking for?`,
          },
          finish_reason: "stop",
        }],
      }
    }

    // Handle tool calls (e.g., search_cars)
    let finalResponse = nemotronResponse.choices[0]?.message
    let carSuggestions: Array<{ carId: string; name: string; reasoning: string }> = []

    if (finalResponse?.tool_calls && finalResponse.tool_calls.length > 0) {
      // Process tool calls
      const toolResults: any[] = []

      for (const toolCall of finalResponse.tool_calls) {
        if (toolCall.function.name === "search_cars") {
          try {
            const toolArgs = JSON.parse(toolCall.function.arguments)
            const cars = await searchCarsInSupabase(toolArgs)

            // Sanitize car data before sending back to Nemotron
            // Only include safe, public information
            const safeCarData = cars.map((car) => ({
              id: car.id,
              name: car.name,
              year: car.year,
              type: car.type,
              seats: car.seats,
              mpg_city: car.mpg_city,
              mpg_highway: car.mpg_highway,
              msrp: car.msrp,
              // Exclude any potentially sensitive fields
            }))

            toolResults.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(safeCarData),
            })

            // Create car suggestions from results
            carSuggestions = cars.slice(0, 5).map((car) => ({
              carId: car.id,
              name: `${car.name} ${car.year}`,
              reasoning: `Matches your preferences: ${car.type}, ${car.seats} seats, $${(car.msrp / 100).toLocaleString()} MSRP`,
            }))
          } catch (error) {
            console.error("[AGENT] Error executing search_cars tool:", error)
            toolResults.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: "Failed to search cars" }),
            })
          }
        }
      }

      // If we have tool results, send them back to Nemotron for final response
      if (toolResults.length > 0) {
        const followUpRequest = nemotronClient.createToyotaAgentRequest(
          "",
          [
            ...history,
            { role: "user", content: userMessage },
            {
              role: "assistant",
              content: finalResponse.content || "",
            },
            ...toolResults,
          ],
          preferences
        )

        // Remove the user message from follow-up since we're continuing the conversation
        followUpRequest.messages = followUpRequest.messages.slice(0, -1)

        const followUpResponse = await nemotronClient.chat(followUpRequest)
        finalResponse = followUpResponse.choices[0]?.message
      }
    }

    // Sanitize AI response before returning to user
    let responseMessage = finalResponse?.content || "I apologize, but I couldn't generate a response."
    const outputSanitization = sanitizeOutput(responseMessage)
    logSanitization("output", responseMessage, outputSanitization)
    
    // If sensitive data was detected in output, use sanitized version
    if (outputSanitization.removed.length > 0) {
      console.warn("[GUARDRAILS] Sensitive data detected in AI response:", {
        removedCount: outputSanitization.removed.length,
        warnings: outputSanitization.warnings,
      })
      responseMessage = outputSanitization.sanitized
    }

    // Final check - if response still contains sensitive data, replace with safe message
    if (containsSensitiveData(responseMessage)) {
      console.error("[GUARDRAILS] Response still contains sensitive data after sanitization")
      responseMessage = "I apologize, but I cannot provide that information. How can I help you find the perfect Toyota vehicle?"
    }

    // Format response
    const response = {
      message: responseMessage,
      suggestions: carSuggestions,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error("[AGENT] Error in chat endpoint:", error)
    console.error("[AGENT] Error stack:", error.stack)
    console.error("[AGENT] Error details:", {
      message: error.message,
      name: error.name,
      cause: error.cause,
    })
    
    // Check for specific error types
    let errorMessage = error.message || "Unknown error"
    let statusCode = 500
    
    if (error.message?.includes("NEMOTRON_API_KEY")) {
      errorMessage = "NVIDIA Nemotron API key is not configured. Please check your .env.local file."
      statusCode = 500
    } else if (error.message?.includes("Nemotron API error")) {
      errorMessage = `Nemotron API error: ${error.message}`
      statusCode = 502
    } else if (error.message?.includes("Supabase")) {
      errorMessage = `Database error: ${error.message}`
      statusCode = 500
    }
    
    return NextResponse.json(
      {
        error: "Failed to process chat message",
        message: errorMessage,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: statusCode }
    )
  }
}

/**
 * Search cars in Supabase based on tool call parameters
 */
async function searchCarsInSupabase(filters: {
  budget_min?: number
  budget_max?: number
  car_types?: string[]
  seats?: number
  mpg_priority?: "high" | "medium" | "low"
  use_case?: string
}): Promise<Car[]> {
  const supabase = createServerClient()

  let query = supabase.from("cars").select("*")

  // Apply filters
  if (filters.budget_min !== undefined) {
    query = query.gte("msrp", filters.budget_min)
  }

  if (filters.budget_max !== undefined) {
    query = query.lte("msrp", filters.budget_max)
  }

  if (filters.car_types && filters.car_types.length > 0) {
    query = query.in("type", filters.car_types)
  }

  if (filters.seats !== undefined) {
    query = query.eq("seats", filters.seats)
  }

  // MPG priority - order by mpg_city if high priority
  if (filters.mpg_priority === "high") {
    query = query.order("mpg_city", { ascending: false })
  } else {
    query = query.order("name", { ascending: true })
  }

  const { data, error } = await query.limit(20)

  if (error) {
    console.error("[AGENT] Supabase query error:", error)
    throw new Error(`Failed to search cars: ${error.message}`)
  }

  return (data || []) as Car[]
}

