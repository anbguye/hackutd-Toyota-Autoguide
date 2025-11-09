import { tool, type ToolSet, type InferUITools } from "ai";
import z from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CarCard = {
  trim_id: number;
  model_year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  description: string | null;
  msrp: number | null;
  invoice: number | null;
  body_type: string | null;
  body_seats: number | null;
  drive_type: string | null;
  transmission: string | null;
  fuel_type: string | null;
  horsepower_hp: number | null;
  torque_ft_lbs: number | null;
  combined_mpg: number | null;
  city_mpg: number | null;
  highway_mpg: number | null;
  image_url: string | null;
};

const searchToyotaTrimsTool = tool({
  description:
    "Search and filter Toyota trim specifications from the database. Use this to find cars matching user preferences or search criteria. Returns up to 24 results.",
  inputSchema: z.object({
    q: z
      .string()
      .optional()
      .describe("Search query to match against make, model, trim, submodel, or description"),
    model: z.string().optional().describe("Specific model name (e.g., Camry, RAV4, Highlander)"),
    modelYear: z
      .number()
      .int()
      .min(2000)
      .max(2030)
      .optional()
      .describe("Model year to filter by"),
    trim: z.string().optional().describe("Specific trim level"),
    bodyType: z
      .string()
      .optional()
      .describe("Body type filter (e.g., SUV, Sedan, Truck, Coupe)"),
    seatsMin: z
      .number()
      .int()
      .min(2)
      .max(9)
      .optional()
      .describe("Minimum number of seats"),
    driveType: z
      .string()
      .optional()
      .describe("Drive type (e.g., FWD, AWD, RWD, 4WD)"),
    transmission: z.string().optional().describe("Transmission type"),
    fuelType: z
      .string()
      .optional()
      .describe("Fuel type (e.g., Gasoline, Hybrid, Electric)"),
    cylinders: z
      .number()
      .int()
      .min(3)
      .max(12)
      .optional()
      .describe("Number of cylinders"),
    hpMin: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Minimum horsepower"),
    torqueMin: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("Minimum torque (ft-lbs)"),
    mpgCombinedMin: z
      .number()
      .min(0)
      .optional()
      .describe("Minimum combined MPG"),
    mpgCityMin: z
      .number()
      .min(0)
      .optional()
      .describe("Minimum city MPG"),
    mpgHighwayMin: z
      .number()
      .min(0)
      .optional()
      .describe("Minimum highway MPG"),
    budgetMin: z
      .number()
      .min(0)
      .optional()
      .describe("Minimum price (prefer msrp, fallback to invoice if msrp unavailable)"),
    budgetMax: z
      .number()
      .min(0)
      .optional()
      .describe("Maximum price (prefer msrp, fallback to invoice if msrp unavailable)"),
    sortBy: z
      .enum(["msrp", "mpg", "horsepower", "model"])
      .optional()
      .default("msrp")
      .describe("Field to sort by"),
    sortDir: z
      .enum(["asc", "desc"])
      .optional()
      .default("asc")
      .describe("Sort direction"),
    limit: z
      .number()
      .int()
      .min(1)
      .max(24)
      .optional()
      .default(24)
      .describe("Maximum number of results to return (max 24)"),
  }),
  execute: async (input) => {
    console.log(input)
    
    const supabase = createSupabaseServerClient();

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
    if (input.fuelType) {
      query = query.ilike("fuel_type", `%${input.fuelType}%`);
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
    const sortField = input.sortBy === "msrp" ? "msrp" : input.sortBy === "mpg" ? "combined_mpg" : input.sortBy === "horsepower" ? "horsepower_hp" : "model";
    const fetchLimit = input.budgetMin !== undefined || input.budgetMax !== undefined ? (input.limit ?? 24) * 2 : input.limit ?? 24;
    query = query.order(sortField, { ascending: input.sortDir === "asc", nullsFirst: false });
    query = query.limit(fetchLimit);

    const { data, error } = await query;

    if (error) {
      console.error("[tools] Supabase query error:", error);
      return {
        error: "Failed to search Toyota trims",
        items: [],
      };
    }

    // Helper function to sanitize string fields and extract transmission from malformed drive_type
    const sanitizeString = (value: unknown): string | null => {
      if (value === null || value === undefined) return null;
      if (typeof value !== "string") return String(value);
      return value.trim() || null;
    };

    const extractTransmission = (driveType: string | null, transmission: string | null): string | null => {
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
    };

    const cleanDriveType = (driveType: string | null): string | null => {
      if (!driveType || typeof driveType !== "string") return sanitizeString(driveType);
      
      // Remove any embedded transmission data (handle literal backslash-escaped quotes)
      let cleaned = driveType
        .replace(/,\s*\\["']transmission\\["']\s*:\s*\\["'][^"']+\\["']/gi, "")
        .replace(/,\s*["']transmission["']\s*:\s*["'][^"']+["']/gi, "")
        .replace(/,\s*transmission\s*:\s*["'][^"']+["']/gi, "")
        .replace(/,\s*transmission["']?\s*:\s*["']?[^,"']+/gi, "")
        .trim();
      
      return cleaned || null;
    };

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
  },
});

const displayCarRecommendationsTool = tool({
  description:
    "Display up to 3 car recommendations as visual cards in the chat interface. IMPORTANT: You MUST first call searchToyotaTrims to get car results, then select 1-3 items from the 'items' array in the search results, and pass those exact items to this tool. The items parameter is REQUIRED and must be an array of car objects from the searchToyotaTrims results.",
  inputSchema: z.object({
    items: z
      .array(
        z.object({
          trim_id: z.number(),
          model_year: z.number().nullable(),
          make: z.string().nullable(),
          model: z.string().nullable(),
          trim: z.string().nullable(),
          description: z.string().nullable(),
          msrp: z.number().nullable(),
          invoice: z.number().nullable(),
          body_type: z.string().nullable(),
          body_seats: z.number().nullable(),
          drive_type: z.string().nullable(),
          transmission: z.string().nullable(),
          fuel_type: z.string().nullable(),
          horsepower_hp: z.number().nullable(),
          torque_ft_lbs: z.number().nullable(),
          combined_mpg: z.number().nullable(),
          city_mpg: z.number().nullable(),
          highway_mpg: z.number().nullable(),
          image_url: z.string().nullable(),
        })
      )
      .min(1)
      .max(3)
      .describe("REQUIRED: Array of car objects from searchToyotaTrims results. Must contain 1-3 items. Each item must have trim_id, model, make, and other car properties."),
  }),
  execute: async (input) => {
    if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
      return {
        error: "Items array is required and must contain at least one car object from searchToyotaTrims results.",
        items: [],
        count: 0,
      };
    }

    const items = input.items.slice(0, 3);
    return {
      items,
      count: items.length,
    };
  },
});

export const tools = {
  searchToyotaTrims: searchToyotaTrimsTool,
  displayCarRecommendations: displayCarRecommendationsTool,
} satisfies ToolSet;

export type ChatTools = InferUITools<typeof tools>;

