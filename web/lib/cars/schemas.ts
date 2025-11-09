import z from "zod";
import type { CarCard } from "./types";

export const carCardSchema = z.object({
  trim_id: z.number(),
  model_year: z.number().nullable().optional(),
  make: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  trim: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  msrp: z.number().nullable().optional(),
  invoice: z.number().nullable().optional(),
  body_type: z.string().nullable().optional(),
  body_seats: z.number().nullable().optional(),
  drive_type: z.string().nullable().optional(),
  transmission: z.string().nullable().optional(),
  fuel_type: z.string().nullable().optional(),
  horsepower_hp: z.number().nullable().optional(),
  torque_ft_lbs: z.number().nullable().optional(),
  combined_mpg: z.number().nullable().optional(),
  city_mpg: z.number().nullable().optional(),
  highway_mpg: z.number().nullable().optional(),
  image_url: z.string().nullable().optional(),
}) satisfies z.ZodType<CarCard>;

export const searchToyotaTrimsInputSchema = z.object({
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
  engineType: z
    .string()
    .optional()
    .describe(
      "Engine type (e.g., Electric, Hybrid, Gas). IMPORTANT: Use this parameter when searching for electric, hybrid, or gas vehicles - do NOT use fuelType."
    ),
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
});

export const displayCarRecommendationsInputSchema = z.object({
  items: z
    .array(carCardSchema)
    .min(1)
    .max(3)
    .describe(
      "REQUIRED: Array of car objects from searchToyotaTrims results. Must contain 1-3 items. Each item must have trim_id, model, make, and other car properties."
    ),
});

export const scheduleTestDriveInputSchema = z.object({
  trimId: z
    .number()
    .int()
    .positive()
    .describe("The trim_id of the vehicle to schedule a test drive for (required)"),
  preferredDate: z
    .string()
    .describe("Preferred date in ISO format (YYYY-MM-DD) or relative format like 'tomorrow', 'next week'"),
  preferredTime: z
    .string()
    .optional()
    .describe("Preferred time in HH:MM format (24-hour) or relative like 'morning', 'afternoon', 'evening'"),
  location: z
    .string()
    .optional()
    .describe("Preferred dealership location (downtown, north, or south)"),
  contactName: z
    .string()
    .optional()
    .describe("Contact name (will use user's profile if not provided)"),
  contactEmail: z
    .string()
    .email()
    .optional()
    .describe("Contact email (will use user's profile if not provided)"),
  contactPhone: z
    .string()
    .optional()
    .describe("Contact phone number (will use user's profile if not provided)"),
});

