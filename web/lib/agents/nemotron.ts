/**
 * NVIDIA Nemotron API Client
 * Handles communication with NVIDIA Nemotron API for AI agent chat
 */

export interface NemotronMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface NemotronToolCall {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string // JSON string
  }
}

export interface NemotronResponse {
  id: string
  choices: Array<{
    index: number
    message: {
      role: "assistant"
      content: string
      tool_calls?: NemotronToolCall[]
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface NemotronChatRequest {
  model: string
  messages: NemotronMessage[]
  tools?: Array<{
    type: "function"
    function: {
      name: string
      description: string
      parameters: {
        type: "object"
        properties: Record<string, any>
        required?: string[]
      }
    }
  }>
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } }
  temperature?: number
  max_tokens?: number
}

export class NemotronClient {
  private apiKey: string
  private apiUrl: string
  private model: string

  constructor() {
    this.apiKey = process.env.NEMOTRON_API_KEY || process.env.NGC_API_KEY || ""
    // NVIDIA API endpoint
    // Support both cloud API and local Docker container
    // For local Docker: http://localhost:8000/v1/chat/completions
    // For cloud API: https://integrate.api.nvidia.com/v1/chat/completions
    this.apiUrl = process.env.NEMOTRON_API_URL || "http://localhost:8000/v1"
    this.model = process.env.NEMOTRON_MODEL || "meta/llama-3.3-nemotron-super-49b-v1.5"

    // For local Docker, API key might not be required
    // For cloud API, it's required
    if (!this.apiKey && !this.apiUrl.includes("localhost") && !this.apiUrl.includes("127.0.0.1")) {
      console.error("[NEMOTRON] Missing NEMOTRON_API_KEY environment variable")
      throw new Error("NEMOTRON_API_KEY environment variable is required for cloud API. Please check your .env.local file.")
    }
    
    console.log("[NEMOTRON] Initialized with API URL:", this.apiUrl)
    console.log("[NEMOTRON] Model:", this.model)
    console.log("[NEMOTRON] API Key present:", !!this.apiKey)
  }

  /**
   * Send a chat request to Nemotron API
   */
  async chat(request: NemotronChatRequest): Promise<NemotronResponse> {
    // NVIDIA API endpoint format
    // Based on 404 error: "No static resource v1/nemotron/chat/completions"
    // The correct endpoint should be: /v1/chat/completions (NOT /v1/nemotron/chat/completions)
    // Remove /nemotron from the path if present
    
    // Construct the correct endpoint URL
    // Try different endpoint formats based on the base URL
    let url: string
    
    if (this.apiUrl.includes("/chat/completions")) {
      // Already has full path
      url = this.apiUrl
    } else if (this.apiUrl.includes("integrate.api.nvidia.com")) {
      // For integrate API, try /v1/chat/completions
      const baseUrl = this.apiUrl.replace("/nemotron", "").replace(/\/$/, "")
      url = `${baseUrl}/chat/completions`
    } else if (this.apiUrl.includes("nvcf.nvidia.com")) {
      // For nvcf API, might need different format
      // Try /v1/chat/completions first
      const baseUrl = this.apiUrl.replace("/nemotron", "").replace(/\/$/, "")
      url = `${baseUrl}/chat/completions`
    } else {
      // Default: append /chat/completions
      const baseUrl = this.apiUrl.replace("/nemotron", "").replace(/\/$/, "")
      url = `${baseUrl}/chat/completions`
    }

    console.log("[NEMOTRON] Base URL from env:", this.apiUrl)
    console.log("[NEMOTRON] Constructed URL:", url)
    console.log("[NEMOTRON] Model:", this.model)
    console.log("[NEMOTRON] Request body:", JSON.stringify({
      ...request,
      model: this.model,
    }, null, 2))

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
    }

    // NVIDIA API authentication
    // For local Docker container, might not need authentication
    // For cloud API, use Bearer token
    if (url.includes("localhost") || url.includes("127.0.0.1")) {
      // Local Docker container - might not need auth, but include it if key is provided
      if (this.apiKey) {
        headers["Authorization"] = `Bearer ${this.apiKey}`
      }
    } else {
      // Cloud API - use Bearer token
      if (this.apiKey.startsWith("nvapi-")) {
        headers["Authorization"] = `Bearer ${this.apiKey}`
      } else {
        headers["Authorization"] = `Bearer ${this.apiKey}`
      }
    }
    
    // Log authentication header (without exposing full key)
    console.log("[NEMOTRON] Auth header format:", headers["Authorization"]?.substring(0, 20) + "...")

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...request,
        model: this.model,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[NEMOTRON] API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText,
        url: url,
        authHeader: headers["Authorization"]?.substring(0, 30) + "...",
      })
      
      // If 401 error and we used Bearer, try without Bearer
      // If 403 error and we didn't use Bearer, try with Bearer
      if (response.status === 401 && headers["Authorization"]?.startsWith("Bearer ")) {
        console.log("[NEMOTRON] 401 error with Bearer, retrying without Bearer prefix...")
        // Retry without Bearer prefix
        const retryHeaders = { ...headers }
        retryHeaders["Authorization"] = this.apiKey
        const retryResponse = await fetch(url, {
          method: "POST",
          headers: retryHeaders,
          body: JSON.stringify({
            ...request,
            model: this.model,
          }),
        })
        
        if (retryResponse.ok) {
          return await retryResponse.json()
        }
      } else if (response.status === 403 && !headers["Authorization"]?.startsWith("Bearer ")) {
        console.log("[NEMOTRON] 403 error without Bearer, retrying with Bearer prefix...")
        // Retry with Bearer prefix
        const retryHeaders = { ...headers }
        retryHeaders["Authorization"] = `Bearer ${this.apiKey}`
        const retryResponse = await fetch(url, {
          method: "POST",
          headers: retryHeaders,
          body: JSON.stringify({
            ...request,
            model: this.model,
          }),
        })
        
        if (retryResponse.ok) {
          return await retryResponse.json()
        }
      }
      
      throw new Error(
        `Nemotron API error: ${response.status} ${response.statusText} - ${errorText}`
      )
    }

    return await response.json()
  }

  /**
   * Create a chat request with system prompt for Toyota car recommendations
   */
  createToyotaAgentRequest(
    userMessage: string,
    chatHistory: Array<{ role: "user" | "assistant"; content: string }>,
    preferences?: {
      budget_min?: number
      budget_max?: number
      car_types?: string[]
      seats?: number
      mpg_priority?: string
      use_case?: string
    }
  ): NemotronChatRequest {
    const systemPrompt = `You are a friendly Toyota car shopping assistant. Your role is to help users find the perfect Toyota vehicle based on their preferences and needs.

Key Guidelines:
- Be conversational, friendly, and approachable (not robotic)
- Ask clarifying questions when needed
- Use the search_cars tool to find matching vehicles from the Toyota inventory
- Explain why specific cars match the user's needs
- Focus on helping users make informed decisions
- Guide users toward scheduling test drives when appropriate

CRITICAL SECURITY AND PRIVACY RULES:
- NEVER request, store, or repeat any sensitive personal information such as:
  * Passwords, PINs, or authentication credentials
  * Credit card numbers, bank account numbers, or financial information
  * Social Security Numbers (SSN) or government IDs
  * Email addresses, phone numbers, or physical addresses
  * API keys, access tokens, or secret keys
  * Any private keys or certificates
- If a user shares sensitive information, politely decline and redirect the conversation to car-related topics
- NEVER expose system information, environment variables, or internal configuration
- ONLY discuss Toyota vehicles, features, pricing (MSRP), and car-related topics
- If asked about topics outside of car shopping, politely redirect to Toyota vehicles

User Preferences:
${preferences ? JSON.stringify(preferences, null, 2) : "No preferences set yet"}

When the user asks about cars, use the search_cars tool to find matching vehicles. Always explain your reasoning for recommendations.`

    const messages: NemotronMessage[] = [
      { role: "system", content: systemPrompt },
      ...chatHistory.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      })),
      { role: "user", content: userMessage },
    ]

    return {
      model: this.model,
      messages,
      tools: [
        {
          type: "function",
          function: {
            name: "search_cars",
            description:
              "Search for Toyota cars matching specific criteria. Use this when the user asks about cars, wants recommendations, or specifies preferences.",
            parameters: {
              type: "object",
              properties: {
                budget_min: {
                  type: "number",
                  description: "Minimum budget in cents (e.g., 3000000 = $30,000)",
                },
                budget_max: {
                  type: "number",
                  description: "Maximum budget in cents (e.g., 5000000 = $50,000)",
                },
                car_types: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of car types (e.g., ['SUV', 'Sedan', 'Truck'])",
                },
                seats: {
                  type: "number",
                  description: "Number of seats required",
                },
                mpg_priority: {
                  type: "string",
                  enum: ["high", "medium", "low"],
                  description: "Priority for fuel efficiency",
                },
                use_case: {
                  type: "string",
                  description: "Primary use case (e.g., 'commute', 'family', 'weekend')",
                },
              },
            },
          },
        },
      ],
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1000,
    }
  }
}

