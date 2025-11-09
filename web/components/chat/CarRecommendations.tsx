"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CarCard } from "@/app/api/chat/tools";

type CarRecommendationsProps = {
  items: CarCard[];
};

function formatPrice(msrp: number | null, invoice: number | null): string {
  const price = msrp ?? invoice;
  if (!price) return "Price TBD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatMPG(city: number | null, highway: number | null, combined: number | null): string {
  if (city && highway) {
    return `${city}/${highway} MPG`;
  }
  if (combined) {
    return `${combined} MPG`;
  }
  return "MPG TBD";
}

function buildCarName(car: CarCard): string {
  const parts = [car.make, car.model, car.trim].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return car.description || "Toyota Vehicle";
}

function CarCard({ car, horizontal = false }: { car: CarCard; horizontal?: boolean }) {
  const carName = buildCarName(car);
  const price = formatPrice(car.msrp, car.invoice);
  const mpg = formatMPG(car.city_mpg, car.highway_mpg, car.combined_mpg);
  const imageUrl = car.image_url || "/placeholder.svg";

  return (
    <Link href={`/car/${car.trim_id}`} className="group relative">
      <article className={`flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/80 shadow-[0_26px_54px_-46px_rgba(15,20,26,0.7)] transition-transform duration-300 hover:-translate-y-1.5 ${horizontal ? "lg:flex-row" : ""}`}>
        <div className={`relative ${horizontal ? "lg:w-1/2" : ""}`}>
          <div className={`relative aspect-[4/3] overflow-hidden bg-background/50 ${horizontal ? "lg:h-full lg:aspect-auto" : ""}`}>
            <div className="absolute inset-0 scale-110">
            <Image
              src={imageUrl}
              alt={carName}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes={horizontal ? "(min-width: 1024px) 50vw, 100vw" : "100vw"}
                style={{ objectPosition: "center 25%" }}
            />
            </div>
          </div>
          <div className="absolute left-5 top-5 flex gap-2">
            {car.model_year && (
              <Badge className="rounded-full border-border/70 bg-background/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-secondary">
                {car.model_year}
              </Badge>
            )}
          </div>
        </div>
        <div className={`flex flex-1 flex-col gap-5 p-6 ${horizontal ? "lg:w-1/2" : ""}`}>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-secondary">{carName}</h3>
            <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">
              {car.body_type || "Vehicle"} • {car.body_seats ? `${car.body_seats} seats` : "Seating TBD"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border/70 bg-background/80 p-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Starting</p>
              <p className="text-lg font-semibold text-secondary">{price}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">MPG</p>
              <p className="text-lg font-semibold text-secondary">{mpg}</p>
            </div>
          </div>
          {car.drive_type && (
            <p className="text-xs text-muted-foreground">
              {car.drive_type}
              {car.transmission ? ` • ${car.transmission}` : ""}
              {car.fuel_type ? ` • ${car.fuel_type}` : ""}
            </p>
          )}
          <Button className={`mt-auto w-full rounded-full bg-primary px-6 py-2 text-sm font-semibold ${horizontal ? "lg:w-auto" : ""}`}>
            View details <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </article>
    </Link>
  );
}

export function CarRecommendations({ items }: CarRecommendationsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  // Single item: horizontal layout on large screens
  if (items.length === 1) {
    return (
      <div className="w-full">
        <CarCard car={items[0]} horizontal={true} />
      </div>
    );
  }

  // Two items: side-by-side with vertical card layout (image on top, content below)
  if (items.length === 2) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((car) => (
          <CarCard key={car.trim_id} car={car} horizontal={false} />
        ))}
      </div>
    );
  }

  // Three items: horizontal row with vertical card layout
  if (items.length === 3) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((car) => (
          <CarCard key={car.trim_id} car={car} horizontal={false} />
        ))}
      </div>
    );
  }

  // Four or more items: grid layout
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
      {items.map((car) => (
        <CarCard key={car.trim_id} car={car} />
      ))}
    </div>
  );
}

