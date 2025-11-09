"use client"

import { useState } from "react"

type FinancingOption = {
  term: number
  payment: number
  total: number
  rate: number
}

type FinancingSelectorProps = {
  financing: FinancingOption[]
  onTermChange: (term: number) => void
  selectedTerm: number
}

export function FinancingSelector({
  financing,
  onTermChange,
  selectedTerm,
}: FinancingSelectorProps) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card/80 p-8">
      <h3 className="text-lg font-semibold text-secondary">Financing Terms</h3>
      <p className="mt-2 text-sm text-muted-foreground">Select a term to update your monthly snapshot</p>

      {/* Financing Term Selection Buttons */}
      <div className="mt-6 flex flex-wrap gap-3">
        {financing.map((option) => (
          <button
            key={option.term}
            onClick={() => onTermChange(option.term)}
            className={`rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
              selectedTerm === option.term
                ? "bg-primary text-primary-foreground"
                : "border border-primary/40 bg-background/50 text-secondary hover:border-primary/60 hover:bg-background/70"
            }`}
          >
            {option.term}mo
          </button>
        ))}
      </div>

      {/* Selected Term Details */}
      {financing.map((option) =>
        selectedTerm === option.term ? (
          <div key={option.term} className="mt-6 rounded-2xl border border-border/60 bg-background/50 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly Payment</span>
                <span className="text-lg font-bold text-secondary">${option.payment.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Interest Rate (APR)</span>
                <span className="text-lg font-bold text-secondary">{option.rate}%</span>
              </div>
              <div className="h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-secondary">Total Paid</span>
                <span className="text-lg font-bold text-primary">${option.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : null
      )}
    </div>
  )
}
