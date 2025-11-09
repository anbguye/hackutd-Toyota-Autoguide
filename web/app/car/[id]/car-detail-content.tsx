"use client"

import { useState } from "react"
import { DollarSign } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TotalMonthlySnapshot } from "./total-monthly-snapshot"

type FinancingOption = {
  term: number
  payment: number
  total: number
  rate: number
}

type InsuranceEstimate = {
  monthly: number
  annual: number
}

type CarDetail = {
  name: string
  engineType?: string
  horsepower?: number
  torque?: number
  transmission?: string
  type: string
  seats: number
  groundClearance?: number
  cargoCapacity?: number
}

type CarDetailContentProps = {
  car: CarDetail
  insurance: InsuranceEstimate
  financing: FinancingOption[]
  maintenanceReserve: number
}

function SpecGroup({
  title,
  specs,
}: {
  title: string
  specs: Array<{ label: string; value: string }>
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">{title}</h3>
      <div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-6">
        {specs.map((spec) => (
          <div key={spec.label} className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{spec.label}</span>
            <span className="font-semibold text-secondary">{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function capitalizeWords(str: string): string {
  return str
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

export function CarDetailContent({
  car,
  insurance,
  financing,
  maintenanceReserve,
}: CarDetailContentProps) {
  const [selectedTerm, setSelectedTerm] = useState(36)

  return (
    <Tabs defaultValue="costs" className="space-y-8">
      <TabsList className="grid gap-3 rounded-full bg-background/40 p-2 sm:grid-cols-2">
        <TabsTrigger
          value="costs"
          className="rounded-full px-6 py-3 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Total Costs
        </TabsTrigger>
        <TabsTrigger
          value="specs"
          className="rounded-full px-6 py-3 text-sm font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
        >
          Full Specs
        </TabsTrigger>
      </TabsList>

      <TabsContent value="costs" className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          {/* Insurance Estimate */}
          <div className="rounded-3xl border border-border/70 bg-card/80 p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-secondary">Insurance Estimate</h3>
                <p className="text-sm text-muted-foreground">Based on an average Toyota driver profile</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-background/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Monthly</p>
                <p className="mt-3 text-2xl font-bold text-secondary">${insurance.monthly}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Annual</p>
                <p className="mt-3 text-2xl font-bold text-secondary">${insurance.annual}</p>
              </div>
            </div>
          </div>

          {/* Financing Plans Breakdown */}
          <div className="rounded-3xl border border-border/70 bg-card/80 p-8">
            <h3 className="text-lg font-semibold text-secondary">Financing Plans</h3>
            <div className="mt-6 grid gap-4 grid-cols-4">
              {financing.map((option) => (
                <button
                  key={option.term}
                  onClick={() => setSelectedTerm(option.term)}
                  className={`rounded-2xl p-4 text-center transition-all ${
                    selectedTerm === option.term
                      ? "border-2 border-primary bg-primary/10"
                      : "border border-border/60 bg-background/80 hover:border-primary/60"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    {option.term}mo
                  </p>
                  <p className="mt-3 text-xl font-bold text-secondary">${option.payment}</p>
                  <p className="mt-2 text-xs text-muted-foreground">/mo</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Total Monthly Snapshot */}
        <TotalMonthlySnapshot
          financing={financing}
          insuranceMonthly={insurance.monthly}
          maintenanceReserve={maintenanceReserve}
          msrp={0}
          selectedTerm={selectedTerm}
        />
      </TabsContent>

      <TabsContent value="specs" className="rounded-3xl border border-border/70 bg-card/80 p-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <SpecGroup
            title="Performance"
            specs={[
              { label: "Engine", value: car.engineType ? capitalizeWords(car.engineType) : "N/A" },
              { label: "Horsepower", value: car.horsepower ? `${car.horsepower} hp` : "N/A" },
              { label: "Torque", value: car.torque ? `${car.torque} lb-ft` : "N/A" },
              { label: "Transmission", value: car.transmission ? capitalizeWords(car.transmission) : "N/A" },
            ]}
          />
          <SpecGroup
            title="Dimensions"
            specs={[
              { label: "Body Type", value: capitalizeWords(car.type) || "N/A" },
              { label: "Seating", value: car.seats ? `${car.seats} Seats` : "N/A" },
              { label: "Ground clearance", value: car.groundClearance ? `${car.groundClearance} in` : "N/A" },
              { label: "Cargo space", value: car.cargoCapacity ? `${car.cargoCapacity} cu ft` : "N/A" },
            ]}
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}
