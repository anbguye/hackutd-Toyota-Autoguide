"use client";

import { useState, useEffect, useRef } from "react";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { Send, User, Bot, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { CarRecommendations } from "@/components/chat/CarRecommendations";
import { MemoizedMarkdown } from "@/components/memoized-markdown";
import { supabase } from "@/lib/supabase/client";

type DisplayMessage = {
  id?: string;
  role: "user" | "agent";
  content: string;
  suggestions?: string[];
  parts?: Array<{ type: string; [key: string]: any }>;
  hasToolParts?: boolean;
};

const initialAgentMessage: DisplayMessage = {
  role: "agent",
  content:
    "Hi! I'm your Toyota shopping companion. Based on your preferences, I found some excellent matches for you. You're looking for an SUV around $35,000 for daily commutes with good fuel efficiency, right?",
  suggestions: ["Yes, that's right", "I want to adjust my budget", "Show me the options"],
};

export default function ChatPage() {
  const [input, setInput] = useState("");
  const authTokenRef = useRef<string | null>(null);

  // Get auth token from Supabase session
  useEffect(() => {
    const getAuthToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        authTokenRef.current = session.access_token;
      }
    };
    getAuthToken();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authTokenRef.current = session?.access_token ?? null;
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const { messages: chatMessages, sendMessage, status, error } = useChat({
    id: "toyota-agent-chat",
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: (url, options) => {
        const headers = new Headers(options?.headers);
        if (authTokenRef.current) {
          headers.set("Authorization", `Bearer ${authTokenRef.current}`);
        }
        return fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });
      },
    }),
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Check if the last assistant message has tool calls in progress
  const lastAssistantMessage = chatMessages.filter((m) => m.role === "assistant").at(-1);
  const hasActiveToolCalls =
    lastAssistantMessage?.parts.some(
      (part) =>
        (part.type === "tool-displayCarRecommendations" || part.type === "tool-searchToyotaTrims") &&
        part.state === "input-available"
    ) ?? false;

  const aiMessages: DisplayMessage[] = chatMessages.map((message) => {
    // Extract text parts and deduplicate them within the same message
    const textPartsArray = message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text || "")
      .filter((text) => text.trim().length > 0);
    
    // Remove duplicate consecutive text parts
    const uniqueTextParts: string[] = [];
    textPartsArray.forEach((text) => {
      if (uniqueTextParts.length === 0 || uniqueTextParts[uniqueTextParts.length - 1] !== text.trim()) {
        uniqueTextParts.push(text.trim());
      }
    });
    
    const textParts = uniqueTextParts.join(" ").trim();

    const hasToolParts = message.parts.some(
      (part) => part.type === "tool-displayCarRecommendations" || part.type === "tool-searchToyotaTrims"
    );

    return {
      id: message.id,
      role: message.role === "user" ? "user" : "agent",
      content: textParts,
      parts: message.parts,
      hasToolParts,
      suggestions: undefined, // Explicitly set to undefined to match DisplayMessage type
    };
  });

  // Deduplicate messages: filter out consecutive messages with identical content
  const deduplicatedMessages = aiMessages.filter((message, index, array) => {
    // Always keep user messages
    if (message.role === "user") return true;
    
    // For agent messages, check if the previous message has the same content
    const previousMessage = array[index - 1];
    if (previousMessage && previousMessage.role === "agent" && previousMessage.content === message.content) {
      return false; // Skip duplicate
    }
    
    return true;
  });

  const displayMessages = [initialAgentMessage, ...deduplicatedMessages];

  const handleSend = async () => {
    const messageToSend = input.trim();
    if (!messageToSend || isStreaming) {
      return;
    }

    // Clear input immediately for better UX
    setInput("");

    try {
      await sendMessage({
        parts: [{ type: "text", text: messageToSend }],
      });
    } catch (sendError) {
      console.error("Failed to send message", sendError);
      // Optionally restore the input if sending failed
      // setInput(messageToSend);
    }
  };

  return (
    <RequireAuth>
      <div className="flex min-h-full flex-col bg-background text-foreground">
        <div className="flex-1">
          <div className="toyota-container flex h-full max-w-4xl flex-col py-6">
            <div className="mb-8 rounded-3xl border border-border/70 bg-card/70 px-6 py-5 backdrop-blur">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    Toyota agent live
                  </p>
                  <h2 className="text-lg font-semibold text-secondary">
                    Ask anything about Toyota pricing, trims, or ownership. Responses adapt to your quiz and browsing.
                  </h2>
                </div>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden rounded-4xl border border-border/70 bg-card/60 backdrop-blur">
              <ScrollArea className="h-full p-8">
                <div className="space-y-6">
                  {displayMessages.map((message, i) => {
                    const isUser = message.role === "user";
                    return (
                      <div key={message.id ?? i} className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
                        {!isUser && (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Bot className="h-5 w-5" />
                          </div>
                        )}
                        <div className={`flex max-w-[82%] flex-col gap-3 ${isUser ? "items-end" : "items-start"}`}>
                          {message.content && (
                            <div
                              className={`rounded-3xl px-6 py-4 text-sm leading-relaxed prose prose-sm max-w-none ${
                                isUser
                                  ? "bg-primary text-primary-foreground shadow-[0_24px_48px_-32px_rgba(235,10,30,0.6)]"
                                  : "border border-border/70 bg-background/90"
                              }`}
                            >
                              {isUser ? (
                                message.content
                              ) : (
                                <MemoizedMarkdown content={message.content} id={message.id ?? `msg-${i}`} />
                              )}
                            </div>
                          )}
                          {message.parts && !isUser && (
                            <div className="w-full space-y-4">
                              {message.parts.map((part, partIndex) => {
                                // Handle searchToyotaTrims tool
                                if (part.type === "tool-searchToyotaTrims") {
                                  switch (part.state) {
                                    case "input-available":
                                      return (
                                        <div key={partIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          <span>Searching for cars...</span>
                                        </div>
                                      );
                                    case "output-available":
                                      // Search completed, but we don't display the results here
                                      // The LLM will call displayCarRecommendations with selected items
                                      return null;
                                    case "output-error":
                                      return (
                                        <div key={partIndex} className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                                          <p className="font-semibold">Error searching for cars</p>
                                          <p className="mt-1 text-xs">{part.errorText || "Unknown error"}</p>
                                        </div>
                                      );
                                    default:
                                      return null;
                                  }
                                }

                                // Handle displayCarRecommendations tool
                                if (part.type === "tool-displayCarRecommendations") {
                                  switch (part.state) {
                                    case "input-available":
                                      return (
                                        <div key={partIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                          <span>Loading car recommendations...</span>
                                        </div>
                                      );
                                    case "output-available":
                                      if (part.output?.items) {
                                        return (
                                          <div key={partIndex} className="w-full">
                                            <CarRecommendations items={part.output.items} />
                                          </div>
                                        );
                                      }
                                      return null;
                                    case "output-error":
                                      const errorMsg = part.errorText || "Unknown error";
                                      const isValidationError = errorMsg.includes("validation") || errorMsg.includes("Required") || errorMsg.includes("items");
                                      return (
                                        <div key={partIndex} className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                                          <p className="font-semibold">Error loading car recommendations</p>
                                          <p className="mt-1 text-xs">{errorMsg}</p>
                                          {isValidationError && (
                                            <p className="mt-2 text-xs text-muted-foreground">
                                              The assistant needs to first search for cars, then select items from the results to display.
                                            </p>
                                          )}
                                        </div>
                                      );
                                    default:
                                      return null;
                                  }
                                }
                                return null;
                              })}
                            </div>
                          )}
                          {/* Show loading indicator if streaming and no content yet, or if there are active tool calls */}
                          {!isUser && isStreaming && !message.content && !message.parts?.length && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Thinking...</span>
                            </div>
                          )}
                          {message.suggestions && (
                            <div className="flex flex-wrap gap-2">
                              {message.suggestions.map((suggestion) => (
                                <Button
                                  key={suggestion}
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full border-border/60 text-xs font-semibold text-muted-foreground hover:border-primary/70 hover:text-primary"
                                  onClick={() => setInput(suggestion)}
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                        {isUser && (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="border-t border-border/60 bg-background/80 px-6 py-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Ask about Toyota models, deals, or ownership..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    className="h-12 flex-1 rounded-full border-border/70 bg-card/80 px-5"
                  />
                  <Button
                    onClick={() => {
                      void handleSend();
                    }}
                    size="icon"
                    disabled={isStreaming}
                    className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-[0_24px_48px_-32px_rgba(235,10,30,0.6)] hover:bg-primary/90 disabled:opacity-60"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                {error && (
                  <p className="mt-3 text-center text-xs text-destructive">
                    Something went wrong. Please try again.
                  </p>
                )}
                {!error && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Toyota Agent cross-checks real Toyota data—pricing, incentives, safety, and availability.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
