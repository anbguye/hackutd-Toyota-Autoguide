/**
 * JSON Schemas for Retell Custom Function configuration
 * 
 * These schemas should be copied into Retell's Custom Function configuration
 * when setting up the functions in the Retell dashboard.
 * 
 * Function names in Retell should be:
 * - search_toyota_trims
 * - display_car_recommendations
 * - send_email_html
 */

export const searchToyotaTrimsJsonSchema = {
  type: "object",
  properties: {
    q: {
      type: "string",
      description: "Search query to match against make, model, trim, submodel, or description",
    },
    model: {
      type: "string",
      description: "Specific model name (e.g., Camry, RAV4, Highlander)",
    },
    modelYear: {
      type: "integer",
      minimum: 2000,
      maximum: 2030,
      description: "Model year to filter by",
    },
    trim: {
      type: "string",
      description: "Specific trim level",
    },
    bodyType: {
      type: "string",
      description: "Body type filter (e.g., SUV, Sedan, Truck, Coupe)",
    },
    seatsMin: {
      type: "integer",
      minimum: 2,
      maximum: 9,
      description: "Minimum number of seats",
    },
    driveType: {
      type: "string",
      description: "Drive type (e.g., FWD, AWD, RWD, 4WD)",
    },
    transmission: {
      type: "string",
      description: "Transmission type",
    },
    engineType: {
      type: "string",
      description:
        "Engine type (e.g., Electric, Hybrid, Gas). IMPORTANT: Use this parameter when searching for electric, hybrid, or gas vehicles - do NOT use fuelType.",
    },
    cylinders: {
      type: "integer",
      minimum: 3,
      maximum: 12,
      description: "Number of cylinders",
    },
    hpMin: {
      type: "integer",
      minimum: 0,
      description: "Minimum horsepower",
    },
    torqueMin: {
      type: "integer",
      minimum: 0,
      description: "Minimum torque (ft-lbs)",
    },
    mpgCombinedMin: {
      type: "number",
      minimum: 0,
      description: "Minimum combined MPG",
    },
    mpgCityMin: {
      type: "number",
      minimum: 0,
      description: "Minimum city MPG",
    },
    mpgHighwayMin: {
      type: "number",
      minimum: 0,
      description: "Minimum highway MPG",
    },
    budgetMin: {
      type: "number",
      minimum: 0,
      description:
        "Minimum price (prefer msrp, fallback to invoice if msrp unavailable)",
    },
    budgetMax: {
      type: "number",
      minimum: 0,
      description:
        "Maximum price (prefer msrp, fallback to invoice if msrp unavailable)",
    },
    sortBy: {
      type: "string",
      enum: ["msrp", "mpg", "horsepower", "model"],
      default: "msrp",
      description: "Field to sort by",
    },
    sortDir: {
      type: "string",
      enum: ["asc", "desc"],
      default: "asc",
      description: "Sort direction",
    },
    limit: {
      type: "integer",
      minimum: 1,
      maximum: 24,
      default: 24,
      description: "Maximum number of results to return (max 24)",
    },
  },
  required: [],
} as const;

export const displayCarRecommendationsJsonSchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      description:
        "REQUIRED: Array of car objects from searchToyotaTrims results. Must contain 1-3 items.",
      items: {
        type: "object",
        properties: {
          trim_id: { type: "integer" },
          model_year: { type: ["integer", "null"] },
          make: { type: ["string", "null"] },
          model: { type: ["string", "null"] },
          trim: { type: ["string", "null"] },
          description: { type: ["string", "null"] },
          msrp: { type: ["number", "null"] },
          invoice: { type: ["number", "null"] },
          body_type: { type: ["string", "null"] },
          body_seats: { type: ["integer", "null"] },
          drive_type: { type: ["string", "null"] },
          transmission: { type: ["string", "null"] },
          fuel_type: { type: ["string", "null"] },
          horsepower_hp: { type: ["number", "null"] },
          torque_ft_lbs: { type: ["number", "null"] },
          combined_mpg: { type: ["number", "null"] },
          city_mpg: { type: ["number", "null"] },
          highway_mpg: { type: ["number", "null"] },
          image_url: { type: ["string", "null"] },
        },
        required: ["trim_id"],
      },
    },
  },
  required: ["items"],
} as const;

export { sendEmailHtmlJsonSchema } from "@/lib/email/schemas";

