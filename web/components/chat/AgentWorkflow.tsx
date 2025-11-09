"use client";

import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AgentStep = {
  name: string;
  description: string;
  status: "pending" | "active" | "completed";
};

type AgentWorkflowProps = {
  steps: AgentStep[];
  className?: string;
};

export function AgentWorkflow({ steps, className }: AgentWorkflowProps) {
  return (
    <div className={cn("rounded-lg border border-border/70 bg-background/90 p-4", className)}>
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Multi-Agent System
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Orchestrating specialized agents to find your perfect match
        </p>
      </div>
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.name} className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {step.status === "completed" && (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              )}
              {step.status === "active" && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              {step.status === "pending" && (
                <Circle className="h-4 w-4 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-xs font-semibold",
                  step.status === "active" && "text-primary",
                  step.status === "completed" && "text-secondary",
                  step.status === "pending" && "text-muted-foreground"
                )}
              >
                {step.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

