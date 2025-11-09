"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { pulseOnChange } from "@/lib/motion/variants"
import { useReducedMotion } from "@/lib/motion/useReducedMotion"
import { NumberCounter } from "@/components/motion/NumberCounter"

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
  const prefersReducedMotion = useReducedMotion()
  const [pulseKey, setPulseKey] = useState(0)
  const selectedOption = financing.find((opt) => opt.term === selectedTerm)

  useEffect(() => {
    if (!prefersReducedMotion) {
      setPulseKey((prev) => prev + 1)
    }
  }, [selectedTerm, prefersReducedMotion])

  return (
    <div className="rounded-3xl border border-border/70 bg-card/80 backdrop-blur-sm p-8 border-white/10">
      <h3 className="text-lg font-semibold text-secondary">Financing Terms</h3>
      <p className="mt-2 text-sm text-muted-foreground">Select a term to update your monthly snapshot</p>

      {/* Financing Term Selection Buttons */}
      <div className="mt-6 flex flex-wrap gap-3">
        {financing.map((option) => (
          <motion.button
            key={option.term}
            onClick={() => onTermChange(option.term)}
            className={`rounded-lg px-6 py-3 text-sm font-semibold transition-all ${
              selectedTerm === option.term
                ? "bg-primary text-primary-foreground"
                : "border border-primary/40 bg-background/50 text-secondary hover:border-primary/60 hover:bg-background/70"
            }`}
            whileHover={prefersReducedMotion ? {} : { scale: 1.04 }}
            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
          >
            {option.term}mo
          </motion.button>
        ))}
      </div>

      {/* Selected Term Details */}
      <AnimatePresence mode="wait">
        {selectedOption && (
          <motion.div
            key={selectedTerm}
            className="mt-6 rounded-2xl border border-border/60 bg-background/50 p-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly Payment</span>
                <motion.span
                  key={`payment-${pulseKey}`}
                  className="text-lg font-bold text-secondary"
                  variants={prefersReducedMotion ? {} : pulseOnChange}
                  animate={prefersReducedMotion ? {} : "pulse"}
                >
                  <NumberCounter value={selectedOption.payment} prefix="$" />
                </motion.span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Interest Rate (APR)</span>
                <span className="text-lg font-bold text-secondary">{selectedOption.rate}%</span>
              </div>
              <div className="h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-secondary">Total Paid</span>
                <motion.span
                  key={`total-${pulseKey}`}
                  className="text-lg font-bold text-primary"
                  variants={prefersReducedMotion ? {} : pulseOnChange}
                  animate={prefersReducedMotion ? {} : "pulse"}
                >
                  <NumberCounter value={selectedOption.total} prefix="$" />
                </motion.span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
