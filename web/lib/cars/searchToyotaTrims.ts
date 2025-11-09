import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  SearchToyotaTrimsInput,
  SearchToyotaTrimsResult,
  CarCard,
} from "./types";

type SupabaseClientType = ReturnType<typeof createSupabaseServerClient>;

/**
 * Helper function to sanitize string fields
 */
function sanitizeString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return String(value);
  return value.trim() || null;
}

/**
 * Extract transmission from malformed drive_type field
 */
function extractTransmission(
  driveType: string | null,
  transmission: string | null
): string | null {
  // If transmission is already valid, use it
  if (transmission && typeof transmission === "string" && transmission.trim()) {
    return transmission.trim();
  }

  // Check if drive_type contains malformed transmission data
  if (driveType && typeof driveType === "string") {
    // Pattern: "drive_type,\"transmission\":\"value\""
    // When parsed from JSON, backslashes are removed, so we look for: drive_type,"transmission":"value"
    // Try matching with quotes (most common case)
    const quotedMatch = driveType.match(/["']transmission["']\s*:\s*["']([^"']+)["']/i);
    if (quotedMatch && quotedMatch[1]) {
      return quotedMatch[1].trim();
    }

    // Try with literal backslashes (if stored as-is in DB)
    const escapedMatch = driveType.match(/\\["']transmission\\["']\s*:\s*\\["']([^"']+)\\["']/);
    if (escapedMatch && escapedMatch[1]) {
      return escapedMatch[1].trim();
    }

    // Pattern: "drive_type,transmission:\"value\""
    const colonMatch = driveType.match(/[,]\s*transmission\s*:\s*["']([^"']+)["']/i);
    if (colonMatch && colonMatch[1]) {
      return colonMatch[1].trim();
    }

    // Pattern without quotes: transmission:value
    const unescapedMatch = driveType.match(/transmission\s*:\s*([^,"']+)/i);
    if (unescapedMatch && unescapedMatch[1]) {
      return unescapedMatch[1].trim();
    }
  }

  return transmission ? sanitizeString(transmission) : null;
}

/**
 * Clean drive_type by removing embedded transmission data
 */
function cleanDriveType(driveType: string | null): string | null {
  if (!driveType || typeof driveType !== "string") return sanitizeString(driveType);

  // Remove any embedded transmission data (handle literal backslash-escaped quotes)
  let cleaned = driveType
    .replace(/,\s*\\["']transmission\\["']\s*:\s*\\["'][^"']+\\["']/gi, "")
    .replace(/,\s*["']transmission["']\s*:\s*["'][^"']+["']/gi, "")
    .replace(/,\s*transmission\s*:\s*["'][^"']+["']/gi, "")
    .replace(/,\s*transmission["']?\s*:\s*["']?[^,"']+/gi, "")
    .trim();

  return cleaned || null;
}

/**
 * Search Toyota trim specifications from the database
 * @param input - Search parameters
 * @param options - Optional configuration including custom Supabase client
 * @returns Search results with items and count
 */
export async function searchToyotaTrims(
  input: SearchToyotaTrimsInput,
  options?: { supabase?: SupabaseClientType }
): Promise<SearchToyotaTrimsResult> {
  const supabase = options?.supabase ?? createSupabaseServerClient();

  let query = supabase.from("toyota_trim_specs").select("*");

  // Text search across multiple fields
  if (input.q) {
    const searchTerm = `%${input.q}%`;
    query = query.or(
      `make.ilike.${searchTerm},model.ilike.${searchTerm},trim.ilike.${searchTerm},submodel.ilike.${searchTerm},description.ilike.${searchTerm}`
    );
  }

  // Exact filters
  if (input.model) {
    query = query.ilike("model", `%${input.model}%`);
  }
  if (input.modelYear) {
    query = query.eq("model_year", input.modelYear);
  }
  if (input.trim) {
    query = query.ilike("trim", `%${input.trim}%`);
  }
  if (input.bodyType) {
    query = query.ilike("body_type", `%${input.bodyType}%`);
  }
  if (input.seatsMin) {
    query = query.gte("body_seats", input.seatsMin);
  }
  if (input.driveType) {
    query = query.ilike("drive_type", `%${input.driveType}%`);
  }
  if (input.transmission) {
    query = query.ilike("transmission", `%${input.transmission}%`);
  }
  if (input.engineType) {
    query = query.ilike("engine_type", `%${input.engineType}%`);
  }
  if (input.cylinders) {
    query = query.eq("cylinders", input.cylinders);
  }
  if (input.hpMin) {
    query = query.gte("horsepower_hp", input.hpMin);
  }
  if (input.torqueMin) {
    query = query.gte("torque_ft_lbs", input.torqueMin);
  }
  if (input.mpgCombinedMin) {
    query = query.gte("combined_mpg", input.mpgCombinedMin);
  }
  if (input.mpgCityMin) {
    query = query.gte("city_mpg", input.mpgCityMin);
  }
  if (input.mpgHighwayMin) {
    query = query.gte("highway_mpg", input.mpgHighwayMin);
  }

  // Budget filtering will be done in post-processing to handle msrp/invoice fallback

  // Sorting - increase limit before filtering to ensure we have enough results
  const sortField =
    input.sortBy === "msrp"
      ? "msrp"
      : input.sortBy === "mpg"
        ? "combined_mpg"
        : input.sortBy === "horsepower"
          ? "horsepower_hp"
          : "model";
  const fetchLimit =
    input.budgetMin !== undefined || input.budgetMax !== undefined
      ? (input.limit ?? 24) * 2
      : input.limit ?? 24;
  query = query.order(sortField, {
    ascending: input.sortDir === "asc",
    nullsFirst: false,
  });
  query = query.limit(fetchLimit);

  const { data, error } = await query;

  if (error) {
    console.error("[searchToyotaTrims] Supabase query error:", error);
    return {
      items: [],
      count: 0,
    };
  }

  let items: CarCard[] = (data || []).map((row) => {
    const driveTypeRaw = sanitizeString(row.drive_type);
    const transmissionRaw = sanitizeString(row.transmission);

    // Extract transmission from malformed drive_type if needed
    const transmission = extractTransmission(driveTypeRaw, transmissionRaw);
    const driveType = cleanDriveType(driveTypeRaw);

    return {
      trim_id: row.trim_id,
      model_year: row.model_year,
      make: sanitizeString(row.make),
      model: sanitizeString(row.model),
      trim: sanitizeString(row.trim),
      description: sanitizeString(row.description),
      msrp: row.msrp,
      invoice: row.invoice,
      body_type: sanitizeString(row.body_type),
      body_seats: row.body_seats,
      drive_type: driveType,
      transmission: transmission,
      fuel_type: sanitizeString(row.fuel_type),
      horsepower_hp: row.horsepower_hp,
      torque_ft_lbs: row.torque_ft_lbs,
      combined_mpg: row.combined_mpg,
      city_mpg: row.city_mpg,
      highway_mpg: row.highway_mpg,
      image_url: sanitizeString(row.image_url),
    };
  });

  // Post-process: if budget filters were applied, filter by msrp/invoice fallback
  // NOTE: budgetMin/budgetMax and msrp/invoice are both in DOLLARS now
  if (input.budgetMin !== undefined || input.budgetMax !== undefined) {
    items = items.filter((item) => {
      const price = item.msrp ?? item.invoice;
      if (price === null || price === undefined) return false;
      if (input.budgetMin !== undefined && price < input.budgetMin) return false;
      if (input.budgetMax !== undefined && price > input.budgetMax) return false;
      return true;
    });

    // Re-sort after filtering if sorting by price
    if (input.sortBy === "msrp") {
      items.sort((a, b) => {
        const priceA = a.msrp ?? a.invoice ?? Number.POSITIVE_INFINITY;
        const priceB = b.msrp ?? b.invoice ?? Number.POSITIVE_INFINITY;
        return input.sortDir === "asc" ? priceA - priceB : priceB - priceA;
      });
    }
  }

  // Apply limit after all filtering
  const limitedItems = items.slice(0, input.limit ?? 24);

  return {
    items: limitedItems,
    count: limitedItems.length,
  };
}

